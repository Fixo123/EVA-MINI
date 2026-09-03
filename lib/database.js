// database.js - MongoDB Connection & Session Management
const mongoose = require('mongoose');

// MongoDB Connection String
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/evabot';

// ============================================
// SESSION SCHEMA
// ============================================
const sessionSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        unique: true, 
        required: true,
        index: true 
    },
    creds: { 
        type: Object, 
        required: true 
    },
    keys: { 
        type: Object, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Auto-update updatedAt on save
sessionSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Session = mongoose.model('Session', sessionSchema);

// ============================================
// CONNECT TO MONGODB
// ============================================
async function connectDB() {
    try {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            console.log('✅ MongoDB connected successfully');
        } else {
            console.log('✅ MongoDB already connected');
        }
        return true;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        return false;
    }
}

// ============================================
// SAVE SESSION
// ============================================
async function saveSession(userId, state) {
    try {
        if (!userId || !state) {
            console.error('❌ Invalid session data');
            return false;
        }

        // Ensure connection
        await connectDB();

        const result = await Session.findOneAndUpdate(
            { userId: userId },
            { 
                userId: userId,
                creds: state.creds,
                keys: state.keys,
                updatedAt: new Date()
            },
            { 
                upsert: true, 
                new: true,
                setDefaultsOnInsert: true
            }
        );
        
        console.log(`✅ Session saved for ${userId}`);
        return true;
    } catch (error) {
        console.error('❌ Error saving session:', error.message);
        return false;
    }
}

// ============================================
// LOAD SESSION
// ============================================
async function loadSession(userId) {
    try {
        if (!userId) {
            console.error('❌ Invalid userId for loading');
            return null;
        }

        // Ensure connection
        await connectDB();

        const session = await Session.findOne({ userId: userId });
        
        if (session) {
            console.log(`✅ Session loaded for ${userId} (Last updated: ${session.updatedAt})`);
            return {
                creds: session.creds,
                keys: session.keys
            };
        }
        
        console.log(`ℹ️ No session found for ${userId}`);
        return null;
    } catch (error) {
        console.error('❌ Error loading session:', error.message);
        return null;
    }
}

// ============================================
// DELETE SESSION
// ============================================
async function deleteSession(userId) {
    try {
        if (!userId) return false;
        
        await connectDB();
        const result = await Session.deleteOne({ userId: userId });
        
        if (result.deletedCount > 0) {
            console.log(`🗑️ Session deleted for ${userId}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ Error deleting session:', error.message);
        return false;
    }
}

// ============================================
// GET ALL SESSIONS
// ============================================
async function getAllSessions() {
    try {
        await connectDB();
        const sessions = await Session.find({}, 'userId updatedAt');
        return sessions;
    } catch (error) {
        console.error('❌ Error getting sessions:', error.message);
        return [];
    }
}

// ============================================
// CLEANUP OLD SESSIONS (Optional)
// ============================================
async function cleanupOldSessions(days = 30) {
    try {
        await connectDB();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const result = await Session.deleteMany({ 
            updatedAt: { $lt: cutoffDate } 
        });
        
        console.log(`🧹 Cleaned up ${result.deletedCount} old sessions`);
        return result.deletedCount;
    } catch (error) {
        console.error('❌ Error cleaning sessions:', error.message);
        return 0;
    }
}

module.exports = {
    connectDB,
    saveSession,
    loadSession,
    deleteSession,
    getAllSessions,
    cleanupOldSessions,
    Session
};
