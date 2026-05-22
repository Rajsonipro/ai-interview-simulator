import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        const authError = new Error('User not found - please log in again');
        res.status(401);
        return next(authError);
      }
      
      return next();
    } catch (error) {
      console.error(error);
      const authError = new Error('Not authorized, token failed');
      res.status(401);
      return next(authError);
    }
  }

  if (!token) {
    const authError = new Error('Not authorized, no token');
    res.status(401);
    return next(authError);
  }
};

export { protect };
