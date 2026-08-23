const express = require('express');
const NodeCache = require('node-cache');
const { fetchUserInfo, fetchDialogs, fetchMessages } = require('../utils/telegramClient');
const { getUser, useLimit, saveSummary, getSummaries, getAnalytics } = require('../utils/db');

const router = express.Router();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

const { GoogleGenerativeAI } = require("@google/generative-ai");

async function generateSummary(text) {
    if (!process.env.GEMINI_API_KEY) {
        return "✨ This is a mock AI summary because GEMINI_API_KEY is not set in your .env file! \n\nThe original chat contained " + text.length + " characters. Upgrade to Pro for unlimited real summaries!";
    }
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using dynamic latest model pointers instead of hardcoded 1.5 versions
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        
        const prompt = "Summarize this chat concisely, highlighting the main topics and any action items:\n\n" + text;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (e) {
        // Fallback to pro if flash isn't available
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });
            const prompt = "Summarize this chat concisely, highlighting the main topics and any action items:\n\n" + text;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (fallbackError) {
            return "AI Error: " + e.message;
        }
    }
}

router.get('/profile/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        const userInfo = await fetchUserInfo(phone);
        const dbUser = await getUser(phone);
        
        res.json({
            ...userInfo,
            subscription_tier: dbUser.subscription_tier,
            usage_count: dbUser.usage_count
        });
    } catch (error) {
        res.status(400).json({ detail: error.message });
    }
});

router.get('/dialogs/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        
        const cacheKey = `dialogs_${phone}`;
        const cached = cache.get(cacheKey);
        if (cached) return res.json(cached);

        const dialogs = await fetchDialogs(phone);
        cache.set(cacheKey, dialogs);
        
        res.json(dialogs);
    } catch (error) {
        res.status(400).json({ detail: error.message });
    }
});

router.post('/summarize/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        const { chatId, chatName } = req.body;
        
        if (!chatId || !chatName) {
            return res.status(400).json({ detail: "chatId and chatName required" });
        }

        // 1. Deduct Limit
        await useLimit(phone);

        // 2. Fetch Chat History
        const messages = await fetchMessages(phone, chatId, 50);
        if (!messages || messages.length === 0) {
            return res.status(400).json({ detail: "No text messages found in this chat" });
        }
        
        const fullText = messages.map(m => m.text).join('\n');

        // 3. Generate AI Summary
        const summary = await generateSummary(fullText);

        res.json({ summary, originalLength: fullText.length });
    } catch (error) {
        res.status(400).json({ detail: error.message });
    }
});

router.post('/save-summary/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        const { chatName, originalLength, summaryText } = req.body;
        
        if (!chatName || !summaryText) {
            return res.status(400).json({ detail: "chatName and summaryText required" });
        }

        await saveSummary(phone, chatName, originalLength || summaryText.length, summaryText);
        res.json({ message: "Summary saved successfully" });
    } catch (error) {
        res.status(400).json({ detail: error.message });
    }
});

router.post('/send-message/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        const { chatId, text } = req.body;
        
        if (!chatId || !text) {
            return res.status(400).json({ detail: "chatId and text required" });
        }
        
        const { sendMessage } = require('../utils/telegramClient');
        await sendMessage(phone, chatId, text);
        
        res.json({ message: "Message sent successfully" });
    } catch (error) {
        res.status(400).json({ detail: error.message });
    }
});

router.get('/history/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        const summaries = await getSummaries(phone);
        res.json(summaries);
    } catch (error) {
        res.status(400).json({ detail: error.message });
    }
});

router.get('/analytics/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        const analytics = await getAnalytics(phone);
        res.json(analytics);
    } catch (error) {
        res.status(400).json({ detail: error.message });
    }
});

module.exports = router;
