"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractRecipeFromText = extractRecipeFromText;
exports.extractRecipeFromImages = extractRecipeFromImages;
const genai_1 = require("@google/genai");
// Initialize the API using Application Default Credentials through Vertex AI
// We must explicitly declare the vertexai object so the SDK routes to aiplatform.googleapis.com
// Otherwise, it incorrectly falls back to AI Studio which rejects service accounts.
const ai = new genai_1.GoogleGenAI({
    vertexai: true,
    project: process.env.GCLOUD_PROJECT || "meal-house-saas",
    location: 'us-central1'
});
const JSON_SCHEMA = {
    type: "object",
    properties: {
        title: { type: "string" },
        category: { type: "string", enum: ["breakfast", "entrées", "sides", "desserts"] },
        isHealthy: { type: "boolean" },
        imageUrl: { type: "string", description: "The high-resolution hero image URL of the recipe." },
        ingredients: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    amount: { type: "string", description: "Numeric amount (e.g., 2, 1/2)" },
                    unit: { type: "string", description: "Measurement unit (e.g., cups, tsp)" },
                    name: { type: "string", description: "Ingredient name" }
                },
                required: ["amount", "unit", "name"]
            }
        },
        instructions: {
            type: "array",
            items: { type: "string" }
        }
    },
    required: ["title", "category", "isHealthy", "imageUrl", "ingredients", "instructions"]
};
async function extractRecipeFromText(text, ogImageUrl) {
    let prompt = `You are an expert recipe extractor. Read the following text and extract the recipe strictly in JSON.\n\nText: ${text.substring(0, 30000)}`; // safeguard token limits
    if (ogImageUrl) {
        prompt += `\n\nNote: The source page has this hero image URL available: ${ogImageUrl}. You should prioritize using this for the imageUrl field if it looks like a valid food/recipe image.`;
    }
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: JSON_SCHEMA,
            temperature: 0.1
        }
    });
    if (!response.text) {
        throw new Error("Failed to generate content from AI");
    }
    return JSON.parse(response.text);
}
async function extractRecipeFromImages(images) {
    const parts = images.map(img => ({
        inlineData: {
            data: img.base64,
            mimeType: img.mimeType
        }
    }));
    const prompt = `You are a culinary expert AI. Extract the recipe from these images. Look for the title, ingredients, and step-by-step instructions. Output strictly in JSON format matching the schema. If there is no specific recipe hero image, output a blank string or null.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            ...parts,
            prompt
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: JSON_SCHEMA,
            temperature: 0.1
        }
    });
    if (!response.text) {
        throw new Error("Failed to generate content from AI");
    }
    return JSON.parse(response.text);
}
//# sourceMappingURL=ai.js.map