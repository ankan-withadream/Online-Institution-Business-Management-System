/**
 * Role-Based Access Control middleware.
 * Usage: authorize('admin', 'student') — allows only those roles.
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `Role '${req.user.role}' is not authorized for this resource`,
      });
    }

    next();
  };
};
