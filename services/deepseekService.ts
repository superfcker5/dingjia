import { Product, OrderItem } from "../types";

export const parseOrderText = async (
  text: string,
  products: Product[],
  apiKey: string,
  baseUrl: string
): Promise<OrderItem[]> => {
  if (!apiKey) throw new Error("Please configure DeepSeek API Key in Settings.");
  if (!text.trim()) return [];

  const productListStr = products.map(p => `- ${p.name} (ID: ${p.id})`).join('\n');

  const systemPrompt = `
    You are an intelligent order parser assistant.
    Your goal is to extract product quantities for "boxes" (箱) and "individual items" (个) from the user's natural language input.
    
    Here is the available Product Catalog:
    ${productListStr}

    Rules:
    1. Fuzzy match the user's input to the Product Catalog names.
    2. Extract quantities for both 'box' and 'item' units if specified.
       - "5箱" -> quantityBox: 5, quantityItem: 0
       - "3个" -> quantityBox: 0, quantityItem: 3
       - "5箱3个" or "5箱零3个" -> quantityBox: 5, quantityItem: 3
       - "100" (no unit) -> Assume box -> quantityBox: 100, quantityItem: 0
    3. Return a JSON object with a "items" array.
    4. Each item must have: 
       - "productId" (exact ID from catalog)
       - "quantityBox" (number, default 0)
       - "quantityItem" (number, default 0)
    
    Example Output:
    {
      "items": [
        { "productId": "123", "quantityBox": 5, "quantityItem": 2 },
        { "productId": "456", "quantityBox": 0, "quantityItem": 10 }
      ]
    }
  `;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`DeepSeek API Error: ${err}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const result = JSON.parse(content);

    // Hydrate with names
    const orderItems: OrderItem[] = result.items.map((item: any) => {
      const product = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        quantityBox: item.quantityBox || 0,
        quantityItem: item.quantityItem || 0,
        productName: product ? product.name : 'Unknown Product'
      };
    }).filter((item: OrderItem) => item.productName !== 'Unknown Product' && (item.quantityBox > 0 || item.quantityItem > 0));

    return orderItems;

  } catch (error) {
    console.error("DeepSeek Parsing Error:", error);
    throw error;
  }
};