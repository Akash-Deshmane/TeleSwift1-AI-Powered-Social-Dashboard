const mongoose = require('mongoose');

let isConnected = false;

// In-memory fallback store if MongoDB URI is not configured in cloud environment
const memorySessions = new Map();
const memoryPendingAuth = new Map();
const memoryUsers = new Map();
const memorySummaries = [];

// User Schema
const userSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true, index: true },
    email: { type: String, default: '' },
    username: { type: String, default: '' },
    telegram_session: { type: String, default: '' },
    pending_auth_session: { type: String, default: '' },
    pending_phone_code_hash: { type: String, default: '' },
    subscription_tier: { type: String, default: 'FREE' },
    usage_count: { type: Number, default: 5 },
    last_reset: { type: String },
    created_at: { type: Date, default: Date.now }
});

// Summary Schema
const summarySchema = new mongoose.Schema({
    phone: { type: String, required: true, index: true },
    chat_name: { type: String, required: true },
    original_length: { type: Number, default: 0 },
    summary_text: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Summary = mongoose.models.Summary || mongoose.model('Summary', summarySchema);

const mockUser = (phone) => {
    if (!memoryUsers.has(phone)) {
        memoryUsers.set(phone, {
            phone,
            subscription_tier: 'FREE',
            usage_count: 5,
            last_reset: new Date().toISOString().split('T')[0],
            first_name: "TeleSwift",
            username: "Cloud User"
        });
    }
    return memoryUsers.get(phone);
};

async function initDb() {
    if (isConnected && mongoose.connection.readyState === 1) {
        return;
    }

    // In Vercel cloud without MONGODB_URI, skip trying localhost:27017 so requests never stall 5s
    if (process.env.VERCEL && !process.env.MONGODB_URI) {
        isConnected = false;
        return;
    }

    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/teleswift';
    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 4000
        });
        isConnected = true;
        console.log(`🍃 MongoDB connected successfully (${mongoUri.includes('@') ? 'Atlas' : mongoUri})`);
    } catch (e) {
        isConnected = false;
        console.warn("\n========================================================");
        console.warn("⚠️ MONGODB WARNING: Could not connect to MongoDB!");
        console.warn(`Reason: ${e.message}`);
        console.warn("Running in in-memory fallback mode.");
        console.warn("========================================================\n");
    }
}

async function getUser(phone) {
    if (!isConnected) return mockUser(phone);

    try {
        let user = await User.findOne({ phone });
        const today = new Date().toISOString().split('T')[0];

        if (!user) {
            user = await User.create({
                phone,
                subscription_tier: 'FREE',
                usage_count: 5,
                last_reset: today,
                created_at: new Date()
            });
            return user.toObject();
        } else {
            if (user.last_reset !== today) {
                user.usage_count = 5;
                user.last_reset = today;
                await user.save();
            }
            return user.toObject();
        }
    } catch (error) {
        console.error("Error in getUser:", error.message);
        return mockUser(phone);
    }
}

// Update user with custom registration data
async function updateUserRegistration(phone, { email, username }) {
    if (!isConnected) {
        const u = mockUser(phone);
        u.email = email;
        u.username = username;
        return;
    }

    try {
        await User.findOneAndUpdate(
            { phone },
            { $set: { email, username } },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error("Error in updateUserRegistration:", error.message);
    }
}

async function getUserSession(phone) {
    if (!isConnected) return memorySessions.get(phone) || '';
    try {
        const user = await User.findOne({ phone }).lean();
        return user?.telegram_session || memorySessions.get(phone) || '';
    } catch (error) {
        console.error("Error in getUserSession:", error.message);
        return memorySessions.get(phone) || '';
    }
}

async function saveUserSession(phone, sessionString) {
    memorySessions.set(phone, sessionString);
    if (!isConnected) return;
    try {
        await User.findOneAndUpdate(
            { phone },
            { $set: { telegram_session: sessionString } },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error("Error in saveUserSession:", error.message);
    }
}

async function clearUserSession(phone) {
    memorySessions.delete(phone);
    if (!isConnected) return;
    try {
        await User.findOneAndUpdate(
            { phone },
            { $set: { telegram_session: '' } }
        );
    } catch (error) {
        console.error("Error in clearUserSession:", error.message);
    }
}

async function savePendingAuth(phone, pendingSession, phoneCodeHash) {
    memoryPendingAuth.set(phone, { pendingSession, phoneCodeHash });
    if (!isConnected) return;
    try {
        await User.findOneAndUpdate(
            { phone },
            { $set: { pending_auth_session: pendingSession, pending_phone_code_hash: phoneCodeHash } },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error("Error in savePendingAuth:", error.message);
    }
}

async function getPendingAuth(phone) {
    if (!isConnected) return memoryPendingAuth.get(phone) || null;
    try {
        const user = await User.findOne({ phone }).lean();
        if (user?.pending_auth_session && user?.pending_phone_code_hash) {
            return {
                pendingSession: user.pending_auth_session,
                phoneCodeHash: user.pending_phone_code_hash
            };
        }
        return memoryPendingAuth.get(phone) || null;
    } catch (error) {
        console.error("Error in getPendingAuth:", error.message);
        return memoryPendingAuth.get(phone) || null;
    }
}

async function clearPendingAuth(phone) {
    memoryPendingAuth.delete(phone);
    if (!isConnected) return;
    try {
        await User.findOneAndUpdate(
            { phone },
            { $set: { pending_auth_session: '', pending_phone_code_hash: '' } }
        );
    } catch (error) {
        console.error("Error in clearPendingAuth:", error.message);
    }
}

async function useLimit(phone) {
    const user = await getUser(phone);
    if (user.subscription_tier === 'FREE' && user.usage_count <= 0) {
        throw new Error("Daily summarization limit reached. Please upgrade to Pro.");
    }

    if (!isConnected) {
        if (user.subscription_tier === 'FREE') {
            user.usage_count = Math.max(0, user.usage_count - 1);
        }
        return true;
    }

    try {
        if (user.subscription_tier === 'FREE') {
            await User.updateOne({ phone }, { $inc: { usage_count: -1 } });
        }
    } catch (error) {
        console.error("Error in useLimit:", error.message);
    }
    return true;
}

async function saveSummary(phone, chatName, originalLength, summaryText) {
    if (!isConnected) {
        memorySummaries.unshift({
            id: String(Date.now()),
            phone,
            chat_name: chatName,
            original_length: originalLength,
            summary_text: summaryText,
            created_at: new Date().toISOString()
        });
        return;
    }

    try {
        await Summary.create({
            phone,
            chat_name: chatName,
            original_length: originalLength,
            summary_text: summaryText,
            created_at: new Date()
        });
    } catch (error) {
        console.error("Error in saveSummary:", error.message);
    }
}

async function getSummaries(phone) {
    if (!isConnected) {
        return memorySummaries.filter(s => s.phone === phone);
    }

    try {
        const summaries = await Summary.find({ phone })
            .sort({ created_at: -1 })
            .lean();

        return summaries.map(doc => ({
            id: doc._id.toString(),
            phone: doc.phone,
            chat_name: doc.chat_name,
            original_length: doc.original_length,
            summary_text: doc.summary_text,
            created_at: doc.created_at ? new Date(doc.created_at).toISOString() : new Date().toISOString()
        }));
    } catch (error) {
        console.error("Error in getSummaries:", error.message);
        return [];
    }
}

async function getAnalytics(phone) {
    if (!isConnected) {
        const userSummaries = memorySummaries.filter(s => s.phone === phone);
        const chatCounts = {};
        userSummaries.forEach(doc => {
            chatCounts[doc.chat_name] = (chatCounts[doc.chat_name] || 0) + 1;
        });
        const topChats = Object.entries(chatCounts)
            .map(([name, count]) => ({ chat_name: name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        return { totalSummaries: userSummaries.length, topChats };
    }

    try {
        const summaries = await Summary.find({ phone }).lean();
        const total = summaries.length;
        const chatCounts = {};

        summaries.forEach(doc => {
            const name = doc.chat_name;
            chatCounts[name] = (chatCounts[name] || 0) + 1;
        });

        const topChats = Object.entries(chatCounts)
            .map(([name, count]) => ({ chat_name: name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            totalSummaries: total,
            topChats
        };
    } catch (error) {
        console.error("Error in getAnalytics:", error.message);
        return { totalSummaries: 0, topChats: [] };
    }
}

module.exports = {
    initDb,
    getUser,
    updateUserRegistration,
    getUserSession,
    saveUserSession,
    clearUserSession,
    savePendingAuth,
    getPendingAuth,
    clearPendingAuth,
    useLimit,
    saveSummary,
    getSummaries,
    getAnalytics,
    User,
    Summary
};
