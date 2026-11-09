const { TelegramClient, Api } = require("telegram");
const { StoreSession } = require("telegram/sessions");
const path = require("path");
const fs = require("fs");

const SESSIONS_DIR = path.join(__dirname, '..', 'sessions');

const getAbsoluteSessionDir = (phone) => {
    return phone ? path.join(SESSIONS_DIR, phone) : SESSIONS_DIR;
};

const getSessionPath = (phone) => {
    if (!fs.existsSync(SESSIONS_DIR)) {
        fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    }
    const fullPath = getAbsoluteSessionDir(phone);
    return path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
};

function clearSession(phone) {
    try {
        const absDir = getAbsoluteSessionDir(phone);
        if (fs.existsSync(absDir)) {
            fs.rmSync(absDir, { recursive: true, force: true });
        }
    } catch (e) {
        console.error("Error clearing session:", e.message);
    }
}

// Store in-memory instances and phoneCodeHash needed for sign in
const authSessions = new Map();

async function startAuth(phone) {
    const apiId = parseInt(process.env.APP_API_ID);
    const apiHash = process.env.APP_API_HASH;
    
    if (isNaN(apiId) || !apiHash) {
        throw new Error("Telegram API ID and Hash not configured");
    }
    const sessionDir = getAbsoluteSessionDir(phone);
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    const sessionRel = getSessionPath(phone);
    const storeSession = new StoreSession(sessionRel);
    const client = new TelegramClient(storeSession, apiId, apiHash, { connectionRetries: 5 });
    
    await client.connect();

    const result = await client.sendCode(
        {
            apiId,
            apiHash
        },
        phone
    );

    authSessions.set(phone, { client, phoneCodeHash: result.phoneCodeHash });
}

async function verifyCode(phone, code) {
    const sessionData = authSessions.get(phone);
    if (!sessionData) {
        throw new Error("No auth session found for this phone. Please request an OTP first.");
    }

    const { client, phoneCodeHash } = sessionData;

    try {
        await client.invoke(
            new Api.auth.SignIn({
                phoneNumber: phone,
                phoneCodeHash,
                phoneCode: code
            })
        );
    } finally {
        await client.disconnect();
        authSessions.delete(phone);
    }
}

async function checkSession(phone) {
    const apiId = parseInt(process.env.APP_API_ID);
    const apiHash = process.env.APP_API_HASH;

    const absDir = getAbsoluteSessionDir(phone);
    if (!fs.existsSync(absDir)) {
        return false;
    }

    const sessionRel = getSessionPath(phone);
    const storeSession = new StoreSession(sessionRel);
    const client = new TelegramClient(storeSession, apiId, apiHash, { connectionRetries: 1 });
    
    try {
        await client.connect();
        const isAuth = await client.isUserAuthorized();
        await client.disconnect();
        if (!isAuth) {
            clearSession(phone);
        }
        return isAuth;
    } catch (e) {
        clearSession(phone);
        return false;
    }
}

async function fetchUserInfo(phone) {
    const apiId = parseInt(process.env.APP_API_ID);
    const apiHash = process.env.APP_API_HASH;

    const absDir = getAbsoluteSessionDir(phone);
    if (!fs.existsSync(absDir)) {
        throw new Error("Session not found. Please log in again.");
    }

    const sessionRel = getSessionPath(phone);
    const storeSession = new StoreSession(sessionRel);
    const client = new TelegramClient(storeSession, apiId, apiHash, { connectionRetries: 3 });
    
    await client.connect();

    try {
        const isAuth = await client.isUserAuthorized();
        if (!isAuth) {
            clearSession(phone);
            throw new Error("Session expired or unauthorized. Please log in again.");
        }

        const me = await client.getMe();
        
        let photoBase64 = null;
        try {
            const photoBytes = await client.downloadProfilePhoto(me);
            if (photoBytes && photoBytes.length > 0) {
                photoBase64 = Buffer.from(photoBytes).toString("base64");
            }
        } catch (e) {
            console.error("Error downloading photo", e);
        }

        return {
            id: Number(me.id),
            username: me.username,
            phone: me.phone,
            first_name: me.firstName,
            last_name: me.lastName,
            photo: photoBase64,
        };
    } catch (e) {
        if (e.message && (e.message.includes("AUTH_KEY_UNREGISTERED") || e.message.includes("SESSION_REVOKED") || e.message.includes("SESSION_EXPIRED"))) {
            clearSession(phone);
            throw new Error("Session expired or unauthorized. Please log in again.");
        }
        throw e;
    } finally {
        await client.disconnect();
    }
}

async function logout(phone) {
    const apiId = parseInt(process.env.APP_API_ID);
    const apiHash = process.env.APP_API_HASH;

    const absDir = getAbsoluteSessionDir(phone);
    if (!fs.existsSync(absDir)) {
        return;
    }

    const sessionRel = getSessionPath(phone);
    const storeSession = new StoreSession(sessionRel);
    const client = new TelegramClient(storeSession, apiId, apiHash, { connectionRetries: 3 });
    
    try {
        await client.connect();
        if (await client.isUserAuthorized()) {
            await client.invoke(new Api.auth.LogOut());
        }
    } catch (e) {
        console.warn("Logout warning:", e.message);
    } finally {
        await client.disconnect();
        clearSession(phone);
    }
}

async function fetchDialogs(phone) {
    const apiId = parseInt(process.env.APP_API_ID);
    const apiHash = process.env.APP_API_HASH;
    const absDir = getAbsoluteSessionDir(phone);
    if (!fs.existsSync(absDir)) {
        throw new Error("Session not found. Please log in again.");
    }
    
    const sessionRel = getSessionPath(phone);
    const storeSession = new StoreSession(sessionRel);
    const client = new TelegramClient(storeSession, apiId, apiHash, { connectionRetries: 3 });
    await client.connect();
    
    try {
        const isAuth = await client.isUserAuthorized();
        if (!isAuth) {
            clearSession(phone);
            throw new Error("Session expired or unauthorized. Please log in again.");
        }
        
        const dialogs = await client.getDialogs({ limit: 20 });
        return (dialogs || []).map(d => ({
            id: d.id ? d.id.toString() : (d.dialog?.peer ? String(d.dialog.peer.channelId || d.dialog.peer.chatId || d.dialog.peer.userId || Math.random()) : 'unknown'),
            name: d.title || d.name || 'Telegram Chat',
            isGroup: Boolean(d.isGroup),
            isChannel: Boolean(d.isChannel),
            unreadCount: d.unreadCount || 0,
            message: d.message?.message || ''
        }));
    } catch (e) {
        if (e.message && (e.message.includes("AUTH_KEY_UNREGISTERED") || e.message.includes("SESSION_REVOKED") || e.message.includes("SESSION_EXPIRED"))) {
            clearSession(phone);
            throw new Error("Session expired or unauthorized. Please log in again.");
        }
        throw e;
    } finally {
        await client.disconnect();
    }
}

async function fetchMessages(phone, chatId, limit = 50) {
    const apiId = parseInt(process.env.APP_API_ID);
    const apiHash = process.env.APP_API_HASH;
    const absDir = getAbsoluteSessionDir(phone);
    if (!fs.existsSync(absDir)) {
        throw new Error("Session not found. Please log in again.");
    }
    
    const sessionRel = getSessionPath(phone);
    const storeSession = new StoreSession(sessionRel);
    const client = new TelegramClient(storeSession, apiId, apiHash, { connectionRetries: 3 });
    await client.connect();
    
    try {
        const isAuth = await client.isUserAuthorized();
        if (!isAuth) {
            clearSession(phone);
            throw new Error("Session expired or unauthorized. Please log in again.");
        }
        
        const messages = await client.getMessages(chatId, { limit });
        return (messages || []).map(m => ({
            id: m.id,
            text: m.message,
            senderId: m.senderId?.toString(),
            date: m.date
        })).filter(m => m.text);
    } catch (e) {
        if (e.message && (e.message.includes("AUTH_KEY_UNREGISTERED") || e.message.includes("SESSION_REVOKED") || e.message.includes("SESSION_EXPIRED"))) {
            clearSession(phone);
            throw new Error("Session expired or unauthorized. Please log in again.");
        }
        throw e;
    } finally {
        await client.disconnect();
    }
}

async function sendMessage(phone, chatId, messageText) {
    const apiId = parseInt(process.env.APP_API_ID);
    const apiHash = process.env.APP_API_HASH;
    const absDir = getAbsoluteSessionDir(phone);
    if (!fs.existsSync(absDir)) {
        throw new Error("Session not found. Please log in again.");
    }
    
    const sessionRel = getSessionPath(phone);
    const storeSession = new StoreSession(sessionRel);
    const client = new TelegramClient(storeSession, apiId, apiHash, { connectionRetries: 3 });
    await client.connect();
    
    try {
        const isAuth = await client.isUserAuthorized();
        if (!isAuth) {
            clearSession(phone);
            throw new Error("Session expired or unauthorized. Please log in again.");
        }
        await client.sendMessage(chatId, { message: messageText });
    } catch (e) {
        if (e.message && (e.message.includes("AUTH_KEY_UNREGISTERED") || e.message.includes("SESSION_REVOKED") || e.message.includes("SESSION_EXPIRED"))) {
            clearSession(phone);
            throw new Error("Session expired or unauthorized. Please log in again.");
        }
        throw e;
    } finally {
        await client.disconnect();
    }
}

module.exports = {
    startAuth,
    verifyCode,
    checkSession,
    fetchUserInfo,
    logout,
    fetchDialogs,
    fetchMessages,
    sendMessage,
    clearSession
};
