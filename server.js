import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(cors());
// Increase payload limit to support base64 image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

const SYSTEM_INSTRUCTION = `
You are an elite CLI Assistant built by the USER. Your primary function is to provide highly accurate, cross-platform terminal commands and automation scripts.

When providing commands, format them clearly in markdown code blocks.
If the command differs between Windows (PowerShell/CMD), Linux, or macOS, you MUST explicitly provide the correct command for each OS.
Assume the user wants modern, efficient, and direct answers without unnecessary fluff.
Maintain a highly professional, enterprise-grade AI persona.

If the user attaches an image or a log file of an error, analyze it carefully. Identify the terminal error or issue from the file and provide the proper terminal instructions to fix it.
`;

app.post('/api/chat', async (req, res) => {
    try {
        const { message, attachment } = req.body;
        
        if (!message && !attachment) {
            return res.status(400).json({ error: "Message or attachment is required" });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
             return res.json({ text: "[ERR] GEMINI_API_KEY is missing or invalid in your .env file. Please add it." });
        }

        const parts = [];
        if (message) {
            parts.push({ text: message });
        }
        if (attachment && attachment.data && attachment.mimeType) {
            parts.push({
                inlineData: {
                    data: attachment.data,
                    mimeType: attachment.mimeType
                }
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        let baseModel = process.env.GEMINI_MODEL || "gemini-flash-latest";
        if (baseModel === "gemini-1.5-pro") baseModel = "gemini-flash-latest";

        const fallbackModels = [
            baseModel,
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-1.0-pro",
            "gemini-pro"
        ];

        let aiMessage = null;
        let lastError = null;

        for (const modelName of fallbackModels) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: SYSTEM_INSTRUCTION
                });
                const result = await model.generateContent(parts);
                aiMessage = result.response.text();
                break; // Success! Stop trying other models.
            } catch (error) {
                console.log(`[WARN] Model ${modelName} failed, falling back... Error: ${error.message.substring(0, 100)}`);
                lastError = error;
            }
        }

        if (aiMessage === null) {
            throw lastError || new Error("All fallback models failed.");
        }

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
