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
exports.processPinterestImport = exports.parseScannedRecipe = exports.importRecipeFromUrl = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const firestore_1 = require("firebase-functions/v2/firestore");
const ai_1 = require("./ai");
const scrapers_1 = require("./scrapers");
// Initialize Firebase Admin
admin.initializeApp();
// Initialize Stripe with Secret Key from Firebase Config/Environment Secrets
const stripeSec = process.env.STRIPE_SECRET_KEY || "sk_test_PLACEHOLDER";
const stripe = new stripe_1.default(stripeSec, {
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
    const { url, familyId } = request.data;
    if (!url || !familyId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing url or familyId');
    }
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
        const finalRecipe = Object.assign(Object.assign({}, parsedRecipe), { familyId, source: 'url', sourceUrl: url, createdAt: Date.now(), updatedAt: Date.now() });
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
        const finalRecipe = Object.assign(Object.assign({}, parsedRecipe), { familyId: userData.familyId, source: 'camera', createdAt: Date.now(), updatedAt: Date.now() });
        const docRef = await admin.firestore().collection('recipes').add(finalRecipe);
        return { id: docRef.id };
    }
    catch (error) {
        console.error("Camera Import Error:", error);
        throw new functions.https.HttpsError('internal', 'Failed to read images.');
    }
});
// ==========================================
// BACKGROUND PINTEREST PROCESSING
// ==========================================
exports.processPinterestImport = (0, firestore_1.onDocumentCreated)('pinterestImports/{importId}', async (event) => {
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
        // Cap URL queue to avoid excessive billing limits and timeouts (50 recipes per queue)
        const limitedUrls = Array.from(uniqueCleanLinks).slice(0, 50);
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
                const finalRecipe = Object.assign(Object.assign({}, parsedRecipe), { familyId: data.familyId, source: 'pinterest', sourceUrl: u.link, createdAt: Date.now(), updatedAt: Date.now() });
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
//# sourceMappingURL=index.js.map