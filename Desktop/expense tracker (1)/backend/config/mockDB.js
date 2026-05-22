import bcrypt from 'bcryptjs';

// In-memory database
const mockDB = {
  users: [],
  transactions: [],
  budgets: [],
};

// User operations
export const mockFindUserByEmail = (email) => {
  return mockDB.users.find(u => u.email === email);
};

export const mockFindUserById = (id) => {
  return mockDB.users.find(u => u._id === id);
};

export const mockCreateUser = async (name, email, password) => {
  const existingUser = mockFindUserByEmail(email);
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    _id: `user_${Date.now()}`,
    name,
    email,
    password: hashedPassword,
    createdAt: new Date(),
  };

  mockDB.users.push(newUser);
  return newUser;
};

export const mockVerifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Transaction operations
export const mockGetTransactions = (userId) => {
  return mockDB.transactions.filter(t => t.userId === userId);
};

export const mockCreateTransaction = (userId, data) => {
  const transaction = {
    _id: `trans_${Date.now()}`,
    userId,
    ...data,
    createdAt: new Date(),
  };
  mockDB.transactions.push(transaction);
  return transaction;
};

// Budget operations
export const mockGetBudget = (userId, month, year) => {
  return mockDB.budgets.find(b => b.userId === userId && b.month === month && b.year === year);
};

export const mockCreateOrUpdateBudget = (userId, month, year, limitAmount) => {
  const existingBudget = mockGetBudget(userId, month, year);
  if (existingBudget) {
    existingBudget.limitAmount = limitAmount;
    return existingBudget;
  }

  const budget = {
    _id: `budget_${Date.now()}`,
    userId,
    month,
    year,
    limitAmount,
    spentAmount: 0,
    createdAt: new Date(),
  };
  mockDB.budgets.push(budget);
  return budget;
};

export default mockDB;
