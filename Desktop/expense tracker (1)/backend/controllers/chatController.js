import { GoogleGenerativeAI } from '@google/generative-ai';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Subscription from '../models/Subscription.js';

export const getChatResponse = async (req, res) => {
  try {
    const { query } = req.body;
    const userIdStr = req.user.id; 

    if (!query) {
      return res.status(400).json({ message: 'No query provided' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('CRITICAL: GEMINI_API_KEY is missing from .env');
      return res.status(500).json({ message: 'Gemini API key is not configured on the server' });
    }

    // Fetch user data for context - REDUCED to 5 to save quota
    let transactions = [];
    let budget = null;
    let subscriptions = [];

    try {
        transactions = await Transaction.find({ userId: userIdStr }).sort({ date: -1 }).limit(5);
        budget = await Budget.findOne({ userId: userIdStr });
        subscriptions = await Subscription.find({ userId: userIdStr, isActive: true });
    } catch (dbError) {
        console.error('Database Error in Chat:', dbError);
    }

    const contextData = {
      transactions: transactions.map(t => `${t.title} ($${t.amount})`).join(', '),
      budget: budget ? budget.limitAmount : 'Not set',
      subscriptions: subscriptions.map(s => s.name).join(', ')
    };

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Using the 'latest' alias for lite-flash which has the highest quota in 2026
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

    const fullPrompt = `
    You are "ExpenseBot", an expert financial advisor. 
    Using the user's data below, answer their question in a helpful, friendly, and concise manner.

    USER FINANCIAL DATA:
    ---
    RECENT TRANSACTIONS:
    ${contextData.transactions || 'No recent transactions found.'}
    
    MONTHLY BUDGET LIMIT:
    ₹${contextData.budget}
    
    ACTIVE SUBSCRIPTIONS:
    ${contextData.subscriptions || 'No active subscriptions found.'}
    ---

    USER QUESTION: "${query}"

    RESPONSE RULES:
    1. Keep it under 3-10 sentences.
    2. Format money with ₹ (Indian Rupees).
    3. If asked about affordability, use the budget information (₹${contextData.budget}).
    4. Do not offer professional investment advice.
    5. If data is missing, suggest they add some transactions first.
    6. Speak in a way that feels helpful to an Indian user.
    `;

    console.log('Generating AI response for query:', query);

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
        throw new Error('AI returned an empty response');
    }

    res.json({ text });

  } catch (error) {
    console.error('Chat Controller Error:', error);
    res.status(500).json({ 
        message: 'AI Chat Error: ' + error.message,
        details: error.stack 
    });
  }
};
