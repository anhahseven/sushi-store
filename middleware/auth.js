export function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

export function checkRole(allowedRoles) {
  return (req, res, next) => {
    if (req.user && (allowedRoles.includes(req.user.role) || req.user.role === "demo")) {
      return next();
    }
    res.status(403).send("Access Denied");
  };
}

