// middleware/checkRole.js
export function checkRole(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).send("Chưa đăng nhập");
    if (!roles.includes(req.user.role))
      return res.status(403).send("Không có quyền");
    next();
  };
}
