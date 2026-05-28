import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Generates a vector embedding for the given text using Gemini.
 * @param {string} text - The text to embed (e.g., item name + category)
 * @returns {Promise<number[]>} - The embedding vector array
 */
export async function generateEmbedding(text) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. Skipping embedding generation.");
      return [];
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use the specific embedding model
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
    
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return []; // Return empty array on failure so it doesn't break app flow
  }
}
