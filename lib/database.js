const mongoose = require('mongoose');

// Session Schema එක නිර්මාණය කිරීම
const sessionSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    sessionData: { 
        type: Object, 
        required: true 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

const Session = mongoose.model('Session', sessionSchema);

// MongoDB Database එක Connect කිරීම
async function connectDB() {
    try {
        const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!mongoURI) {
            console.log('[MongoDB] Warning: MONGO_URI is not defined in environment variables.');
            return;
        }
        await mongoose.connect(mongoURI);
        console.log('[MongoDB] Connected Successfully! ✅');
    } catch (error) {
        console.error('[MongoDB] Connection Error ❌:', error.message);
    }
}

// Session එක MongoDB එකට Save කිරීම
async function saveSessionToMongoDB(userId, sessionData) {
    try {
        if (mongoose.connection.readyState !== 1) return;
        await Session.findOneAndUpdate(
            { userId },
            { sessionData, updatedAt: Date.now() },
            { upsert: true, new: true }
        );
        console.log(`[MongoDB] Session saved for user: ${userId}`);
    } catch (error) {
        console.error(`[MongoDB] Error saving session for ${userId}:`, error.message);
    }
}

// MongoDB එකෙන් Session එක ලබා ගැනීම
async function getSessionFromMongoDB(userId) {
    try {
        if (mongoose.connection.readyState !== 1) return null;
        const session = await Session.findOne({ userId });
        if (session && session.sessionData) {
            return session.sessionData;
        }
        return null;
    } catch (error) {
        console.error(`[MongoDB] Error fetching session for ${userId}:`, error.message);
        return null;
    }
}

// MongoDB එකෙන් Session එක Delete කිරීම
async function deleteSessionFromMongoDB(userId) {
    try {
        if (mongoose.connection.readyState !== 1) return;
        await Session.deleteOne({ userId });
        console.log(`[MongoDB] Session deleted for user: ${userId}`);
    } catch (error) {
        console.error(`[MongoDB] Error deleting session for ${userId}:`, error.message);
    }
}

module.exports = {
    connectDB,
    saveSessionToMongoDB,
    getSessionFromMongoDB,
    deleteSessionFromMongoDB
};
const mongoose = require('mongoose');

// Session Schema එක නිර්මාණය කිරීම
const sessionSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    sessionData: { 
        type: Object, 
        required: true 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

const Session = mongoose.model('Session', sessionSchema);

// MongoDB Database එක Connect කිරීම
async function connectDB() {
    try {
        const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!mongoURI) {
            console.log('[MongoDB] Warning: MONGO_URI is not defined in environment variables.');
            return;
        }
        await mongoose.connect(mongoURI);
        console.log('[MongoDB] Connected Successfully! ✅');
    } catch (error) {
        console.error('[MongoDB] Connection Error ❌:', error.message);
    }
}

// Session එක MongoDB එකට Save කිරීම
async function saveSessionToMongoDB(userId, sessionData) {
    try {
        if (mongoose.connection.readyState !== 1) return;
        await Session.findOneAndUpdate(
            { userId },
            { sessionData, updatedAt: Date.now() },
            { upsert: true, new: true }
        );
        console.log(`[MongoDB] Session saved for user: ${userId}`);
    } catch (error) {
        console.error(`[MongoDB] Error saving session for ${userId}:`, error.message);
    }
}

// MongoDB එකෙන් Session එක ලබා ගැනීම
async function getSessionFromMongoDB(userId) {
    try {
        if (mongoose.connection.readyState !== 1) return null;
        const session = await Session.findOne({ userId });
        if (session && session.sessionData) {
            return session.sessionData;
        }
        return null;
    } catch (error) {
        console.error(`[MongoDB] Error fetching session for ${userId}:`, error.message);
        return null;
    }
}

// MongoDB එකෙන් Session එක Delete කිරීම
async function deleteSessionFromMongoDB(userId) {
    try {
        if (mongoose.connection.readyState !== 1) return;
        await Session.deleteOne({ userId });
        console.log(`[MongoDB] Session deleted for user: ${userId}`);
    } catch (error) {
        console.error(`[MongoDB] Error deleting session for ${userId}:`, error.message);
    }
}

module.exports = {
    connectDB,
    saveSessionToMongoDB,
    getSessionFromMongoDB,
    deleteSessionFromMongoDB
};
