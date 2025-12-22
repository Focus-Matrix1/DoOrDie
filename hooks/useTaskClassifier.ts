
import { GoogleGenAI, Type } from "@google/genai";
import { CategoryId } from "../types";
import { GEMINI_API_KEY } from "../config";

export const useTaskClassifier = () => {
  const classifyTaskWithAI = async (title: string, description?: string): Promise<{ category: CategoryId, duration?: string }> => {
    // Check the centralized configuration
    if (!GEMINI_API_KEY) {
      console.warn("AI Mode: No API Key configured in config.ts");
      return { category: 'inbox' }; 
    }

    try {
      // Create instance using the key from config.ts
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Classify the task: "${title}". Description: "${description || ''}"`,
        config: {
          systemInstruction: "You are an expert productivity assistant. Classify the task into the Eisenhower Matrix. q1: Urgent & Important, q2: Important Not Urgent, q3: Urgent Not Important, q4: Not Urgent Not Important. Estimate duration (e.g. 30m, 1h).",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, enum: ['q1', 'q2', 'q3', 'q4', 'inbox'] },
              duration: { type: Type.STRING, description: "Estimated duration, e.g. '30m'" }
            },
            required: ['category']
          }
        }
      });
      
      const text = response.text;
      if (!text) return { category: 'inbox' };
      
      const result = JSON.parse(text);
      const cat = result.category?.toLowerCase();
      
      if (['q1', 'q2', 'q3', 'q4'].includes(cat)) {
        return { 
          category: cat as CategoryId, 
          duration: result.duration 
        };
      }
      
      return { category: 'inbox' };
    } catch (e) {
      console.error("AI Classification failed", e);
      return { category: 'inbox' };
    }
  };

  return { classifyTaskWithAI };
};
