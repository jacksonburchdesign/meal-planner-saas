import { GoogleGenAI } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface RecipePayload {
  id: string;
  title: string;
  category: string;
  isHealthy: boolean;
  cookTime?: string;
}

export interface WeeklyMealSelection {
  recipeId: string;
  sideIds: string[];
}

export async function generateWeeklyPlanWithAI(
  recipes: RecipePayload[],
  history: string[],
  currentPlanRecipes: string[],
  healthyTarget: number,
  indulgentTarget: number
): Promise<WeeklyMealSelection[]> {
  const prompt = `
You are an expert meal planner AI.
I am providing you with:
1. A list of available recipes with their IDs, titles, categories, healthiness, and cook times.
2. A history of recipes the family has eaten in the last 30 days.
3. The recipes they are already eating this current week.

Your task is to select exactly 7 unique main entrées from the available recipes to form a meal plan for the upcoming 7 days.
Additionally, you should select up to 3 complementary side dishes for each entrée.

RULES:
1. ONLY select recipes with the category "entrées" as the main meal (recipeId).
2. ONLY select recipes with the category "sides" for the sideIds array.
3. EXCLUDE any recipes that are in the 'current week' list.
4. HEAVILY FAVOR recipes that do NOT appear in the recent 30-day history.
5. If possible, select exactly ${healthyTarget} "healthy" recipes and ${indulgentTarget} "indulgent" recipes.
6. Ensure variety in categories (don't pick 7 pasta dishes).
7. Intelligently pair sides with the entrée. For example, pair a rich entrée with a light vegetable side, or serve bread with pasta.
8. Ensure the combined cook time of the entrée and sides is reasonable.
9. Output ONLY a valid JSON array of objects, where each object has a 'recipeId' (string) and 'sideIds' (array of strings). Example: [{"recipeId": "entree1", "sideIds": ["side1", "side2"]}, {"recipeId": "entree2", "sideIds": []}].
10. Do not include markdown formatting or backticks in the response. Ensure there are exactly 7 objects in the array.

DATA:
Available Recipes: ${JSON.stringify(recipes.map(r => ({ id: r.id, title: r.title, category: r.category, isHealthy: r.isHealthy, cookTime: r.cookTime })))}
30-Day History Recipe IDs: ${JSON.stringify(history)}
Current Week Recipe IDs: ${JSON.stringify(currentPlanRecipes)}
  `;

  try {
    const response = await getAI().models.generateContent({
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

function fallbackSelection(recipes: RecipePayload[], healthyTarget: number, indulgentTarget: number): WeeklyMealSelection[] {
  // Simple random fallback - only entrees
  const entrees = recipes.filter(r => r.category === 'entrées');
  const healthyRecipes = entrees.filter(r => r.isHealthy).map(r => r.id);
  const indulgentRecipes = entrees.filter(r => !r.isHealthy).map(r => r.id);
  
  // Shuffle arrays
  healthyRecipes.sort(() => Math.random() - 0.5);
  indulgentRecipes.sort(() => Math.random() - 0.5);
  
  const selected = [
    ...healthyRecipes.slice(0, healthyTarget),
    ...indulgentRecipes.slice(0, indulgentTarget)
  ];
  
  // Fill any gaps if they don't have enough
  if (selected.length < 7) {
    const remaining = entrees.map(r => r.id).filter(id => !selected.includes(id)).sort(() => Math.random() - 0.5);
    selected.push(...remaining.slice(0, 7 - selected.length));
  }
  
  return selected.slice(0, 7).map(id => ({ recipeId: id, sideIds: [] }));
}
