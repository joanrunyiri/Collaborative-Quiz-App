import { authRoutes } from "./routes/authRoutes.js";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import userRoutes from "./routes/userRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";


dotenv.config();

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);

app.use("/api/quizzes", quizRoutes);

app.get("/", (req, res) => res.send("API Running..."));

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Join a quiz editing room
    socket.on("joinQuiz", (quizId) => {
        socket.join(quizId);
        console.log(`User joined quiz room: ${quizId}`);
    });

    // Listen for quiz updates
    socket.on("quizUpdated", (data) => {
        const { quizId, updatedQuiz } = data;
        socket.to(quizId).emit("receiveQuizUpdate", updatedQuiz);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 5001;
app.use("/api/auth", authRoutes);
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
