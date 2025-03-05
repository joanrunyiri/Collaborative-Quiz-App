import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

// ✅ Protected route: Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");  // Remove password field
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;