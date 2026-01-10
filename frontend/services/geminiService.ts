import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

// Using process.env.GEMINI_API_KEY which is mapped in vite.config.ts
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const getAISuggestion = async (history: Message[], customerName: string): Promise<string> => {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not defined");
    return "API Key tidak terkonfigurasi.";
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const historyText = history.map(m => `${m.sender}: ${m.text}`).join('\n');

  const prompt = `
    Context: You are a professional customer service assistant for OmniAI CRM.
    Customer Name: ${customerName}
    Chat History:
    ${historyText}

    Task: Generate a helpful, concise, and polite draft reply to the latest message. 
    Return ONLY the suggested response text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { temperature: 0.7 }
    });
    return response.text?.trim() || "Maaf, saya tidak dapat memberikan saran saat ini.";
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return "Error generating suggestion.";
  }
};

/**
 * Menganalisis riwayat chat untuk menentukan kategori/tags pelanggan.
 */
export const analyzeCustomerIntent = async (history: Message[]): Promise<string[]> => {
  if (history.length === 0) return ["New"];
  if (!GEMINI_API_KEY) return ["New"];

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const historyText = history.slice(-10).map(m => `${m.sender}: ${m.text}`).join('\n');

  const prompt = `
    Analyze this chat history and return exactly 2-3 professional CRM tags that best describe this customer.
    Available categories to consider: VIP, Potential, Follow-up, Tech Support, High Priority, Positive Sentiment, Frustrated.
    
    Chat History:
    ${historyText}
    
    Return ONLY a comma-separated list of tags. Example: VIP, Positive Sentiment
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { temperature: 0.2 }
    });

    const tagsText = response.text?.trim() || "New";
    return tagsText.split(',').map(tag => tag.trim());
  } catch (error) {
    console.error("AI Tagging Error:", error);
    return ["New"];
  }
};