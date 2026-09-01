// database.js - MongoDB Connection & Session Management
const mongoose = require('mongoose');

// MongoDB Connection String - .env එකෙන් ගන්නවා
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://nima:nima@nimabot.gkpbhvh.mongodb.net';

// Session Schema - මෙය session data save කරන හැටි හදනවා
const sessionSchema = new mongoose.Schema({
    userId: { type: String, unique: true, required: true },
    creds: { type: Object, required: true },
    keys: { type: Object, required: true },
    updatedAt: { type: Date, default: Date.now }
});

const Session = mongoose.model('Session', sessionSchema);

// MongoDB connect කරන function එක
async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

// Session save කරන function එක
async function saveSession(userId, state) {
    try {
        await Session.findOneAndUpdate(
            { userId: userId },
            { 
                userId: userId,
                creds: state.creds,
                keys: state.keys,
                updatedAt: new Date()
            },
            { upsert: true }
        );
        console.log(`✅ Session saved for ${userId}`);
    } catch (error) {
        console.error('❌ Error saving session:', error);
    }
}

// Session load කරන function එක
async function loadSession(userId) {
    try {
        const session = await Session.findOne({ userId: userId });
        if (session) {
            return {
                creds: session.creds,
                keys: session.keys
            };
        }
        return null;
    } catch (error) {
        console.error('❌ Error loading session:', error);
        return null;
    }
}

// Session delete කරන function එක
async function deleteSession(userId) {
    try {
        await Session.deleteOne({ userId: userId });
        console.log(`🗑️ Session deleted for ${userId}`);
    } catch (error) {
        console.error('❌ Error deleting session:', error);
    }
}

module.exports = {
    connectDB,
    saveSession,
    loadSession,
    deleteSession
};
