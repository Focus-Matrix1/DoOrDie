import { CategoryId } from "../types";
import { DEEPSEEK_API_KEY } from "../config";

export interface ClassificationResult {
  category: CategoryId;
  duration?: string;
  error?: 'quota' | 'model_not_found' | 'other';
}

export const useTaskClassifier = () => {
  const classifyTaskWithAI = async (title: string, description?: string): Promise<ClassificationResult> => {
    // 1. Check Key Presence
    if (!DEEPSEEK_API_KEY) {
      console.warn("AI Mode: No API Key configured");
      return { category: 'inbox' }; 
    }

    try {
      // 2. Call SiliconFlow / DeepSeek API
      // Using 'deepseek-ai/DeepSeek-V3' as a high-performance fast model
      const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-ai/DeepSeek-V3", 
          messages: [
            {
              role: "system",
              content: "You are a productivity expert. Classify tasks into the Eisenhower Matrix (q1, q2, q3, q4). Rule: NEVER return 'inbox'. You MUST make a best guess based on the title. q1=Urgent+Important, q2=Important, q3=Urgent, q4=Neither. Also estimate duration in '15m', '1h' format. Return strictly valid JSON with keys: category, duration."
            },
            {
              role: "user",
              content: `Classify this task: "${title}". ${description ? `Context: ${description}` : ''}. Respond in JSON.`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1, // Low temperature for consistent classification
          max_tokens: 150
        })
      });

      if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          console.error("AI API Error:", response.status, errBody);
          if (response.status === 429) {
              return { category: 'inbox', error: 'quota' };
          }
          if (response.status === 404) {
              return { category: 'inbox', error: 'model_not_found' };
          }
          return { category: 'inbox', error: 'other' };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
          return { category: 'inbox', error: 'other' };
      }
      
      let result;
      try {
          result = JSON.parse(content);
      } catch (e) {
          console.warn("Failed to parse JSON from AI response:", content);
          return { category: 'inbox', error: 'other' };
      }

      const cat = result.category?.toLowerCase();
      
      if (['q1', 'q2', 'q3', 'q4'].includes(cat)) {
        return { 
          category: cat as CategoryId, 
          duration: result.duration 
        };
      }
      
      return { category: 'inbox', error: 'other' };

    } catch (e: any) {
      // 4. Specific Error Handling
      console.error("AI Classification Failed:", e);
      return { category: 'inbox', error: 'other' };
    }
  };

  return { classifyTaskWithAI };
};