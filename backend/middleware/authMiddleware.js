import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    const authHeader = req.header("Authorization");
    console.log("Auth Header Received:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    const token = authHeader.split(" ")[1]; // Extract token
    console.log("Extracted Token:", token);

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Verified User:", verified);
        req.user = verified;
        next();
    } catch (err) {
        console.error("Invalid Token Error:", err.message);
        return res.status(400).json({ message: "Invalid token" });
    }
};
export default authMiddleware;