import { GoogleGenerativeAI } from '@google/generative-ai';

export const scanReceipt = async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ message: 'No image provided' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'Gemini API key is not configured' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Assume imageBase64 has the 'data:image/jpeg;base64,' prefix stripped
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `Analyze this receipt image and extract the following information.
Return ONLY a valid JSON object with the following keys exactly as written, and no markdown formatting or extra text:

"title": (The name of the merchant/store)
"amount": (The exact total amount as a number, e.g. 15.99)
"category": (Pick ONE of: Food, Transport, Utilities, Entertainment, Health, Other. If the receipt looks like logistics/shipping/courier/delivery/packaging/vehicle-fuel/ride/taxi/bus then choose Transport. If it looks like courier/logistics for sending goods, choose Transport not Food.)
"date": (The date on the receipt in YYYY-MM-DD format, or today's date if not found)
`;


    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg'
        }
      }
    ]);

    const response = await result.response;


    let rawText = response.text();
    console.log('Gemini Raw Response:', rawText);
    
    // Clean up markdown if present
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
        const parsedData = JSON.parse(rawText);
        res.json(parsedData);
    } catch (parseError) {
        console.error('JSON Parse Error:', parseError, 'Raw Text:', rawText);
        res.status(500).json({ message: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ message: 'Failed to process receipt: ' + error.message });
  }
};

