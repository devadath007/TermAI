import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const SYSTEM_INSTRUCTION = `
You are an elite CLI Assistant built by the USER. Your primary function is to provide highly accurate, cross-platform terminal commands and automation scripts.

When providing commands, format them clearly in markdown code blocks.
If the command differs between Windows (PowerShell/CMD), Linux, or macOS, you MUST explicitly provide the correct command for each OS.
Assume the user wants modern, efficient, and direct answers without unnecessary fluff.
Maintain a highly professional, enterprise-grade AI persona.
`;

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
             return res.json({ text: "[ERR] GEMINI_API_KEY is missing or invalid in your .env file. Please add it." });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        let modelName = process.env.GEMINI_MODEL || "gemini-flash-latest";
        if (modelName === "gemini-1.5-pro") {
            modelName = "gemini-flash-latest";
        }
        
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: SYSTEM_INSTRUCTION
        });

        const result = await model.generateContent(message);
        const aiMessage = result.response.text();

        res.json({ text: aiMessage });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ text: `[CRITICAL FAULT] Core connection severed. Details: ${error.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`TermAI Backend (Gemini) running on http://localhost:${PORT}`);
});
