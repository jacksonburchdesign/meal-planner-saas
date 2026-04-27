import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import express from "express";
import cors from "cors";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { extractRecipeFromText, extractRecipeFromImages } from "./ai";
import { scrapeRecipeTextAndImage, extractPinterestBoardLinks } from "./scrapers";
import { generateWeeklyPlanWithAI } from "./ai-planner";

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Stripe with Secret Key from Firebase Config/Environment Secrets
const stripeSec = process.env.STRIPE_SECRET_KEY || "sk_test_PLACEHOLDER";
const stripe = new Stripe(stripeSec, {
  // @ts-expect-error - using a beta API version
  apiVersion: '2025-02-24.acacia',
});

const app = express();
app.use(cors({ origin: true }));

// ==========================================
// CREATE CHECKOUT SESSION
// ==========================================
app.post("/create-checkout-session", async (req: express.Request, res: express.Response) => {
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
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// ==========================================
// CREATE CUSTOMER PORTAL SESSION
// ==========================================
app.post("/create-customer-portal-session", async (req: express.Request, res: express.Response) => {
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
      customer: familyData.stripeCustomerId as string,
      return_url: returnUrl,
    });

    res.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// ==========================================
// STRIPE WEBHOOK
// ==========================================
// Note: We use express.raw to preserve raw body for Stripe signature verification
app.post("/webhook", express.raw({ type: "application/json" }), async (req: express.Request, res: express.Response) => {
  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_PLACEHOLDER";

  let event: Stripe.Event;

  try {
    // Note: In Cloud Functions, req.rawBody contains the raw bytes for verification
    event = stripe.webhooks.constructEvent((req as express.Request & { rawBody: Buffer }).rawBody, sig, endpointSecret);
  } catch (err: unknown) {
    console.error("Webhook Error:", (err as Error).message);
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    return;
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
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

      } catch (dbError) {
        console.error("Database update failed:", dbError);
        res.status(500).send("Database Update Failed");
        return;
      }
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
});

export const api = functions.https.onRequest(app);

// ==========================================
// IMPORT RECIPE FROM URL
// ==========================================
export const importRecipeFromUrl = functions.https.onCall(async (request: functions.https.CallableRequest) => {
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
  } catch(e) { /* ignore invalid URL formats here, let fetch handle it */ }

  try {
    const { text, imageUrl } = await scrapeRecipeTextAndImage(cleanUrl);
    const parsedRecipe = await extractRecipeFromText(text, imageUrl);
    
    // Supplement data
    const finalRecipe = {
      ...parsedRecipe,
      familyId: myFamilyId,
      source: 'url',
      sourceUrl: url,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const docRef = await admin.firestore().collection('recipes').add(finalRecipe);
    return { id: docRef.id };
  } catch (error) {
    console.error("URL Import Error:", error);
    throw new functions.https.HttpsError('internal', 'Failed to extract recipe from URL.');
  }
});

// ==========================================
// IMPORT RECIPE FROM SCANNED CAMERA
// ==========================================
export const parseScannedRecipe = functions.https.onCall(async (request: functions.https.CallableRequest) => {
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

    const parsedRecipe = await extractRecipeFromImages(images);

    const finalRecipe = {
      ...parsedRecipe,
      familyId: userData.familyId,
      source: 'camera',
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const docRef = await admin.firestore().collection('recipes').add(finalRecipe);
    return { id: docRef.id };
  } catch (error) {
    console.error("Camera Import Error:", error);
    throw new functions.https.HttpsError('internal', 'Failed to read images.');
  }
});

// ==========================================
// BACKGROUND PINTEREST PROCESSING
// ==========================================
import { FirestoreEvent, QueryDocumentSnapshot } from 'firebase-functions/v2/firestore';

export const processPinterestImport = onDocumentCreated(
  {
    document: 'pinterestImports/{importId}',
    timeoutSeconds: 540
  },
  async (event: FirestoreEvent<QueryDocumentSnapshot | undefined, { importId: string }>) => {
    const snap = event.data;
    if (!snap) return null;

    const data = snap.data();
    if (!data.boardUrl || data.status !== 'pending') return null;

    const importRef = snap.ref;
    try {
       // 1. Mark as extracting
       await importRef.update({ status: 'extracting' });

       // 2. Fetch URLs
       const urls = await extractPinterestBoardLinks(data.boardUrl);
       
       // Deduplicate URLs after stripping query parameters
       const uniqueCleanLinks = new Set<string>();
       urls.forEach(u => {
          try {
             const parsed = new URL(u);
             uniqueCleanLinks.add(parsed.origin + parsed.pathname);
          } catch(e) {
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
          if (currentDoc.exists && currentDoc.data()?.status === 'cancelled') {
             console.log("Import cancelled by user mid-process.");
             break;
          }

          const u = urlQueue[i];
          try {
             // Re-use logic from importRecipeFromUrl
             const { text, imageUrl } = await scrapeRecipeTextAndImage(u.link);
             const parsedRecipe = await extractRecipeFromText(text, imageUrl);
             
             const finalRecipe = {
                ...parsedRecipe,
                familyId: data.familyId,
                source: 'pinterest',
                sourceUrl: u.link,
                tags: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
             };

             const docRef = await admin.firestore().collection('recipes').add(finalRecipe);
             
             // Update this specific array item to success
             urlQueue[i] = { ...u, status: 'success', recipeId: docRef.id } as any;
          } catch(err: any) {
             console.error(`Pinterest Sub-Import Error [${u.link}]:`, err);
             urlQueue[i] = { ...u, status: 'error', errorMsg: err?.message?.slice(0, 100) } as any;
          }

          // Realtime progress save after every single URL evaluates
          await importRef.update({ urls: urlQueue });
       }

       // 4. Mark Complete if not aborted
       const finalDoc = await importRef.get();
       if (finalDoc.data()?.status !== 'cancelled') {
         await importRef.update({ status: 'done' });
       }
    } catch(error) {
       console.error("Pinterest Top Level Error:", error);
       await importRef.update({ status: 'archived' }); // Hide failed board attempt
    }
    return null;
  });

// ==========================================
// GENERATE WEEKLY PLAN (AI)
// ==========================================
export const generateWeeklyPlan = functions.https.onCall(async (request: functions.https.CallableRequest) => {
  if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  
  const uid = request.auth.uid;
  const userDoc = await admin.firestore().collection('users').doc(uid).get();
  const familyId = userDoc.data()?.familyId;
  if (!familyId) throw new functions.https.HttpsError('failed-precondition', 'No family attached');

  const { isNextWeek } = request.data || {};

  const familyDoc = await admin.firestore().collection('families').doc(familyId).get();
  const healthyTarget = familyDoc.data()?.mealPreferences?.healthyMealsPerWeek ?? 5;
  const indulgentTarget = familyDoc.data()?.mealPreferences?.indulgentMealsPerWeek ?? 2;

  const recipesSnap = await admin.firestore().collection('recipes').where('familyId', '==', familyId).get();
  const allRecipes = recipesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  if (allRecipes.length < 7) {
     throw new functions.https.HttpsError('failed-precondition', 'You need at least 7 recipes in your library to generate a plan.');
  }

  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const historySnap = await admin.firestore().collection('mealHistory')
    .where('familyId', '==', familyId)
    .where('date', '>=', thirtyDaysAgo)
    .get();
  const historyRecipeIds = historySnap.docs.map(d => d.data().recipeId).filter(id => !!id);

  let currentPlanRecipeIds: string[] = [];
  let startDate = Date.now();
  
  const weeklyPlansSnap = await admin.firestore().collection('weeklyMeals')
    .where('familyId', '==', familyId)
    .orderBy('startDate', 'desc')
    .limit(2)
    .get();
    
  if (!weeklyPlansSnap.empty) {
     if (isNextWeek) {
        const currentPlan = weeklyPlansSnap.docs[0].data();
        currentPlanRecipeIds = currentPlan.meals.map((m: { recipeId: string }) => m.recipeId);
        startDate = currentPlan.startDate + (7 * 24 * 60 * 60 * 1000);
     } else {
        startDate = Date.now();
     }
  }

  const selectedIds = await generateWeeklyPlanWithAI(allRecipes as any[], historyRecipeIds, currentPlanRecipeIds, healthyTarget, indulgentTarget);

  const newMeals = selectedIds.map((selection, index) => ({
    id: `meal_${Date.now()}_${index}`,
    recipeId: selection.recipeId,
    sideIds: selection.sideIds || [],
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
export const sendConnectionRequest = functions.https.onCall(async (request: functions.https.CallableRequest) => {
  if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  
  const { email } = request.data;
  if (!email) throw new functions.https.HttpsError('invalid-argument', 'Email is required');

  const senderDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
  const fromFamilyId = senderDoc.data()?.familyId;
  const senderEmail = senderDoc.data()?.email;
  
  if (!fromFamilyId) throw new functions.https.HttpsError('failed-precondition', 'Sender has no family attached');

  const fromFamilyDoc = await admin.firestore().collection('families').doc(fromFamilyId).get();
  const fromFamilyName = fromFamilyDoc.data()?.familyName || senderEmail || 'Someone';

  // Find user by email
  const targetUserSnap = await admin.firestore().collection('users').where('email', '==', email.toLowerCase().trim()).get();
  if (targetUserSnap.empty) {
    throw new functions.https.HttpsError('not-found', 'No user found with that email');
  }

  const targetFamilyId = targetUserSnap.docs[0].data().familyId;
  if (!targetFamilyId) throw new functions.https.HttpsError('not-found', 'User has no family attached');

  if (targetFamilyId === fromFamilyId) throw new functions.https.HttpsError('invalid-argument', 'Cannot connect to your own family');

  // Check if connection already exists
  const existingConnSnap = await admin.firestore().collection('familyConnections')
    .where('fromFamilyId', '==', fromFamilyId)
    .where('toFamilyId', '==', targetFamilyId)
    .get();
    
  if (!existingConnSnap.empty) throw new functions.https.HttpsError('already-exists', 'Connection already exists or is pending');

  const toFamilyDoc = await admin.firestore().collection('families').doc(targetFamilyId).get();
  const toFamilyName = toFamilyDoc.data()?.familyName || email;

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

export const respondToConnection = functions.https.onCall(async (request: functions.https.CallableRequest) => {
  if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  
  const { connectionId, accept } = request.data;
  const connRef = admin.firestore().collection('familyConnections').doc(connectionId);
  const connDoc = await connRef.get();
  
  if (!connDoc.exists) throw new functions.https.HttpsError('not-found', 'Connection not found');
  
  const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
  const myFamilyId = userDoc.data()?.familyId;
  
  if (connDoc.data()?.toFamilyId !== myFamilyId) throw new functions.https.HttpsError('permission-denied', 'Not authorized');

  if (accept) {
    await connRef.update({ status: 'active' });
    // Also create reverse connection for easier querying
    await admin.firestore().collection('familyConnections').add({
      fromFamilyId: myFamilyId,
      fromFamilyName: connDoc.data()?.toFamilyName,
      toFamilyId: connDoc.data()?.fromFamilyId,
      toFamilyName: connDoc.data()?.fromFamilyName,
      status: 'active',
      createdAt: Date.now()
    });
  } else {
    await connRef.delete();
  }
  return { success: true };
});

export const shareRecipe = functions.https.onCall(async (request: functions.https.CallableRequest) => {
  if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  
  const { recipeId, targetFamilyId } = request.data;
  
  const recipeDoc = await admin.firestore().collection('recipes').doc(recipeId).get();
  if (!recipeDoc.exists) throw new functions.https.HttpsError('not-found', 'Recipe not found');
  
  const recipeData = recipeDoc.data()!;
  
  const senderDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
  const fromFamilyId = senderDoc.data()?.familyId;

  if (recipeData.familyId !== fromFamilyId) {
    throw new functions.https.HttpsError('permission-denied', 'You do not have permission to share this recipe.');
  }
  const fromFamilyDoc = await admin.firestore().collection('families').doc(fromFamilyId).get();
  const fromFamilyName = fromFamilyDoc.data()?.familyName || 'Someone';

  // Create a shared recipe inbox item
  await admin.firestore().collection('sharedRecipes').add({
    targetFamilyId,
    fromFamilyId,
    fromFamilyName,
    recipeData: { ...recipeData, familyId: targetFamilyId, source: 'shared', createdAt: Date.now(), updatedAt: Date.now() },
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

import { onSchedule } from "firebase-functions/v2/scheduler";

// ==========================================
// CLEANUP READ NOTIFICATIONS (Scheduled Job)
// ==========================================
export const cleanupReadNotifications = onSchedule({ schedule: 'every 24 hours' }, async () => {
  // Delete notifications marked as read where readAt < 7 days ago.
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  // Batch limit is 500, we limit to 500 per execution to be safe.
  // It runs daily, so it will chew through backlogs over time if there are many.
  const snapshot = await admin.firestore().collection('notifications')
    .where('read', '==', true)
    .where('readAt', '<=', sevenDaysAgo)
    .limit(500)
    .get();

  if (snapshot.empty) {
    console.log("No read notifications to clean up.");
    return;
  }

  const batch = admin.firestore().batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Successfully deleted ${snapshot.size} old read notifications.`);
});
