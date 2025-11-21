const allowRoles = (...roles) => {
  return (req, res, next) => {
    let role = req.user?.role;

    // Safety: Trim to avoid issues like "student "
    if (typeof role === "string") {
      role = role.trim();
    }

    if (!role) {
      return res.status(401).json({ message: "Unauthorized: No role found" });
    }

    if (!roles.includes(role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient role" });
    }

    next();
  };
};
module.exports = allowRoles;
