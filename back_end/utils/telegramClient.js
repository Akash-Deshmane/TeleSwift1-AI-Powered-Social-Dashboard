const { TelegramClient, Api } = require("telegram");
const { StoreSession } = require("telegram/sessions");
const path = require("path");
const fs = require("fs");

const getSessionPath = () => {
    return 'sessions';
};

// Store in-memory instances and phoneCodeHash needed for sign in
const authSessions = new Map();

async function startAuth(phone) {
    const apiId = parseInt(process.env.APP_API_ID);
    const apiHash = process.env.APP_API_HASH;
    
    if (isNaN(apiId) || !apiHash) {
        throw new Error("API ID and Hash not configured");
    }
    const sessionDir = getSessionPath();
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    const storeSession = new StoreSession(path.join(sessionDir, phone));
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
        throw new Error("No auth session found for this phone");
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

    const sessionDir = path.join(getSessionPath(), phone);
    if (!fs.existsSync(sessionDir)) {
        return false;
    }

    const storeSession = new StoreSession(sessionDir);
    const client = new TelegramClient(storeSession, apiId, apiHash, { connectionRetries: 1 });
    
    try {
        await client.connect();
        const isAuth = await client.isUserAuthorized();
        await client.disconnect();
        return isAuth;
    } catch (e) {
        return false;
    }
}

async function fetchUserInfo(phone) {
    const apiId = parseInt(process.env.APP_API_ID);
    const apiHash = process.env.APP_API_HASH;

    const sessionDir = path.join(getSessionPath(), phone);
    if (!fs.existsSync(sessionDir)) {
        throw new Error("Session not found");
    }

    const storeSession = new StoreSession(sessionDir);
    const client = new TelegramClient(storeSession, apiId, apiHash, { connectionRetries: 3 });
    
    await client.connect();

    if (!(await client.isUserAuthorized())) {
        await client.disconnect();
        throw new Error("Session expired or unauthorized.");
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

    await client.disconnect();

    return {
        id: Number(me.id), // cast bigInt to Number
        username: me.username,
        phone: me.phone,
        first_name: me.firstName,
        last_name: me.lastName,
        photo: photoBase64,
    };
}

async function logout(phone) {
    const apiId = parseInt(process.env.APP_API_ID);
    const apiHash = process.env.APP_API_HASH;

    const sessionDir = path.join(getSessionPath(), phone);
    if (!fs.existsSync(sessionDir)) {
        throw new Error("Session not found");
    }

    const storeSession = new StoreSession(sessionDir);
    const client = new TelegramClient(storeSession, apiId, apiHash, { connectionRetries: 3 });
    
    await client.connect();

    if (!(await client.isUserAuthorized())) {
        await client.disconnect();
        throw new Error("User is not logged in");
    }

    await client.invoke(new Api.auth.LogOut());
    await client.disconnect();
    
    fs.rmSync(sessionDir, { recursive: true, force: true });
}

async function fetchDialogs(phone) {
    const apiId = parseInt(process.env.APP_API_ID);
    const apiHash = process.env.APP_API_HASH;
    const sessionDir = path.join(getSessionPath(), phone);
    if (!fs.existsSync(sessionDir)) throw new Error("Session not found");
    
    const storeSession = new StoreSession(sessionDir);
    const client = new TelegramClient(storeSession, apiId, apiHash, { connectionRetries: 3 });
    await client.connect();
    
    const dialogs = await client.getDialogs({ limit: 15 });
    await client.disconnect();
    
    return dialogs.map(d => ({
        id: d.id.toString(),
        name: d.title,
        isGroup: d.isGroup,
        isChannel: d.isChannel,
        unreadCount: d.unreadCount,
        message: d.message?.message || ''
    }));
}

async function fetchMessages(phone, chatId, limit = 50) {
    const apiId = parseInt(process.env.APP_API_ID);
    const apiHash = process.env.APP_API_HASH;
    const sessionDir = path.join(getSessionPath(), phone);
    if (!fs.existsSync(sessionDir)) throw new Error("Session not found");
    
    const storeSession = new StoreSession(sessionDir);
    const client = new TelegramClient(storeSession, apiId, apiHash, { connectionRetries: 3 });
    await client.connect();
    
    const messages = await client.getMessages(chatId, { limit });
    await client.disconnect();
    
    return messages.map(m => ({
        id: m.id,
        text: m.message,
        senderId: m.senderId?.toString(),
        date: m.date
    })).filter(m => m.text); // only text messages
}

async function sendMessage(phone, chatId, messageText) {
    const apiId = parseInt(process.env.APP_API_ID);
    const apiHash = process.env.APP_API_HASH;
    const sessionDir = path.join(getSessionPath(), phone);
    if (!fs.existsSync(sessionDir)) throw new Error("Session not found");
    
    const storeSession = new StoreSession(sessionDir);
    const client = new TelegramClient(storeSession, apiId, apiHash, { connectionRetries: 3 });
    await client.connect();
    
    await client.sendMessage(chatId, { message: messageText });
    await client.disconnect();
}

module.exports = {
    startAuth,
    verifyCode,
    checkSession,
    fetchUserInfo,
    logout,
    fetchDialogs,
    fetchMessages,
    sendMessage
};
