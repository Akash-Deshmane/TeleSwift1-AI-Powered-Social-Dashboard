const { TelegramClient, Api } = require("telegram");
const { StoreSession, StringSession } = require("telegram/sessions");
const path = require("path");
const fs = require("fs");
const {
    getUserSession,
    saveUserSession,
    clearUserSession,
    savePendingAuth,
    getPendingAuth,
    clearPendingAuth
} = require("./db");

function getTelegramConfig() {
    const rawId = (process.env.APP_API_ID || process.env.TELEGRAM_API_ID || "").replace(/['"\s]/g, "");
    const rawHash = (process.env.APP_API_HASH || process.env.TELEGRAM_API_HASH || "").replace(/['"\s]/g, "");
    const apiId = parseInt(rawId, 10);
    const apiHash = rawHash;

    if (isNaN(apiId) || !apiHash) {
        const missing = [];
        if (!rawId) missing.push("APP_API_ID is missing");
        else if (isNaN(apiId)) missing.push("APP_API_ID is not a valid number");
        if (!apiHash) missing.push("APP_API_HASH is missing");
        throw new Error(`Telegram API configuration error (${missing.join(", ")}). Check Vercel Environment Variables (Production) and redeploy.`);
    }

    return { apiId, apiHash };
}

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

async function clearSession(phone) {
    try {
        await clearUserSession(phone);
        if (!process.env.VERCEL) {
            const absDir = getAbsoluteSessionDir(phone);
            if (fs.existsSync(absDir)) {
                fs.rmSync(absDir, { recursive: true, force: true });
            }
        }
    } catch (e) {
        console.error("Error clearing session:", e.message);
    }
}

// In-memory instances and phoneCodeHash needed for sign in
const authSessions = new Map();

async function startAuth(phone) {
    const { apiId, apiHash } = getTelegramConfig();

    const stringSession = new StringSession("");
    const client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 });
    
    await client.connect();

    const result = await client.sendCode(
        {
            apiId,
            apiHash
        },
        phone
    );

    const pendingSessionStr = client.session.save();
    await savePendingAuth(phone, pendingSessionStr, result.phoneCodeHash);
    authSessions.set(phone, { client, phoneCodeHash: result.phoneCodeHash });
}

async function verifyCode(phone, code) {
    let sessionData = authSessions.get(phone);
    let client;
    let phoneCodeHash;

    if (sessionData) {
        client = sessionData.client;
        phoneCodeHash = sessionData.phoneCodeHash;
        if (!client.connected) {
            await client.connect();
        }
    } else {
        const pending = await getPendingAuth(phone);
        if (!pending) {
            throw new Error("No auth session found for this phone. Please request an OTP first.");
        }
        const { apiId, apiHash } = getTelegramConfig();
        client = new TelegramClient(new StringSession(pending.pendingSession), apiId, apiHash, { connectionRetries: 5 });
        await client.connect();
        phoneCodeHash = pending.phoneCodeHash;
    }

    try {
        await client.invoke(
            new Api.auth.SignIn({
                phoneNumber: phone,
                phoneCodeHash,
                phoneCode: code
            })
        );
        const sessionString = client.session.save();
        await saveUserSession(phone, sessionString);
        await clearPendingAuth(phone);
    } finally {
        await client.disconnect();
        authSessions.delete(phone);
    }
}

async function getClient(phone) {
    const { apiId, apiHash } = getTelegramConfig();

    // 1. Check MongoDB session string
    const sessionString = await getUserSession(phone);
    if (sessionString) {
        const session = new StringSession(sessionString);
        return new TelegramClient(session, apiId, apiHash, { connectionRetries: 3 });
    }

    // 2. Fallback to disk if running locally
    if (!process.env.VERCEL) {
        const absDir = getAbsoluteSessionDir(phone);
        if (fs.existsSync(absDir)) {
            const storeSession = new StoreSession(getSessionPath(phone));
            return new TelegramClient(storeSession, apiId, apiHash, { connectionRetries: 3 });
        }
    }

    throw new Error("Session not found. Please log in again.");
}

async function checkSession(phone) {
    try {
        const client = await getClient(phone);
        await client.connect();
        const isAuth = await client.isUserAuthorized();
        await client.disconnect();
        if (!isAuth) {
            await clearSession(phone);
        }
        return isAuth;
    } catch (e) {
        return false;
    }
}

async function fetchUserInfo(phone) {
    const client = await getClient(phone);
    await client.connect();

    try {
        const isAuth = await client.isUserAuthorized();
        if (!isAuth) {
            await clearSession(phone);
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
            await clearSession(phone);
            throw new Error("Session expired or unauthorized. Please log in again.");
        }
        throw e;
    } finally {
        await client.disconnect();
    }
}

async function logout(phone) {
    try {
        const client = await getClient(phone);
        await client.connect();
        if (await client.isUserAuthorized()) {
            await client.invoke(new Api.auth.LogOut());
        }
        await client.disconnect();
    } catch (e) {
        console.warn("Logout warning:", e.message);
    } finally {
        await clearSession(phone);
    }
}

async function fetchDialogs(phone) {
    const client = await getClient(phone);
    await client.connect();
    
    try {
        const isAuth = await client.isUserAuthorized();
        if (!isAuth) {
            await clearSession(phone);
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
            await clearSession(phone);
            throw new Error("Session expired or unauthorized. Please log in again.");
        }
        throw e;
    } finally {
        await client.disconnect();
    }
}

async function fetchMessages(phone, chatId, limit = 50) {
    const client = await getClient(phone);
    await client.connect();
    
    try {
        const isAuth = await client.isUserAuthorized();
        if (!isAuth) {
            await clearSession(phone);
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
            await clearSession(phone);
            throw new Error("Session expired or unauthorized. Please log in again.");
        }
        throw e;
    } finally {
        await client.disconnect();
    }
}

async function sendMessage(phone, chatId, messageText) {
    const client = await getClient(phone);
    await client.connect();
    
    try {
        const isAuth = await client.isUserAuthorized();
        if (!isAuth) {
            await clearSession(phone);
            throw new Error("Session expired or unauthorized. Please log in again.");
        }
        await client.sendMessage(chatId, { message: messageText });
    } catch (e) {
        if (e.message && (e.message.includes("AUTH_KEY_UNREGISTERED") || e.message.includes("SESSION_REVOKED") || e.message.includes("SESSION_EXPIRED"))) {
            await clearSession(phone);
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
