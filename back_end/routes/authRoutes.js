const express = require('express');
const { startAuth, verifyCode, checkSession, logout } = require('../utils/telegramClient');
const { updateUserRegistration } = require('../utils/db');

const router = express.Router();

// Temporarily store registration data while waiting for OTP
const registrationCache = new Map();

router.post('/register-start', async (req, res) => {
    try {
        const { phone, email, username } = req.body;
        if (!phone || !email || !username) {
            return res.status(400).json({ detail: "Phone, email, and username are required" });
        }
        
        // Save to cache
        registrationCache.set(phone, { email, username });
        
        // Start telegram auth
        await startAuth(phone);
        res.json({ message: "OTP sent" });
    } catch (error) {
        res.status(400).json({ detail: error.message });
    }
});

router.post('/start', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ detail: "Phone is required" });
        }
        await startAuth(phone);
        res.json({ message: "OTP sent" });
    } catch (error) {
        res.status(400).json({ detail: error.message });
    }
});

router.post('/verify', async (req, res) => {
    try {
        const { phone, code } = req.body;
        if (!phone || !code) {
            return res.status(400).json({ detail: "Phone and code are required" });
        }
        
        await verifyCode(phone, code);
        
        // If registering, save the custom data to Firebase
        if (registrationCache.has(phone)) {
            await updateUserRegistration(phone, registrationCache.get(phone));
            registrationCache.delete(phone);
        }
        
        res.json({ message: "Login successful" });
    } catch (error) {
        res.status(400).json({ detail: error.message });
    }
});

router.get('/check_session', async (req, res) => {
    try {
        const { phone } = req.query;
        if (!phone) {
            return res.status(400).json({ detail: "Phone is required" });
        }
        const isAuthenticated = await checkSession(phone);
        res.json({ authenticated: isAuthenticated });
    } catch (error) {
        res.status(400).json({ detail: error.message });
    }
});

router.post('/logout/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        await logout(phone);
        res.json({ message: "Logout successful" });
    } catch (error) {
        res.status(400).json({ detail: error.message });
    }
});

module.exports = router;
