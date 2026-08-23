const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let db = null;

// Mock user for local development if Firebase is not configured yet
const mockUser = (phone) => ({
    phone,
    subscription_tier: 'FREE',
    usage_count: 5,
    last_reset: new Date().toISOString().split('T')[0],
    first_name: "Local",
    username: "No Firebase Configured"
});

async function initDb() {
    try {
        const keyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
        if (!fs.existsSync(keyPath)) {
            console.warn("\n========================================================");
            console.warn("⚠️ FIREBASE WARNING: serviceAccountKey.json NOT FOUND!");
            console.warn("Database is running in Mock Mode. Progress will not save.");
            console.warn("Please add your Firebase JSON file to the back_end folder!");
            console.warn("========================================================\n");
            return;
        }

        const serviceAccount = require(keyPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        
        db = admin.firestore();
        console.log("🔥 Firebase Firestore initialized successfully");
    } catch (e) {
        console.error("Firebase init failed:", e);
    }
}

async function getUser(phone) {
    if (!db) return mockUser(phone);

    const userRef = db.collection('users').doc(phone);
    const doc = await userRef.get();
    
    if (!doc.exists) {
        const today = new Date().toISOString().split('T')[0];
        const newUser = {
            phone,
            subscription_tier: 'FREE',
            usage_count: 5,
            last_reset: today,
            created_at: admin.firestore.FieldValue.serverTimestamp()
        };
        await userRef.set(newUser);
        return newUser;
    } else {
        let user = doc.data();
        const today = new Date().toISOString().split('T')[0];
        if (user.last_reset !== today) {
            await userRef.update({ usage_count: 5, last_reset: today });
            user.usage_count = 5;
            user.last_reset = today;
        }
        return user;
    }
}

// Update user with custom registration data
async function updateUserRegistration(phone, { email, username }) {
    if (!db) return;
    
    const userRef = db.collection('users').doc(phone);
    await userRef.set({ email, username }, { merge: true });
}

async function useLimit(phone) {
    const user = await getUser(phone);
    if (user.subscription_tier === 'FREE' && user.usage_count <= 0) {
        throw new Error("Daily summarization limit reached. Please upgrade to Pro.");
    }
    
    if (!db) return true;

    if (user.subscription_tier === 'FREE') {
        const userRef = db.collection('users').doc(phone);
        await userRef.update({
            usage_count: admin.firestore.FieldValue.increment(-1)
        });
    }
    return true;
}

async function saveSummary(phone, chatName, originalLength, summaryText) {
    if (!db) return;

    await db.collection('summaries').add({
        phone,
        chat_name: chatName,
        original_length: originalLength,
        summary_text: summaryText,
        created_at: admin.firestore.FieldValue.serverTimestamp()
    });
}

async function getSummaries(phone) {
    if (!db) return [];

    const snapshot = await db.collection('summaries')
        .where('phone', '==', phone)
        .orderBy('created_at', 'desc')
        .get();
        
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamp to ISO string for frontend
        created_at: doc.data().created_at ? doc.data().created_at.toDate().toISOString() : new Date().toISOString()
    }));
}

async function getAnalytics(phone) {
    if (!db) return { totalSummaries: 0, topChats: [] };

    const snapshot = await db.collection('summaries')
        .where('phone', '==', phone)
        .get();

    let total = snapshot.size;
    let chatCounts = {};

    snapshot.forEach(doc => {
        const name = doc.data().chat_name;
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
}

module.exports = {
    initDb,
    getUser,
    updateUserRegistration,
    useLimit,
    saveSummary,
    getSummaries,
    getAnalytics
};
