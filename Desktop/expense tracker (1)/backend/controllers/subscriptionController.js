import Subscription from '../models/Subscription.js';

export const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user._id }).sort({ nextBillingDate: 1 });
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSubscription = async (req, res) => {
  try {
    const { name, amount, frequency, nextBillingDate, category } = req.body;

    if (!name || !amount || !nextBillingDate) {
      return res.status(400).json({ message: 'Name, amount, and next billing date are required' });
    }

    const subscription = await Subscription.create({
      userId: req.user._id,
      name,
      amount: Number(amount),
      frequency,
      nextBillingDate: new Date(nextBillingDate),
      category,
    });

    res.status(201).json(subscription);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      res.status(404);
      throw new Error('Subscription not found');
    }

    if (subscription.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('User not authorized');
    }

    await subscription.deleteOne();
    res.json({ id: req.params.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
