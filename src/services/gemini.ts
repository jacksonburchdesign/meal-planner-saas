import { aiClient } from "../config/gemini";
import type { Family, Recipe } from "./firestore";
import { Type, type Schema } from "@google/genai";

const mealPlanSchema: Schema = {
  type: Type.ARRAY,
  description: "A list of 7 meal IDs representing the meal plan for the week.",
  items: {
    type: Type.STRING,
  },
};

export async function generateWeeklyMealPlan(
  family: Family,
  availableRecipes: Recipe[],
  historicalMealIds: string[]
): Promise<string[]> {
  try {
    const prompt = `
      You are an expert AI meal planner acting as a culinary consultant for a specific family.
      Your task is to generate a 7-day dinner plan.
      
      FAMILY CONTEXT:
      Name: ${family.name}
      Demographics: ${family.demographics.adults} Adults, ${family.demographics.children} Children
      Notes: ${family.demographics.notes || 'None'}
      
      AVAILABLE RECIPES (You must only select from the IDs below):
      ${availableRecipes.map(r => `- ${r.id}: ${r.title} (${r.category || 'General'})`).join('\n')}
      
      HISTORY (Try to avoid repeating these over-used recipes if possible):
      ${historicalMealIds.join(', ')}
      
      REQUIREMENTS:
      1. Pick exactly 7 recipes for the week.
      2. Output your selection EXACTLY as a JSON array constraint by the schema provided. No markdown, no extra text.
    `;

    const response = await aiClient.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: mealPlanSchema,
        temperature: 0.7,
      }
    });

    if (!response.text) throw new Error("No response from Gemini API");
    
    // Parse the JSON array
    const planIds: string[] = JSON.parse(response.text);
    
    // Ensure we actually got 7
    if (!Array.isArray(planIds)) {
      throw new Error("Invalid format received from AI");
    }
    
    return planIds.slice(0, 7);

  } catch (error) {
    console.error("Gemini meal plan generation failed:", error);
    // Fallback logic could be randomly selecting 7 distinct items.
    throw error;
  }
}

const recipeParserSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    ingredients: { 
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    instructions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    category: { type: Type.STRING }
  },
  required: ["title", "ingredients", "instructions"]
};

export async function parseRawRecipeInput(rawInput: string): Promise<Partial<Recipe>> {
    try {
      const prompt = `
        A user has pasted some text/URL regarding a recipe. Please parse out the actionable details.
        
        RAW INPUT:
        ${rawInput}
      `;
  
      const response = await aiClient.models.generateContent({
        model: 'gemini-1.5-flash', // Faster model for basic parsing
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: recipeParserSchema,
          temperature: 0.2,
        }
      });
  
      if (!response.text) throw new Error("No response from Gemini API");
      
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini parsing failed:", error);
      throw error;
    }
}
