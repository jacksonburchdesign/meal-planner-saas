import { db } from "../config/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  where, 
  getDocs
} from "firebase/firestore";

/**
 * Family Interfaces
 */
export interface Family {
  id: string; // The familyId
  subdomain_slug: string;
  name: string;
  status?: "unpaid" | "active";
  authorizedEmails?: string[];
  demographics: {
    adults: number;
    children: number;
    notes?: string;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    iconUrl?: string;
    iconName?: string;
  };
}

/**
 * Fetch a family's public data using their subdomain slug.
 * This is used BEFORE login to load the theme.
 */
export async function getFamilyBySubdomain(subdomain: string): Promise<Family | null> {
  try {
    const q = query(collection(db, "families"), where("subdomain_slug", "==", subdomain));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Return the first match
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Family;
    }
    return null;
  } catch (error) {
    console.error("Error fetching family by subdomain:", error);
    return null;
  }
}

/**
 * Creates a new family profile document in Firestore (used during Onboarding)
 */
export async function createFamilyProfile(familyId: string, familyData: Omit<Family, "id">) {
  try {
    await setDoc(doc(db, "families", familyId), familyData);
    return true;
  } catch (error) {
    console.error("Error creating family profile:", error);
    throw error;
  }
}

/**
 * Recipe Interfaces
 */
export interface Recipe {
  id?: string;
  familyId: string;
  title: string;
  cookTime?: string;
  ingredients: string[];
  instructions: string[];
  imageUrl?: string;
  category?: string;
}

/**
 * User Interface
 */
export interface AppUser {
  uid: string;
  email: string;
  subscriptionTier: "free" | "premium";
  familyId: string;
}

export async function createUserRecord(uid: string, userData: Omit<AppUser, "uid">) {
  try {
    await setDoc(doc(db, "users", uid), userData);
    return true;
  } catch (error) {
    console.error("Error creating user record:", error);
    throw error;
  }
}

/**
 * Fetch a user record by UID (used on sign-in to find their existing family).
 */
export async function getUserRecord(uid: string): Promise<AppUser | null> {
  try {
    const { getDoc } = await import("firebase/firestore");
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      return { uid: snap.id, ...snap.data() } as AppUser;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user record:", error);
    return null;
  }
}
