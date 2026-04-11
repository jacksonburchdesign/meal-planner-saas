import { GoogleGenAI } from '@google/genai';

// Initialize the Google Gen AI client
// NEVER expose this API key to a client side bundle in a real production environment.
// For the sake of this prototype MVP, it uses Vite's env variables.
// A real app would put this into a Firebase Cloud Function.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey && import.meta.env.PROD) {
  console.warn("WARNING: VITE_GEMINI_API_KEY is not defined.");
}

export const aiClient = new GoogleGenAI({
  apiKey: apiKey || 'dummy-dev-key'
});
