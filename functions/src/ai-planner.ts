import { GoogleGenAI } from "@google/genai";
import * as functions from "firebase-functions";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface RecipePayload {
  id: string;
  title: string;
  category: string;
  isHealthy: boolean;
}

export async function generateWeeklyPlanWithAI(
  recipes: RecipePayload[],
  history: string[],
  currentPlanRecipes: string[],
  healthyTarget: number,
  indulgentTarget: number
): Promise<string[]> {
  const prompt = `
You are an expert meal planner AI.
I am providing you with:
1. A list of available recipes with their IDs, titles, categories, and healthiness.
2. A history of recipes the family has eaten in the last 30 days.
3. The recipes they are already eating this current week.

Your task is to select exactly 7 unique recipe IDs from the available recipes to form a meal plan for the upcoming 7 days.

RULES:
1. EXCLUDE any recipes that are in the 'current week' list.
2. HEAVILY FAVOR recipes that do NOT appear in the recent 30-day history.
3. If possible, select exactly ${healthyTarget} "healthy" recipes and ${indulgentTarget} "indulgent" recipes.
4. Ensure variety in categories (don't pick 7 pasta dishes).
5. Output ONLY a valid JSON array of strings, where each string is a selected recipe ID. Example: ["id1", "id2", "id3", "id4", "id5", "id6", "id7"].
6. Do not include markdown formatting or backticks in the response.

DATA:
Available Recipes: ${JSON.stringify(recipes.map(r => ({ id: r.id, title: r.title, category: r.category, isHealthy: r.isHealthy })))}
30-Day History Recipe IDs: ${JSON.stringify(history)}
Current Week Recipe IDs: ${JSON.stringify(currentPlanRecipes)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    // Try to parse the array of strings
    const selectedIds = JSON.parse(text);
    if (!Array.isArray(selectedIds) || selectedIds.length !== 7) {
       console.error("AI returned malformed JSON or not exactly 7 IDs:", text);
       // Fallback
       return fallbackSelection(recipes, healthyTarget, indulgentTarget);
    }

    return selectedIds;
  } catch (error) {
    console.error("Error calling Gemini:", error);
    // Fallback to random selection if AI fails
    return fallbackSelection(recipes, healthyTarget, indulgentTarget);
  }
}

function fallbackSelection(recipes: RecipePayload[], healthyTarget: number, indulgentTarget: number): string[] {
  // Simple random fallback
  const healthyRecipes = recipes.filter(r => r.isHealthy).map(r => r.id);
  const indulgentRecipes = recipes.filter(r => !r.isHealthy).map(r => r.id);
  
  // Shuffle arrays
  healthyRecipes.sort(() => Math.random() - 0.5);
  indulgentRecipes.sort(() => Math.random() - 0.5);
  
  const selected = [
    ...healthyRecipes.slice(0, healthyTarget),
    ...indulgentRecipes.slice(0, indulgentTarget)
  ];
  
  // Fill any gaps if they don't have enough
  if (selected.length < 7) {
    const remaining = recipes.map(r => r.id).filter(id => !selected.includes(id)).sort(() => Math.random() - 0.5);
    selected.push(...remaining.slice(0, 7 - selected.length));
  }
  
  return selected.slice(0, 7);
}
