import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import Quiz from '../models/Quiz.js';

const router = express.Router();

// ✅ Create a new quiz
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, questions } = req.body;
        const quiz = new Quiz({ title, description, questions, createdBy: req.user.id });

        await quiz.save();
        res.status(201).json(quiz);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ Get all quizzes
router.get('/', async (req, res) => {
    try {
        const quizzes = await Quiz.find().populate('createdBy', 'username');
        res.json(quizzes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ Get a single quiz
router.get('/:id', async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id).populate('createdBy', 'username');
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        res.json(quiz);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ Update a quiz (creator & collaborators can update)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        const userId = req.user.id;
        if (quiz.createdBy.toString() !== userId && !quiz.collaborators.includes(userId)) {
            return res.status(403).json({ message: "Not authorized to edit this quiz" });
        }

        Object.assign(quiz, req.body);
        await quiz.save();
        res.json(quiz);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ✅ Delete a quiz (only creator can delete)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        if (quiz.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to delete this quiz" });
        }

        await quiz.deleteOne();
        res.json({ message: "Quiz deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ✅ Add a collaborator to a quiz
router.put('/:id/collaborators', authMiddleware, async (req, res) => {
    try {
        const { collaboratorId } = req.body; // ID of the user to be added
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        // Only the creator can add collaborators
        if (quiz.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to add collaborators" });
        }

        // Prevent duplicate collaborator entries
        if (quiz.collaborators.includes(collaboratorId)) {
            return res.status(400).json({ message: "User is already a collaborator" });
        }

        quiz.collaborators.push(collaboratorId);
        await quiz.save();

        res.json({ message: "Collaborator added successfully", quiz });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;