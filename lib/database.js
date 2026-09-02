const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    sessionData: { type: Object, required: true },
    updatedAt: { type: Date, default: Date.now }
});

const Session = mongoose.model('Session', sessionSchema);

async function connectDB() {
    if (!process.env.MONGODB_URI) {
        console.log('[MongoDB] MONGODB_URI environment variable is missing.');
        return;
    }
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('[MongoDB] Connected successfully! ✅');
    } catch (err) {
        console.error('[MongoDB] Connection error:', err.message);
    }
}

async function saveSessionToMongoDB(userId, sessionData) {
    if (!process.env.MONGODB_URI) return;
    try {
        await Session.findOneAndUpdate(
            { userId },
            { sessionData, updatedAt: Date.now() },
            { upsert: true, new: true }
        );
    } catch (err) {
        console.error('[MongoDB] Save error:', err.message);
    }
}

async function getSessionFromMongoDB(userId) {
    if (!process.env.MONGODB_URI) return null;
    try {
        const doc = await Session.findOne({ userId });
        return doc ? doc.sessionData : null;
    } catch (err) {
        console.error('[MongoDB] Fetch error:', err.message);
        return null;
    }
}

async function deleteSessionFromMongoDB(userId) {
    if (!process.env.MONGODB_URI) return;
    try {
        await Session.deleteOne({ userId });
        console.log(`[MongoDB] Deleted session for: ${userId}`);
    } catch (err) {
        console.error('[MongoDB] Delete error:', err.message);
    }
}

module.exports = {
    connectDB,
    saveSessionToMongoDB,
    getSessionFromMongoDB,
    deleteSessionFromMongoDB
};
