"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shareRecipe = exports.respondToConnection = exports.sendConnectionRequest = exports.generateWeeklyPlan = exports.processPinterestImport = exports.parseScannedRecipe = exports.importRecipeFromUrl = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const firestore_1 = require("firebase-functions/v2/firestore");
const ai_1 = require("./ai");
const scrapers_1 = require("./scrapers");
const ai_planner_1 = require("./ai-planner");
// Initialize Firebase Admin
admin.initializeApp();
// Initialize Stripe with Secret Key from Firebase Config/Environment Secrets
const stripeSec = process.env.STRIPE_SECRET_KEY || "sk_test_PLACEHOLDER";
const stripe = new stripe_1.default(stripeSec, {
    // @ts-expect-error - using a beta API version
    apiVersion: '2025-02-24.acacia',
});
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
// ==========================================
// CREATE CHECKOUT SESSION
// ==========================================
app.post("/create-checkout-session", async (req, res) => {
    try {
        const { priceId, familyId, email, successUrl, cancelUrl } = req.body;
        if (!priceId || !familyId || !successUrl || !cancelUrl) {
            res.status(400).send({ error: "Missing required parameters: priceId, familyId, successUrl, cancelUrl" });
            return;
        }
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: "subscription",
            customer_email: email, // prefill their email
            client_reference_id: familyId, // THIS IS CRITICAL FOR THE WEBHOOK
            success_url: successUrl,
            cancel_url: cancelUrl,
            subscription_data: {
                trial_period_days: 30, // 30-day Free Trial Added Here
            }
        });
        res.json({ url: session.url });
    }
    catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});
// ==========================================
// CREATE CUSTOMER PORTAL SESSION
// ==========================================
app.post("/create-customer-portal-session", async (req, res) => {
    try {
        const { familyId, returnUrl } = req.body;
        if (!familyId || !returnUrl) {
            res.status(400).send({ error: "Missing required parameters: familyId, returnUrl" });
            return;
        }
        const familyDoc = await admin.firestore().collection("families").doc(familyId).get();
        const familyData = familyDoc.data();
        if (!familyData || !familyData.stripeCustomerId) {
            res.status(404).send({ error: "No active Stripe customer found for this family. Make sure you have completed checkout." });
            return;
        }
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: familyData.stripeCustomerId,
            return_url: returnUrl,
        });
        res.json({ url: portalSession.url });
    }
    catch (error) {
        console.error("Error creating portal session:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});
// ==========================================
// STRIPE WEBHOOK
// ==========================================
// Note: We use express.raw to preserve raw body for Stripe signature verification
app.post("/webhook", express_1.default.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_PLACEHOLDER";
    let event;
    try {
        // Note: In Cloud Functions, req.rawBody contains the raw bytes for verification
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    }
    catch (err) {
        console.error("Webhook Error:", err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        // Grab the familyId we securely passed in client_reference_id
        const familyId = session.client_reference_id;
        if (familyId) {
            console.log(`Fulfilling checkout for family: ${familyId}`);
            try {
                // Update Firestore status to 'active' and attach the Stripe Customer ID
                await admin.firestore().collection("families").doc(familyId).update({
                    status: "active",
                    stripeCustomerId: session.customer,
                });
                // Optional: Update user's subscriptionTier
                const usersRef = admin.firestore().collection("users");
                const querySnapshot = await usersRef.where("familyId", "==", familyId).get();
                const batch = admin.firestore().batch();
                querySnapshot.forEach((doc) => {
                    batch.update(doc.ref, { subscriptionTier: "premium" });
                });
                await batch.commit();
            }
            catch (dbError) {
                console.error("Database update failed:", dbError);
                res.status(500).send("Database Update Failed");
                return;
            }
        }
    }
    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
});
exports.api = functions.https.onRequest(app);
// ==========================================
// IMPORT RECIPE FROM URL
// ==========================================
exports.importRecipeFromUrl = functions.https.onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { url } = request.data;
    if (!url) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing url');
    }
    // Look up user securely to get familyId
    const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
    const userData = userDoc.data();
    if (!userData || !userData.familyId) {
        throw new functions.https.HttpsError('permission-denied', 'No active family profile found.');
    }
    const myFamilyId = userData.familyId;
    // Strip query parameters and hash fragments
    let cleanUrl = url;
    try {
        const parsed = new URL(url);
        cleanUrl = parsed.origin + parsed.pathname;
    }
    catch (e) { /* ignore invalid URL formats here, let fetch handle it */ }
    try {
        const { text, imageUrl } = await (0, scrapers_1.scrapeRecipeTextAndImage)(cleanUrl);
        const parsedRecipe = await (0, ai_1.extractRecipeFromText)(text, imageUrl);
        // Supplement data
        const finalRecipe = Object.assign(Object.assign({}, parsedRecipe), { familyId: myFamilyId, source: 'url', sourceUrl: url, tags: [], createdAt: Date.now(), updatedAt: Date.now() });
        const docRef = await admin.firestore().collection('recipes').add(finalRecipe);
        return { id: docRef.id };
    }
    catch (error) {
        console.error("URL Import Error:", error);
        throw new functions.https.HttpsError('internal', 'Failed to extract recipe from URL.');
    }
});
// ==========================================
// IMPORT RECIPE FROM SCANNED CAMERA
// ==========================================
exports.parseScannedRecipe = functions.https.onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { images } = request.data;
    if (!images || !Array.isArray(images) || images.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing image buffers');
    }
    try {
        // Look up user securely to get familyId
        const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
        const userData = userDoc.data();
        if (!userData || !userData.familyId) {
            throw new functions.https.HttpsError('permission-denied', 'No active family profile found.');
        }
        const parsedRecipe = await (0, ai_1.extractRecipeFromImages)(images);
        const finalRecipe = Object.assign(Object.assign({}, parsedRecipe), { familyId: userData.familyId, source: 'camera', tags: [], createdAt: Date.now(), updatedAt: Date.now() });
        const docRef = await admin.firestore().collection('recipes').add(finalRecipe);
        return { id: docRef.id };
    }
    catch (error) {
        console.error("Camera Import Error:", error);
        throw new functions.https.HttpsError('internal', 'Failed to read images.');
    }
});
exports.processPinterestImport = (0, firestore_1.onDocumentCreated)({
    document: 'pinterestImports/{importId}',
    timeoutSeconds: 540
}, async (event) => {
    var _a, _b, _c;
    const snap = event.data;
    if (!snap)
        return null;
    const data = snap.data();
    if (!data.boardUrl || data.status !== 'pending')
        return null;
    const importRef = snap.ref;
    try {
        // 1. Mark as extracting
        await importRef.update({ status: 'extracting' });
        // 2. Fetch URLs
        const urls = await (0, scrapers_1.extractPinterestBoardLinks)(data.boardUrl);
        // Deduplicate URLs after stripping query parameters
        const uniqueCleanLinks = new Set();
        urls.forEach(u => {
            try {
                const parsed = new URL(u);
                uniqueCleanLinks.add(parsed.origin + parsed.pathname);
            }
            catch (e) {
                uniqueCleanLinks.add(u); // fallback to raw string if malformed
            }
        });
        // Cap URL queue to avoid excessive billing limits and timeouts (150 recipes per queue)
        const limitedUrls = Array.from(uniqueCleanLinks).slice(0, 150);
        const urlQueue = limitedUrls.map(link => ({ link, status: 'pending' }));
        await importRef.update({ status: 'processing', urls: urlQueue });
        // 3. Process URL Queue sequentially or batched to not overwhelm Gemini limits
        for (let i = 0; i < urlQueue.length; i++) {
            // check if user cancelled midway
            const currentDoc = await importRef.get();
            if (currentDoc.exists && ((_a = currentDoc.data()) === null || _a === void 0 ? void 0 : _a.status) === 'cancelled') {
                console.log("Import cancelled by user mid-process.");
                break;
            }
            const u = urlQueue[i];
            try {
                // Re-use logic from importRecipeFromUrl
                const { text, imageUrl } = await (0, scrapers_1.scrapeRecipeTextAndImage)(u.link);
                const parsedRecipe = await (0, ai_1.extractRecipeFromText)(text, imageUrl);
                const finalRecipe = Object.assign(Object.assign({}, parsedRecipe), { familyId: data.familyId, source: 'pinterest', sourceUrl: u.link, tags: [], createdAt: Date.now(), updatedAt: Date.now() });
                const docRef = await admin.firestore().collection('recipes').add(finalRecipe);
                // Update this specific array item to success
                urlQueue[i] = Object.assign(Object.assign({}, u), { status: 'success', recipeId: docRef.id });
            }
            catch (err) {
                console.error(`Pinterest Sub-Import Error [${u.link}]:`, err);
                urlQueue[i] = Object.assign(Object.assign({}, u), { status: 'error', errorMsg: (_b = err === null || err === void 0 ? void 0 : err.message) === null || _b === void 0 ? void 0 : _b.slice(0, 100) });
            }
            // Realtime progress save after every single URL evaluates
            await importRef.update({ urls: urlQueue });
        }
        // 4. Mark Complete if not aborted
        const finalDoc = await importRef.get();
        if (((_c = finalDoc.data()) === null || _c === void 0 ? void 0 : _c.status) !== 'cancelled') {
            await importRef.update({ status: 'done' });
        }
    }
    catch (error) {
        console.error("Pinterest Top Level Error:", error);
        await importRef.update({ status: 'archived' }); // Hide failed board attempt
    }
    return null;
});
// ==========================================
// GENERATE WEEKLY PLAN (AI)
// ==========================================
exports.generateWeeklyPlan = functions.https.onCall(async (request) => {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!request.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    const uid = request.auth.uid;
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const familyId = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.familyId;
    if (!familyId)
        throw new functions.https.HttpsError('failed-precondition', 'No family attached');
    const { isNextWeek } = request.data || {};
    const familyDoc = await admin.firestore().collection('families').doc(familyId).get();
    const healthyTarget = (_d = (_c = (_b = familyDoc.data()) === null || _b === void 0 ? void 0 : _b.mealPreferences) === null || _c === void 0 ? void 0 : _c.healthyMealsPerWeek) !== null && _d !== void 0 ? _d : 5;
    const indulgentTarget = (_g = (_f = (_e = familyDoc.data()) === null || _e === void 0 ? void 0 : _e.mealPreferences) === null || _f === void 0 ? void 0 : _f.indulgentMealsPerWeek) !== null && _g !== void 0 ? _g : 2;
    const recipesSnap = await admin.firestore().collection('recipes').where('familyId', '==', familyId).get();
    const allRecipes = recipesSnap.docs.map(d => (Object.assign({ id: d.id }, d.data())));
    if (allRecipes.length < 7) {
        throw new functions.https.HttpsError('failed-precondition', 'You need at least 7 recipes in your library to generate a plan.');
    }
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const historySnap = await admin.firestore().collection('mealHistory')
        .where('familyId', '==', familyId)
        .where('date', '>=', thirtyDaysAgo)
        .get();
    const historyRecipeIds = historySnap.docs.map(d => d.data().recipeId).filter(id => !!id);
    let currentPlanRecipeIds = [];
    let startDate = Date.now();
    const weeklyPlansSnap = await admin.firestore().collection('weeklyMeals')
        .where('familyId', '==', familyId)
        .orderBy('startDate', 'desc')
        .limit(2)
        .get();
    if (!weeklyPlansSnap.empty) {
        if (isNextWeek) {
            const currentPlan = weeklyPlansSnap.docs[0].data();
            currentPlanRecipeIds = currentPlan.meals.map((m) => m.recipeId);
            startDate = currentPlan.startDate + (7 * 24 * 60 * 60 * 1000);
        }
        else {
            startDate = Date.now();
        }
    }
    const selectedIds = await (0, ai_planner_1.generateWeeklyPlanWithAI)(allRecipes, historyRecipeIds, currentPlanRecipeIds, healthyTarget, indulgentTarget);
    const newMeals = selectedIds.map((id, index) => ({
        id: `meal_${Date.now()}_${index}`,
        recipeId: id,
        status: 'Pending',
        dayOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
        date: startDate + (index * 24 * 60 * 60 * 1000)
    }));
    const newPlan = {
        familyId,
        startDate,
        endDate: startDate + (7 * 24 * 60 * 60 * 1000),
        meals: newMeals,
        createdAt: Date.now()
    };
    const planRef = await admin.firestore().collection('weeklyMeals').add(newPlan);
    return { success: true, planId: planRef.id };
});
// ==========================================
// FAMILY CONNECTIONS
// ==========================================
exports.sendConnectionRequest = functions.https.onCall(async (request) => {
    var _a, _b, _c, _d;
    if (!request.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    const { email } = request.data;
    if (!email)
        throw new functions.https.HttpsError('invalid-argument', 'Email is required');
    const senderDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
    const fromFamilyId = (_a = senderDoc.data()) === null || _a === void 0 ? void 0 : _a.familyId;
    const senderEmail = (_b = senderDoc.data()) === null || _b === void 0 ? void 0 : _b.email;
    if (!fromFamilyId)
        throw new functions.https.HttpsError('failed-precondition', 'Sender has no family attached');
    const fromFamilyDoc = await admin.firestore().collection('families').doc(fromFamilyId).get();
    const fromFamilyName = ((_c = fromFamilyDoc.data()) === null || _c === void 0 ? void 0 : _c.familyName) || senderEmail || 'Someone';
    // Find user by email
    const targetUserSnap = await admin.firestore().collection('users').where('email', '==', email.toLowerCase().trim()).get();
    if (targetUserSnap.empty) {
        throw new functions.https.HttpsError('not-found', 'No user found with that email');
    }
    const targetFamilyId = targetUserSnap.docs[0].data().familyId;
    if (!targetFamilyId)
        throw new functions.https.HttpsError('not-found', 'User has no family attached');
    if (targetFamilyId === fromFamilyId)
        throw new functions.https.HttpsError('invalid-argument', 'Cannot connect to your own family');
    // Check if connection already exists
    const existingConnSnap = await admin.firestore().collection('familyConnections')
        .where('fromFamilyId', '==', fromFamilyId)
        .where('toFamilyId', '==', targetFamilyId)
        .get();
    if (!existingConnSnap.empty)
        throw new functions.https.HttpsError('already-exists', 'Connection already exists or is pending');
    const toFamilyDoc = await admin.firestore().collection('families').doc(targetFamilyId).get();
    const toFamilyName = ((_d = toFamilyDoc.data()) === null || _d === void 0 ? void 0 : _d.familyName) || email;
    // Create connection doc
    const connRef = await admin.firestore().collection('familyConnections').add({
        fromFamilyId,
        fromFamilyName,
        toFamilyId: targetFamilyId,
        toFamilyName,
        status: 'pending',
        createdAt: Date.now()
    });
    // Create notification for target family
    await admin.firestore().collection('notifications').add({
        familyId: targetFamilyId,
        title: 'New Connection Request',
        message: `${fromFamilyName} wants to connect with your family.`,
        type: 'connection_request',
        read: false,
        createdAt: Date.now(),
        actionData: { connectionId: connRef.id, fromFamilyId, fromFamilyName }
    });
    return { success: true };
});
exports.respondToConnection = functions.https.onCall(async (request) => {
    var _a, _b, _c, _d, _e;
    if (!request.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    const { connectionId, accept } = request.data;
    const connRef = admin.firestore().collection('familyConnections').doc(connectionId);
    const connDoc = await connRef.get();
    if (!connDoc.exists)
        throw new functions.https.HttpsError('not-found', 'Connection not found');
    const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
    const myFamilyId = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.familyId;
    if (((_b = connDoc.data()) === null || _b === void 0 ? void 0 : _b.toFamilyId) !== myFamilyId)
        throw new functions.https.HttpsError('permission-denied', 'Not authorized');
    if (accept) {
        await connRef.update({ status: 'active' });
        // Also create reverse connection for easier querying
        await admin.firestore().collection('familyConnections').add({
            fromFamilyId: myFamilyId,
            fromFamilyName: (_c = connDoc.data()) === null || _c === void 0 ? void 0 : _c.toFamilyName,
            toFamilyId: (_d = connDoc.data()) === null || _d === void 0 ? void 0 : _d.fromFamilyId,
            toFamilyName: (_e = connDoc.data()) === null || _e === void 0 ? void 0 : _e.fromFamilyName,
            status: 'active',
            createdAt: Date.now()
        });
    }
    else {
        await connRef.delete();
    }
    return { success: true };
});
exports.shareRecipe = functions.https.onCall(async (request) => {
    var _a, _b;
    if (!request.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    const { recipeId, targetFamilyId } = request.data;
    const recipeDoc = await admin.firestore().collection('recipes').doc(recipeId).get();
    if (!recipeDoc.exists)
        throw new functions.https.HttpsError('not-found', 'Recipe not found');
    const recipeData = recipeDoc.data();
    const senderDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
    const fromFamilyId = (_a = senderDoc.data()) === null || _a === void 0 ? void 0 : _a.familyId;
    if (recipeData.familyId !== fromFamilyId) {
        throw new functions.https.HttpsError('permission-denied', 'You do not have permission to share this recipe.');
    }
    const fromFamilyDoc = await admin.firestore().collection('families').doc(fromFamilyId).get();
    const fromFamilyName = ((_b = fromFamilyDoc.data()) === null || _b === void 0 ? void 0 : _b.familyName) || 'Someone';
    // Create a shared recipe inbox item
    await admin.firestore().collection('sharedRecipes').add({
        targetFamilyId,
        fromFamilyId,
        fromFamilyName,
        recipeData: Object.assign(Object.assign({}, recipeData), { familyId: targetFamilyId, source: 'shared', createdAt: Date.now(), updatedAt: Date.now() }),
        status: 'pending',
        createdAt: Date.now()
    });
    // Notify target family
    await admin.firestore().collection('notifications').add({
        familyId: targetFamilyId,
        title: 'Recipe Shared!',
        message: `${fromFamilyName} shared ${recipeData.title} with you.`,
        type: 'recipe_shared',
        read: false,
        createdAt: Date.now()
    });
    return { success: true };
});
//# sourceMappingURL=index.js.map