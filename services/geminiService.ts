import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

// Helper to convert File to Base64
const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64 = base64String.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const parseTableImage = async (
  file: File, 
  apiKey: string
): Promise<Product[]> => {
  if (!apiKey) throw new Error("Please configure Gemini API Key in Settings.");

  const ai = new GoogleGenAI({ apiKey: apiKey });
  const base64Data = await fileToGenerativePart(file);

  const prompt = `
    Analyze this image of a price list table. 
    Extract the product rows.
    Table typically has Name, Purchase Price, Wholesale Price, Retail Floor, Retail Price.
    
    IMPORTANT: We now support pricing per 'box' and per 'item'.
    If a column says "price/box" use it for box. If "price/item" use it for item.
    If only one price is listed, assume it is box price, and item price is same or 0.
    
    Return JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest', 
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              purchase_box: { type: Type.NUMBER },
              purchase_item: { type: Type.NUMBER },
              wholesale_box: { type: Type.NUMBER },
              wholesale_item: { type: Type.NUMBER },
              retail_floor_box: { type: Type.NUMBER },
              retail_floor_item: { type: Type.NUMBER },
              retail_box: { type: Type.NUMBER },
              retail_item: { type: Type.NUMBER },
            },
            required: ["name"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from AI");

    const rawData = JSON.parse(text);

    return rawData.map((item: any) => ({
      id: crypto.randomUUID(),
      name: item.name ? item.name.toString().replace(/\s+/g, '') : 'Unknown Product',
      prices: {
        purchase: { box: item.purchase_box || 0, item: item.purchase_item || 0 },
        wholesale: { box: item.wholesale_box || 0, item: item.wholesale_item || 0 },
        retail_floor: { box: item.retail_floor_box || 0, item: item.retail_floor_item || 0 },
        retail: { box: item.retail_box || 0, item: item.retail_item || 0 },
      }
    }));

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};