import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';

export const getForecast = async (req, res) => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const currentDate = today.getDate();

    // Month range
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Get all expense transactions for the current month
    // Supports both `date` and `createdAt`
    const transactions = await Transaction.find({
      userId: req.user._id,
      type: { $regex: /^expense$/i },
      $or: [
        { date: { $gte: startOfMonth, $lte: endOfToday } },
        { createdAt: { $gte: startOfMonth, $lte: endOfToday } },
      ],
    }).sort({ date: 1, createdAt: 1 });

    const budget = await Budget.findOne({
      userId: req.user._id,
      month: currentMonth,
      year: currentYear,
    });

    // Sum all expense amounts safely
    const totalSpent = Array.isArray(transactions)
      ? transactions.reduce((acc, curr) => {
          const amt = Number(curr?.amount);
          return acc + (Number.isFinite(amt) ? amt : 0);
        }, 0)
      : 0;

    // If there is at least one expense transaction, we consider it valid spending data
    const hasSpending = Array.isArray(transactions) && transactions.length > 0;

    const averageDailySpend = hasSpending && currentDate > 0
      ? totalSpent / currentDate
      : 0;

    const forecastedTotal = hasSpending
      ? averageDailySpend * daysInMonth
      : null;

    let status = 'On Track';

    if (budget && hasSpending) {
      const limit = Number(budget.limitAmount);
      if (Number.isFinite(limit) && forecastedTotal !== null && forecastedTotal > limit) {
        status = 'Over Budget Projected';
      }
    }

    res.json({
      currentDay: currentDate,
      daysInMonth,
      totalSpentSoFar: Number(totalSpent.toFixed(2)),
      averageDailySpend: Number(averageDailySpend.toFixed(2)),
      forecastedTotal: forecastedTotal !== null ? Number(forecastedTotal.toFixed(2)) : null,
      budgetLimit: budget ? budget.limitAmount : null,
      status,
      hasSpending,
    });
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({ message: error.message });
  }
};