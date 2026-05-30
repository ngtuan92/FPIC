import jwt from "jsonwebtoken";

export const authorize = (roles = []) => {
  if (typeof roles === "string") {
    roles = [roles];
  }

  return (req, res, next) => {
    if (roles.length && !roles.includes(req?.user?.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};
export const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const data = jwt.verify(token, "sown");
    const account = await Account.findById(data._id);
    if (!account || account.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    res.locals.account = account;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
export const verifyToken = (req, res, next) => {
  // Kiểm tra token từ nhiều nguồn (header, cookie, query)
  const token =
    req.headers.authorization?.split(" ")[1] ||
    req.cookies.token ||
    req.query.token;

  if (!token) {
    return res.status(401).json({ message: "Không tìm thấy token" });
  }

  try {
    const decoded = jwt.verify(token, "sown");
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification error:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token đã hết hạn" });
    }

    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};
