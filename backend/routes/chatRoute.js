import express from 'express';
import { sendMessage, clearHistory } from '../controllers/chatController.js';

const chatRouter = express.Router();

// POST /api/chat - Send a message to the AI chatbot
chatRouter.post("/", sendMessage);

// POST /api/chat/clear - Clear conversation history
chatRouter.post("/clear", clearHistory);

export default chatRouter;
