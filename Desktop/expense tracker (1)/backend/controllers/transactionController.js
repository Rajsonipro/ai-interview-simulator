import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import mongoose from 'mongoose';

export const getTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, search, sort } = req.query;

    let query = { userId: req.user._id };

    if (type) query.type = type;
    if (category) query.category = category;
    
    if (startDate && endDate) {
      query.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { note: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOptions = { date: -1 };
    if (sort === 'oldest') sortOptions = { date: 1 };
    if (sort === 'highest') sortOptions = { amount: -1 };
    if (sort === 'lowest') sortOptions = { amount: 1 };

    const transactions = await Transaction.find(query).sort(sortOptions);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const { title, amount, type, category, date, note } = req.body;

    if (!title || amount === undefined || amount === null || !type || !category || !date) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Parse and validate date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Normalize amount (scanner can return things like "₹1,200" or "1,200.50")
    const rawAmount = typeof amount === 'string' ? amount : String(amount);
    const normalizedAmount = Number(rawAmount.replace(/[^0-9.\-]/g, ''));

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json({ message: 'Invalid amount format' });
    }

    const normalizedType = String(type).trim();
    if (!['income', 'expense'].includes(normalizedType)) {
      return res.status(400).json({ message: 'Invalid transaction type' });
    }

    const transaction = await Transaction.create({
      userId: req.user._id,
      title: title.trim(),
      amount: normalizedAmount,
      type: normalizedType,
      category: String(category).trim(),
      date: parsedDate,
      note: note?.trim(),
    });

    // Update budget spent amount if it's an expense
    if (type === 'expense') {
      try {
        const transDate = parsedDate;
        const month = transDate.getMonth() + 1;
        const year = transDate.getFullYear();

        const budget = await Budget.findOne({ userId: req.user._id, month, year });
        if (budget) {
          budget.spentAmount += Number(amount);
          await budget.save();
        }
      } catch (budgetErr) {
        console.error('Budget update failed:', budgetErr);
      }
    }

    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      res.status(404);
      throw new Error('Transaction not found');
    }

    if (transaction.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('User not authorized');
    }

    // Handle budget adjustments if amount or type changed
    if (transaction.type === 'expense') {
      const transDate = new Date(transaction.date);
      const month = transDate.getMonth() + 1;
      const year = transDate.getFullYear();
      const budget = await Budget.findOne({ userId: req.user._id, month, year });
      if (budget) {
        budget.spentAmount -= transaction.amount;
        if(req.body.type === 'expense') {
             budget.spentAmount += Number(req.body.amount || transaction.amount);
        }
        await budget.save();
      }
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      res.status(404);
      throw new Error('Transaction not found');
    }

    if (transaction.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('User not authorized');
    }

    if (transaction.type === 'expense') {
      const transDate = new Date(transaction.date);
      const month = transDate.getMonth() + 1;
      const year = transDate.getFullYear();
      const budget = await Budget.findOne({ userId: req.user._id, month, year });
      if (budget) {
        budget.spentAmount -= transaction.amount;
        await budget.save();
      }
    }

    await transaction.deleteOne();

    res.json({ id: req.params.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

