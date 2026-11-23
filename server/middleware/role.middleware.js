import { ApiError } from '../http.js';

export const role = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) throw new ApiError(403, 'FORBIDDEN', 'Access denied.');
  next();
};

export const learner = role('learner');
export const admin = role('admin', 'super_admin');
export const superAdmin = role('super_admin');
