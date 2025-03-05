import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const router = express.Router();

// Register User
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        console.log("Received data:", req.body);  // ✅ Debug log

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "User already exists" });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);  // ✅ Ensure `password` is not undefined

        // Create user
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        console.error("Error:", err);  // ✅ Log any errors
        res.status(500).json({ message: err.message });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Login Attempt:", req.body);  // ✅ Debug log

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        console.log("Generating Token with:", process.env.JWT_SECRET);  // ✅ Debug log

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
    } catch (err) {
        console.error("Login Error:", err);  // ✅ Log errors
        res.status(500).json({ message: err.message });
    }
});
// Verify Token Middleware
const verifyToken = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ message: "Access denied" });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: "Invalid token" });
    }
};

export { router as authRoutes, verifyToken };