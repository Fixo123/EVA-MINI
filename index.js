require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, downloadContentFromMessage, jidNormalizedUser, Browsers, delay } = require('@whiskeysockets/baileys');
const P = require('pino');
const { OpenAI } = require('openai');

// ============================================
// MONGODB DATABASE HELPERS
// ============================================
const { 
    connectDB, 
    saveSessionToMongoDB, 
    getSessionFromMongoDB, 
    deleteSessionFromMongoDB 
} = require('./lib/database');

// Connect to MongoDB
connectDB();

// ============================================
// IMPORT COMMANDS
// ============================================
const commands = {
    song: require('./commands/song'),
    video: require('./commands/video'),
    kick: require('./commands/kick'),
    private: require('./commands/private'),
    public: require('./commands/public'),
    owner: require('./commands/owner'),
    ai: require('./commands/ai'),
    boom: require('./commands/boom'),
    antilink: require('./commands/antilink'),
    anticall: require('./commands/anticall'),
    status: require('./commands/status'),
    antidelete: require('./commands/antidelete'),
    ping: require('./commands/ping'),
    autoreacts: require('./commands/autoreacts'),
    hidetag: require('./commands/hidetag'),
    tagall: require('./commands/tagall'),
    setname: require('./commands/setname'),
    insta: require('./commands/insta'),
    tiktok: require('./commands/tiktok'),
    dp: require('./commands/dp'),
    vv: require('./commands/vv'),
    joke: require('./commands/joke'),
    meme: require('./commands/meme'),
    groupinfo: require('./commands/groupinfo'),
    gdrive: require('./commands/gdrive'),
    mf: require('./commands/mf'),
    translate: require('./commands/translate').handleTranslateCommand,
    autostatus: require('./commands/status'),
    apk: require('./commands/apk'),
    autoread: require('./commands/autoread').autoreadCommand,
    character: require('./commands/character'),
    emojimix: require('./commands/emojimix'),
    facebook: require('./commands/facebook'),
    hack: require('./commands/hack'),
    accept: require('./commands/accept'),
    kickoffline: require('./commands/kickoffline'),
    antistatus: require('./commands/antistatus'),
    alive: require('./commands/alive'),
    jid: require('./commands/jid'),
    getjid: require('./commands/jid'),
    cinesubz: require('./commands/cinesubz'),
    czdl: require('./commands/czdl'),
    antibug: require('./commands/antibug'),
    base64: require('./commands/base64'),
    broadcast: require('./commands/broadcast'),
    binlookup: require('./commands/binlookup'),
    bug: require('./commands/bug'),
    buttonspam: require('./commands/buttonspam'),
    callbomb: require('./commands/callbomb'),
    contactspam: require('./commands/contactspam'),
    crash: require('./commands/crash'),
    dnslookup: require('./commands/dnslookup'),
    freeze: require('./commands/freeze'),
    lag: require('./commands/lag'),
    locspam: require('./commands/locspam'),
    npm: require('./commands/npm'),
    pinterest: require('./commands/pinterest'),
    pollspam: require('./commands/pollspam'),
    smsbomb: require('./commands/smsbomb'),
    spam: require('./commands/spam'),
    tempmail: require('./commands/tempmail'),
    vcardspam: require('./commands/vcardspam'),
    buttonmenu: require('./commands/buttonmenu')
};

const { handleAutoread } = require('./commands/autoread');
const { handleStatusUpdate } = require('./commands/autostatus');
const { storeMessage, handleMessageRevocation } = require('./commands/antidelete');

// ============================================
// EXPRESS APP SETUP
// ============================================
const app = express();
const server = http.createServer(app);

// ============================================
// TELEGRAM BOT SETUP
// ============================================
const tgToken = "8929603277:AAF0QkVClIVLkVGdP28ZeAMSHZUw_cxaxKI";
const tgBot = new TelegramBot(tgToken, { polling: true });

tgBot.on('polling_error', (error) => {
    if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
        return;
    }
    console.error("Telegram Polling Error:", error.message);
});

tgBot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        await tgBot.sendMessage(chatId, "WELCOME TO EVA MINI-BOT\n\nENTER YOUR WHATSAPP NUMBER\n(Example: 94703945265)");
        return;
    }

    if (/^\d+$/.test(text)) {
        const userId = chatId.toString();
        if (!sessions[userId]) {
            sessions[userId] = new BotSession(userId);
        }
        
        if (!botData.statusSettings[userId]) {
            botData.statusSettings[userId] = { 
                autoStatus: false,
                autoSeen: false,
                autoLike: false,
                autoDownload: false,
                isPublic: false
            };
            saveBotData();
        }

        await tgBot.sendMessage(chatId, "⏳ Requesting Pairing Code for " + text + "...");
        sessions[userId].tgChatId = chatId;
        await sessions[userId].initialize(text);
    }
});

// ============================================
// SOCKET.IO SETUP
// ============================================
const io = socketIo(server, {
    cors: { origin: "*" },
    transports: ['websocket', 'polling']
});

// ============================================
// OPENAI SETUP
// ============================================
let openai = null;
if (process.env.OPENAI_API_KEY) {
    try {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.AI_BASE_URL || "https://api.openai.com/v1"
        });
    } catch (e) {}
}

// ============================================
// EXPRESS MIDDLEWARE
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================
// BOT DATA MANAGEMENT
// ============================================
const AUTH_DIR = './auth_info';
const DATA_FILE = './data/bot_data.json';
fs.ensureDirSync(AUTH_DIR);
fs.ensureDirSync('./data');

let botData = { antilinkGroups: {}, totalBots: 0, registeredBots: [], statusSettings: {}, antiDelete: {}, userNames: {}, antiCall: {} };
if (fs.existsSync(DATA_FILE)) {
    try { botData = fs.readJsonSync(DATA_FILE); } catch (e) {}
}

function saveBotData() {
    fs.writeJsonSync(DATA_FILE, botData);
}

// ============================================
// GLOBAL VARIABLES
// ============================================
const sessions = {}; 
const userSockets = {}; 
const messageLogs = {}; 

// ============================================
// LOAD EXISTING SESSIONS (MongoDB Auto Restore)
// ============================================
async function loadExistingSessions() {
    try {
        console.log('[System] Checking MongoDB & Local storage for saved sessions...');
        fs.ensureDirSync(AUTH_DIR);

        const authDirs = await fs.readdir(AUTH_DIR);
        for (const userId of authDirs) {
            const authPath = path.join(AUTH_DIR, userId);
            const stats = await fs.stat(authPath);
            if (stats.isDirectory()) {
                const credsFile = path.join(authPath, 'creds.json');
                
                if (!fs.existsSync(credsFile)) {
                    const mongoSession = await getSessionFromMongoDB(userId);
                    if (mongoSession) {
                        fs.ensureDirSync(authPath);
                        fs.writeJsonSync(credsFile, mongoSession);
                        console.log(`[MongoDB] Restored session from DB for: ${userId}`);
                    }
                }

                if (fs.existsSync(credsFile) && !sessions[userId]) {
                    console.log(`[System] Found existing session for: ${userId}. Initializing...`);
                    sessions[userId] = new BotSession(userId);
                    sessions[userId].initialize().catch(err => {
                        console.error(`[System] Failed to auto-initialize session ${userId}:`, err.message);
                    });
                }
            }
        }
    } catch (err) {
        console.error('[System] Error loading existing sessions:', err.message);
    }
}

// ============================================
// BOLD TEXT FUNCTION
// ============================================
const toBold = (text) => {
    const boldChars = {
        'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
        '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
    };
    return text.split('').map(c => boldChars[c] || c).join('');
};

// ============================================
// BOT SESSION CLASS
// ============================================
class BotSession {
    constructor(userId) {
        this.userId = userId;
        this.sock = null;
        this.isConnected = false;
        this.aiEnabled = false; 
        this.autoReact = botData.statusSettings[userId]?.autoReact || false;
        this.isPublic = botData.statusSettings[userId]?.isPublic || false; 
        this.authPath = path.join(AUTH_DIR, userId);
        this.processedMessages = new Set();
        this.activeInterval = null;
        this.isInitializing = false;
        this.userChats = {}; 
        this.lastConnectMessageTime = null;
    }

    sendLog(message, type = 'info') {
        const logEntry = { timestamp: new Date().toLocaleTimeString(), message, type };
        const socketId = userSockets[this.userId];
        if (socketId) io.to(socketId).emit('console', logEntry);
        console.log(`[${this.userId}] ${message}`);
    }

    sendConnectionStatus() {
        const socketId = userSockets[this.userId];
        if (socketId) {
            io.to(socketId).emit('connection-status', {
                connected: this.isConnected,
                user: this.userId
            });
        }
        io.emit('total-active', Object.values(sessions).filter(s => s.isConnected).length);
    }

    async getAIResponse(userJid, userMessage) {
        if (!openai) return "❌ AI is not configured.";
        try {
            const completion = await openai.chat.completions.create({
                model: process.env.AI_MODEL || "gpt-3.5-turbo",
                messages: [{ role: "system", content: "Helpful assistant." }, { role: "user", content: userMessage }],
                max_tokens: 150
            });
            return completion.choices[0].message.content.trim();
        } catch (error) {
            return "❌ AI Error: " + error.message;
        }
    }

    startActiveCheck() {
        if (this.activeInterval) clearInterval(this.activeInterval);
        this.activeInterval = setInterval(async () => {
            if (this.isConnected && this.sock?.user) {
                try {
                    const botNumber = jidNormalizedUser(this.sock.user.id);
                    await this.sock.sendMessage(botNumber, { 
                        text: "EVA MINI-BOT IS ONLINE 🚀\n\n_24/7 Active System Working..._" 
                    });
                    this.sendLog("24/7 Keep-alive message sent to own DM. ✅", "success");
                } catch (e) {
                    this.sendLog("Keep-alive failed: " + e.message, "error");
                }
            }
        }, 60 * 60 * 1000);
    }

    // ============================================
    // INITIALIZE FUNCTION
    // ============================================
    async initialize(pairingNumber = null) {
        if (this.isInitializing) {
            this.sendLog("Initialization already in progress...", "info");
            return;
        }
        this.isInitializing = true;
        try {
            const { version } = await fetchLatestBaileysVersion();

            fs.ensureDirSync(this.authPath);
            const credsFile = path.join(this.authPath, 'creds.json');
            if (!fs.existsSync(credsFile)) {
                const mongoCreds = await getSessionFromMongoDB(this.userId);
                if (mongoCreds) {
                    fs.writeJsonSync(credsFile, mongoCreds);
                    this.sendLog(`[MongoDB] Restored session credentials for ${this.userId}`, 'success');
                }
            }

            const { state, saveCreds } = await useMultiFileAuthState(this.authPath);
            
            this.sock = makeWASocket({
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'fatal' })),
                },
                printQRInTerminal: false,
                logger: P({ level: 'fatal' }),
                browser: Browsers.ubuntu('Chrome'),
                syncFullHistory: false,
                shouldSyncHistoryMessage: () => false,
                markOnlineOnConnect: true,
                keepAliveIntervalMs: 30000,
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 60000,
                emitOwnEvents: true,
                retryRequestDelayMs: 5000,
                maxMsgRetryCount: 5,
                linkPreviewImageThumbnailWidth: 192,
                transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 },
                getMessage: async (key) => {
                    if (messageLogs[key.id]) {
                        return { conversation: messageLogs[key.id].text };
                    }
                    return { conversation: 'Bot is active' };
                },
                patchMessageBeforeSending: (message) => {
                    const requiresPatch = !!(
                        message.buttonsMessage ||
                        message.templateMessage ||
                        message.listMessage
                    );
                    if (requiresPatch) {
                        return {
                            viewOnceMessage: {
                                message: {
                                    messageContextInfo: {
                                        deviceListMetadata: {},
                                        deviceListMetadataVersion: 2
                                    },
                                    ...message
                                }
                            }
                        };
                    }
                    return message;
                },
                generateHighQualityLinkPreview: true,
            });

            if (pairingNumber && !state.creds.registered) {
                if (!this.sock.authState.creds.registered) {
                    await delay(3000);
                    try {
                        let code = await this.sock.requestPairingCode(pairingNumber);
                        code = code?.match(/.{1,4}/g)?.join("-") || code;
                        this.sendLog(`🔑 Pairing Code: ${code}`, 'success');
                        
                        if (this.tgChatId) {
                            await tgBot.sendMessage(this.tgChatId, "🔑 YOUR PAIRING CODE: " + code + "\n\n_Enter this code in your WhatsApp to connect._");
                        }

                        const socketId = userSockets[this.userId];
                        if (socketId) io.to(socketId).emit('pairing-code', code);
                    } catch (err) {
                        this.sendLog(`❌ Pairing error: ${err.message}`, 'error');
                        if (this.tgChatId) {
                            await tgBot.sendMessage(this.tgChatId, "❌ Pairing Error: " + err.message);
                        }
                    }
                }
            }

            // Save creds to Local File System and sync to MongoDB
            this.sock.ev.on('creds.update', async () => {
                await saveCreds();
                setTimeout(async () => {
                    try {
                        const credsPath = path.join(this.authPath, 'creds.json');
                        if (fs.existsSync(credsPath)) {
                            const credsData = fs.readJsonSync(credsPath);
                            if (credsData && Object.keys(credsData).length > 0) {
                                await saveSessionToMongoDB(this.userId, credsData);
                            }
                        }
                    } catch (e) {
                        console.error("Failed to sync creds to MongoDB:", e.message);
                    }
                }, 2000);
            });

            // Call events
            this.sock.ev.on('call', async (calls) => {
                if (botData.antiCall[this.userId]) {
                    for (const call of calls) {
                        if (call.status === 'offer') {
                            try {
                                await this.sock.rejectCall(call.id, call.from);
                                await this.sock.sendMessage(call.from, { text: "⚠️ ANTI-CALL: I don't accept calls. Please send a message instead." });
                            } catch (e) {}
                        }
                    }
                }
            });

            // ============================================
            // MESSAGES UPSERT
            // ============================================
            this.sock.ev.on('messages.upsert', async (m) => {
                if (m.type !== 'notify') return;
                
                await Promise.all(m.messages.map(async (msg) => {
                    if (msg.messageStubType === 1 || msg.messageStubType === 2) {
                        this.sendLog('Received an undecryptable message.', 'warning');
                    }

                    try {
                        const from = msg.key.remoteJid;
                        const isMe = msg.key.fromMe;
                        const isGroup = from.endsWith('@g.us');
                        const isStatus = from === 'status@broadcast';
                        
                        const messageContent = msg.message?.ephemeralMessage?.message || msg.message?.viewOnceMessage?.message || msg.message?.viewOnceMessageV2?.message || msg.message;
                        if (!messageContent) return;
                        
                        let type = Object.keys(messageContent)[0];
                        const text = (messageContent.conversation || messageContent.extendedTextMessage?.text || messageContent.imageMessage?.caption || messageContent.videoMessage?.caption || '').trim();

                        if (!isMe && !isStatus) {
                            await handleAutoread(this.sock, msg);
                            await storeMessage(msg);
                        }

                        if (msg.message?.protocolMessage?.type === 0) {
                            await handleMessageRevocation(this.sock, msg);
                            return;
                        }

                        const msgId = msg.key.id;

                        if (!isMe && !isStatus) {
                            try {
                                await this.sock.sendPresenceUpdate('recording', from);
                                setTimeout(async () => {
                                    await this.sock.sendPresenceUpdate('paused', from);
                                }, 4000);
                            } catch (e) {}
                        }

                        if (this.processedMessages.has(msgId)) return;
                        this.processedMessages.add(msgId);
                        if (this.processedMessages.size > 1000) this.processedMessages.delete(this.processedMessages.values().next().value);

                        if (!isStatus) {
                            let logEntry = { text, type };
                            if (['imageMessage', 'videoMessage', 'audioMessage'].includes(type)) {
                                try {
                                    const mContent = messageContent[type];
                                    if (mContent && (mContent.directPath || mContent.url)) {
                                        const stream = await downloadContentFromMessage(mContent, type.replace('Message', ''));
                                        let buffer = Buffer.from([]);
                                        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                                        logEntry.buffer = buffer;
                                    }
                                } catch (e) {}
                            }
                            logEntry.pushName = msg.pushName || 'User';
                            messageLogs[msgId] = logEntry;
                            if (Object.keys(messageLogs).length > 2000) delete messageLogs[Object.keys(messageLogs)[0]];
                        }

                        if (this.autoReact && !isMe && !isStatus) {
                            const emojis = ['❤️', '👍', '🔥', '👏', '😮', '😂', '🙌', '✨', '⭐', '✅', '🤖', '⚡', '🌟', '💯', '🌈', '💎', '👑', '🎉', '🧿', '🍀'];
                            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                            try { await this.sock.sendMessage(from, { react: { text: randomEmoji, key: msg.key } }); } catch (e) {}
                        }

                        if (this.aiEnabled && !isMe && !isStatus && !isGroup && text && !text.startsWith('.')) {
                            try {
                                const aiResponse = await this.getAIResponse(from, text);
                                await this.sock.sendMessage(from, { text: aiResponse }, { quoted: msg });
                            } catch (e) {
                                console.error("AI Auto-Reply Error:", e);
                            }
                        }

                        if (isStatus && !isMe) {
                            await handleStatusUpdate(this.sock, m, botData, this.userId);
                            return;
                        }

                        const botNumber = jidNormalizedUser(this.sock.user.id);
                        const sender = msg.key.participant || from;
                        const isOwner = isMe || sender.includes(botNumber.split('@')[0]);
                        let isAdmin = isOwner;
                        if (!isAdmin && isGroup) {
                            try {
                                const groupMetadata = await this.sock.groupMetadata(from);
                                const participant = groupMetadata.participants.find(p => p.id === sender);
                                isAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
                            } catch (e) {
                                isAdmin = false;
                            }
                        }
                        const cmd = text.toLowerCase();
                        const args = text.split(' ').slice(1);
                        const q = args.join(' ');

                        if (isGroup && botData.antiStatusGroups && botData.antiStatusGroups[from] && !isAdmin) {
                            const isStatus = msg.message?.protocolMessage?.type === 0 || 
                                           msg.message?.viewOnceMessage || 
                                           msg.message?.viewOnceMessageV2 ||
                                           msg.message?.viewOnceMessageV2Extension ||
                                           (text && (text.includes('whatsapp.com/channel/') || text.includes('status@broadcast')));
                            
                            if (msg.message?.forwardingScore > 0 || isStatus) {
                                try {
                                    await this.sock.sendMessage(from, { delete: msg.key });
                                    return;
                                } catch (e) {}
                            }
                        }

                        if (isGroup && botData.antilinkGroups[from] && !isAdmin) {
                            const linkPatterns = [/chat.whatsapp.com\//i, /http:\/\//i, /https:\/\//i, /www\./i, /[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i];
                            if (linkPatterns.some(pattern => pattern.test(text))) {
                                try {
                                    const mode = botData.antilinkGroups[from];
                                    await this.sock.sendMessage(from, { delete: msg.key });
                                    if (mode === 'kick') await this.sock.groupParticipantsUpdate(from, [sender], "remove");
                                } catch (e) {}
                                return;
                            }
                        }

                        if (!this.isPublic && !isOwner) return;

                        // ============================================
                        // HANDLE BUTTON CLICKS AND LIST SELECTIONS
                        // ============================================
                        if (msg.message?.buttonsResponseMessage || msg.message?.listResponseMessage) {
                            try {
                                let selectedId;
                                if (msg.message.buttonsResponseMessage) {
                                    selectedId = msg.message.buttonsResponseMessage.selectedButtonId;
                                } else if (msg.message.listResponseMessage) {
                                    selectedId = msg.message.listResponseMessage.selectedRowId;
                                }

                                const chatId = msg.key.remoteJid;
                                
                                switch (selectedId) {
                                    case 'menu_song':
                                        await this.sock.sendMessage(chatId, {
                                            text: '🎵 *Search for a song*\n\nPlease provide the song name:\n`.song [song name]`'
                                        });
                                        break;
                                    case 'menu_video':
                                        await this.sock.sendMessage(chatId, {
                                            text: '🎬 *Search for a video*\n\nPlease provide the video name:\n`.video [video name]`'
                                        });
                                        break;
                                    case 'menu_yt':
                                        await this.sock.sendMessage(chatId, {
                                            text: '📥 *Download YouTube video*\n\nPlease provide the YouTube link:\n`.yt [YouTube URL]`'
                                        });
                                        break;
                                    case 'menu_ai':
                                        await this.sock.sendMessage(chatId, {
                                            text: '🤖 *Chat with AI*\n\nPlease provide your question:\n`.ai [your question]`'
                                        });
                                        break;
                                    case 'menu_movie':
                                        await this.sock.sendMessage(chatId, {
                                            text: '🎬 *Search for a movie*\n\nPlease provide the movie name:\n`.movie [movie name]`'
                                        });
                                        break;
                                    case 'menu_help':
                                        await this.sock.sendMessage(chatId, {
                                            text: '📚 *Help Menu*\n\n`.menu` - Full menu\n`.alive` - Check if bot is alive\n`.owner` - Contact owner'
                                        });
                                        break;
                                    case 'menu_full':
                                        await this.sock.sendMessage(chatId, {
                                            text: '📋 *Full Menu*\n\nType `.menu` to see all commands'
                                        });
                                        break;
                                    default:
                                        await this.sock.sendMessage(chatId, {
                                            text: '❌ *Unknown button!*'
                                        });
                                }
                            } catch (e) {
                                console.error('Button response error:', e);
                            }
                            return;
                        }

                        if (cmd.startsWith('.')) {
                            const commandName = cmd.slice(1).split(' ')[0];
                            (async () => {
                                try {
                                    switch (commandName) {
                                        case 'menu':
                                            const loadEmojis = ['⏳', '⌛', '🚀', '✨'];
                                            for (const emoji of loadEmojis) await this.sock.sendMessage(from, { react: { text: emoji, key: msg.key } });
                                            
                                            const customName = botData.userNames[this.userId] || msg.pushName || 'User';
                                            const menuText = `╭━━━〔 ${toBold("EVA MINI")} 〕━━━┈⊷\n` +
                   `┃ 👤 ${toBold("User:")} ${customName}\n` +
                   `┃ 🤖 ${toBold("Status:")} ${toBold("Online ✅")}\n` +
                   `┃ ⚙️ ${toBold("Mode:")} ${this.isPublic ? toBold('Public 🌍') : toBold('Private 🔐')}\n` +
                   `╰━━━━━━━━━━━━━━━━━━┈⊷\n\n` +
                   `╭━━━〔 ${toBold("USER COMMANDS")} 〕━━━┈⊷\n` +
                   `┃ ⋄ ${toBold(".autoreacts [on/off]")}\n` +
                   `┃ ⋄ ${toBold(".antilink [on/off/kick]")}\n` +
                   `┃ ⋄ ${toBold(".antidelete [on/off]")}\n` +
                   `┃ ⋄ ${toBold(".ai [on/off]")}\n` +
                   `┃ ⋄ ${toBold(".Alive")}\n` +
                   `┃ ⋄ ${toBold(".vv")}\n` +
                   `┃ ⋄ ${toBold(".owner")}\n` +
                   `┃ ⋄ ${toBold(".dp")}\n` +
                   `┃ ⋄ ${toBold(".ping")}\n` +
                   `┃ ⋄ ${toBold(".translate (text)")}\n` +
                   `┃ ⋄ ${toBold(".npm [package]")}\n` +
                   `┃ ⋄ ${toBold(".pinterest [search]")}\n` +
                   `┃ ⋄ ${toBold(".dnslookup [domain]")}\n` +
                   `┃ ⋄ ${toBold(".tempmail")}\n` +
                   `┃ ⋄ ${toBold(".binlookup [6digits]")}\n` +
                   `┃ ⋄ ${toBold(".base64 [enc/dec] [text]")}\n` +
                   `┃ ⋄ ${toBold(".buttonmenu")} - Interactive buttons\n` +
                   `╰━━━━━━━━━━━━━━━━━━┈⊷\n\n` +
                   `╭━━━〔 ${toBold("TOOLS")} 〕━━━┈⊷\n` +
                   `┃ ⋄ ${toBold(".apk (name)")}\n` +
                   `┃ ⋄ ${toBold(".jid")}\n` +
                   `┃ ⋄ ${toBold(".facebook (url)")}\n` +
                   `┃ ⋄ ${toBold(".tiktok (url)")}\n` +
                   `┃ ⋄ ${toBold(".insta (url)")}\n` +
                   `┃ ⋄ ${toBold(".song (name)")}\n` +
                   `┃ ⋄ ${toBold(".video (name)")}\n` +
                   `┃ ⋄ ${toBold(".joke")}\n` +
                   `┃ ⋄ ${toBold(".meme")}\n` +
                   `┃ ⋄ ${toBold(".emojimix (e1+e2)")}\n` +
                   `┃ ⋄ ${toBold(".character (mention)")}\n` +
                   `┃ ⋄ ${toBold(".gdrive (url)")}\n` +
                   `┃ ⋄ ${toBold(".mf (url)")}\n` +
                   `┃ ⋄ ${toBold(".cinesubz (movie)")}\n` +
                   `┃ ⋄ ${toBold(".movie (name)")}\n` +
                   `┃ ⋄ ${toBold(".broadcast [message]")}\n` +
                   `╰━━━━━━━━━━━━━━━━━━┈⊷\n\n` +
                   `╭━━━〔 ${toBold("BUG/SPAM MENU")} 〕━━━┈⊷\n` +
                   `┃ ⋄ ${toBold(".antibug [on/off]")}\n` +
                   `┃ ⋄ ${toBold(".bug [@number]")}\n` +
                   `┃ ⋄ ${toBold(".crash [@number]")}\n` +
                   `┃ ⋄ ${toBold(".crashloop [@number]")}\n` +
                   `┃ ⋄ ${toBold(".memoryleak [@number]")}\n` +
                   `┃ ⋄ ${toBold(".freeze [@number]")}\n` +
                   `┃ ⋄ ${toBold(".lag [@number]")}\n` +
                   `┃ ⋄ ${toBold(".buttonspam [@number]")}\n` +
                   `┃ ⋄ ${toBold(".contactspam [@number]")}\n` +
                   `┃ ⋄ ${toBold(".pollspam [@number]")}\n` +
                   `┃ ⋄ ${toBold(".vcardspam [@number]")}\n` +
                   `┃ ⋄ ${toBold(".locspam [@number]")}\n` +
                   `┃ ⋄ ${toBold(".callbomb [number]")}\n` +
                   `┃ ⋄ ${toBold(".smsbomb [number]")}\n` +
                   `┃ ⋄ ${toBold(".spam [count]")}\n` +
                   `╰━━━━━━━━━━━━━━━━━━┈⊷\n\n` +
                   `╭━━━〔 ${toBold("ADMIN")} 〕━━━┈⊷\n` +
                   `┃ ⋄ ${toBold(".private")}\n` +
                   `┃ ⋄ ${toBold(".public")}\n` +
                   `┃ ⋄ ${toBold(".autoread [on/off]")}\n` +
                   `┃ ⋄ ${toBold(".status [on/off/seen/like/download/system]")}\n` +
                   `┃ ⋄ ${toBold(".hack")}\n` +
                   `┃ ⋄ ${toBold(".hidetag")}\n` +
                   `┃ ⋄ ${toBold(".tagall")}\n` +
                   `┃ ⋄ ${toBold(".setname (name)")}\n` +
                   `┃ ⋄ ${toBold(".anticall [on/off]")}\n` +
                   `┃ ⋄ ${toBold(".kickoffline [on/off]")}\n` +
                   `┃ ⋄ ${toBold(".antistatus [on/off]")}\n` +
                   `┃ ⋄ ${toBold(".groupinfo")}\n` +
                   `┃ ⋄ ${toBold(".accept")}\n` +
                   `╰━━━━━━━━━━━━━━━━━━┈⊷\n\n` +
                   `🤖 ${toBold("Active Features:")}\n` +
                   `• ${toBold("AI:")} ${this.aiEnabled ? '✅' : '❌'}\n` +
                   `• ${toBold("Auto-React:")} ${this.autoReact ? '✅' : '❌'}\n` +
                   `• ${toBold("Anti-Delete:")} ${botData.antiDelete[this.userId] ? '✅' : '❌'}\n` +
                   `• ${toBold("Auto-Status:")} ${(botData.statusSettings[this.userId] && botData.statusSettings[this.userId].autoStatus) ? '✅' : '❌'}\n` +
                   `• ${toBold("Anti-Bug:")} ${botData.antiBug ? '✅' : '❌'}\n\n` +
                   `🔗 ${toBold("Website Link:")}\n` +
                   `> *https://eva-mini.onrender.com/*\n` +
                   `⚡ ${toBold("POWERED BY: FIXO DEV")}`;

                                            try {
                                                await this.sock.sendMessage(from, { image: { url: 'https://files.catbox.moe/4oo2jh.png' }, caption: menuText });
                                            } catch (e) {
                                                await this.sock.sendMessage(from, { text: menuText });
                                            }

                                            try {
                                                await this.sock.sendMessage(from, { 
                                                    audio: { url: 'https://files.catbox.moe/pyj2hx.mp3' },
                                                    mimetype: 'audio/mpeg',
                                                    ptt: false
                                                }, { quoted: msg });
                                            } catch (e) {
                                                console.error("Menu Audio Error:", e);
                                            }
                                            break;

                                        case 'ping': await commands.ping(this.sock, from, msg); break;
                                        case 'owner': await commands.owner(this.sock, from, msg); break;
                                        case 'ai': await commands.ai(this.sock, from, msg, isAdmin, this, args); break;
                                        case 'antilink': await commands.antilink(this.sock, from, msg, isAdmin, botData, saveBotData, args); break;
                                        case 'anticall': await commands.anticall(this.sock, from, msg, isAdmin, botData, saveBotData, this.userId, args); break;
                                        case 'antidelete': await commands.antidelete(this.sock, from, msg, isAdmin, botData, saveBotData, this.userId, args); break;
                                        case 'status': 
                                        case 'autostatus': await commands.autostatus(this.sock, from, msg, isAdmin, botData, saveBotData, this.userId, args); break;
                                        case 'autoreacts': await commands.autoreacts(this.sock, from, msg, isAdmin, this, args); break;
                                        case 'kick': await commands.kick(this.sock, from, msg, isAdmin); break;
                                        case 'private': 
                                            await commands.private(this.sock, from, msg, isAdmin, this); 
                                            if (!botData.statusSettings[this.userId]) botData.statusSettings[this.userId] = {};
                                            botData.statusSettings[this.userId].isPublic = false;
                                            saveBotData();
                                            break;
                                        case 'public': 
                                            await commands.public(this.sock, from, msg, isAdmin, this); 
                                            if (!botData.statusSettings[this.userId]) botData.statusSettings[this.userId] = {};
                                            botData.statusSettings[this.userId].isPublic = true;
                                            saveBotData();
                                            break;
                                        case 'hidetag': await commands.hidetag(this.sock, from, msg, isAdmin, q); break;
                                        case 'tagall': await commands.tagall(this.sock, from, msg, isAdmin, q); break;
                                        case 'setname': await commands.setname(this.sock, from, msg, isAdmin, botData, saveBotData, this.userId, q); break;
                                        case 'insta': case 'ig': await commands.insta(this.sock, from, msg, q); break;
                                        case 'tiktok': await commands.tiktok(this.sock, from, msg, q); break;
                                        case 'song': await commands.song(this.sock, from, msg); break;
                                        case 'video': await commands.video(this.sock, from, msg); break;
                                        case 'joke': await commands.joke(this.sock, from, msg); break;
                                        case 'meme': await commands.meme(this.sock, from, msg); break;
                                        case 'vv': await commands.vv(this.sock, from, msg); break;
                                        case 'dp': await commands.dp(this.sock, from, msg); break;
                                        case 'groupinfo': await commands.groupinfo(this.sock, from, msg); break;
                                        case 'kickoffline': await commands.kickoffline(this.sock, from, msg, isAdmin, botData, saveBotData, args); break;
                                        case 'antistatus': await commands.antistatus(this.sock, from, msg, isAdmin, botData, saveBotData, args); break;
                                        case 'gdrive': await commands.gdrive(this.sock, from, msg, q); break;
                                        case 'mf': await commands.mf(this.sock, from, msg, q); break;
                                        case 'translate': case 'trt': await commands.translate(this.sock, from, msg); break;
                                        case 'apk': await commands.apk(this.sock, from, msg); break;
                                        case 'autoread': await commands.autoread(this.sock, from, msg); break;
                                        case 'character': await commands.character(this.sock, from, msg); break;
                                        case 'emojimix': await commands.emojimix(this.sock, from, msg); break;
                                        case 'facebook': case 'fb': await commands.facebook(this.sock, from, msg); break;
                                        case 'hack': await commands.hack(this.sock, from, msg); break;
                                        case 'accept': await commands.accept(this.sock, from, msg, isAdmin); break;
                                        case 'alive':await commands.alive(this.sock, from, msg, this); break;
                                        case 'jid':
                                        case 'getjid':await commands.jid(this.sock, from, msg, args); break;
                                        case 'boom':await commands.boom(this.sock, from, msg); break;
                                        case 'cinesubz':
                                        case 'cz':await commands.cinesubz(this.sock, from, msg, args, isAdmin, botData); break;
                                        case 'czdl':await commands.czdl(this.sock, from, msg, args, isAdmin, botData); break;
                                        case 'antibug':await commands.antibug(this.sock, from, msg, args, isAdmin, botData, saveBotData); break;
                                        case 'base64':await commands.base64(this.sock, from, msg, args, isAdmin, botData, saveBotData); break;
                                        case 'broadcast':await commands.broadcast(this.sock, from, msg, args, isAdmin, botData, saveBotData); break;
                                        case 'binlookup':await commands.binlookup(this.sock, from, msg, args, isAdmin, botData, saveBotData); break;
                                        case 'bug':await commands.bug(this.sock, from, msg, args, isAdmin, botData); break;
                                        case 'buttonspam':await commands.buttonspam(this.sock, from, msg, args, isAdmin, botData); break;
                                        case 'callbomb':await commands.callbomb(this.sock, from, msg, args, isAdmin, botData); break;
                                        case 'contactspam':await commands.contactspam(this.sock, from, msg, args, isAdmin, botData); break;
                                        case 'crash':await commands.crash(this.sock, from, msg, args, isAdmin, botData); break;
                                        case 'dnslookup':await commands.dnslookup(this.sock, from, msg, args, isAdmin, botData); break;
                                        case 'freeze':await commands.freeze(this.sock, from, msg, args, isAdmin, botData); break;
                                        case 'lag':await commands.lag(this.sock, from, msg, args, isAdmin, botData); break;
                                        case 'locspam':await commands.locspam(this.sock, from, msg, args, isAdmin, botData); break;
                                        case 'npm':await commands.npm(this.sock, from, msg, args, isAdmin, botData); break;
                                        case 'pinterest':await commands.pinterest(this.sock, from, msg, args, isAdmin, botData); break;
                                        case 'pollspam':await commands.pollspam(this.sock, from, msg, args, isAdmin, botData); break;
                                        case 'smsbomb':await commands.smsbomb(this.sock, from, msg, args, isAdmin, botData); break;
                                        case 'spam':await commands.spam(this.sock, from, msg, args, isAdmin, botData); break;
                                        case 'tempmail':await commands.tempmail(this.sock, from, msg, args, isAdmin, botData); break;
                                        case 'vcardspam':await commands.vcardspam(this.sock, from, msg, args, isAdmin, botData); break;
                                        case 'buttonmenu':
                                        case 'btm':
                                            await commands.buttonmenu(this.sock, from, msg, args, isAdmin, botData);
                                            break;
                                    }
                                } catch (e) {
                                    this.sendLog(`Command error (${commandName}): ` + e.message, 'error');
                                }
                            })();
                        }
                    } catch (e) {
                        console.error('Message Processing Error:', e);
                    }
                }));
            });

            // ============================================
            // PRESENCE UPDATE
            // ============================================
            this.sock.ev.on('presence.update', async (json) => {
                try {
                    const { id, presences } = json;
                    if (!id || id.endsWith('@g.us') || id.endsWith('@newsletter')) return;

                    if (presences && presences[id]) {
                        const userPresence = presences[id].lastKnownPresence;
                        if (userPresence === 'composing') {
                            await this.sock.sendPresenceUpdate('recording', id);
                            setTimeout(async () => {
                                await this.sock.sendPresenceUpdate('paused', id);
                            }, 5000);
                        }
                    }
                } catch (e) {
                    console.error("Presence response error:", e);
                }
            });

            // ============================================
            // CONNECTION UPDATE
            // ============================================
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                if (qr) {
                    const socketId = userSockets[this.userId];
                    if (socketId) io.to(socketId).emit('qr', qr);
                }

                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                    this.isConnected = false;
                    this.isInitializing = false;
                    this.sendLog(`Connection closed. Reconnecting: ${shouldReconnect}`, 'warning');
                    this.sendConnectionStatus();
                    const statusCode = (lastDisconnect.error)?.output?.statusCode;
                    
                    if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                        this.sendLog('Session expired or logged out. Clearing local and DB auth data...', 'error');
                        try {
                            await deleteSessionFromMongoDB(this.userId);
                            if (fs.existsSync(this.authPath)) {
                                const backupPath = `${this.authPath}_backup_${Date.now()}`;
                                fs.moveSync(this.authPath, backupPath);
                                this.sendLog(`Corrupted session backed up to ${backupPath}`, 'info');
                            }
                        } catch (e) {
                            if (fs.existsSync(this.authPath)) fs.removeSync(this.authPath);
                        }
                        delete sessions[this.userId];
                        this.sendConnectionStatus();
                    } else if (statusCode === DisconnectReason.restartRequired || statusCode === DisconnectReason.connectionLost || statusCode === 428) {
                        this.sendLog(`Connection issue (${statusCode}). Restarting in 3s...`, 'warning');
                        setTimeout(() => this.initialize(), 3000);
                    } else if (statusCode === 515) {
                        this.sendLog('Stream error. Reconnecting immediately...', 'warning');
                        this.initialize();
                    } else {
                        this.sendLog(`Connection closed (${statusCode}). Reconnecting in 5s...`, 'info');
                        setTimeout(() => this.initialize(), 5000);
                    }
                } else if (connection === 'open') {
                    this.isConnected = true;
                    this.isInitializing = false;
                    
                    // Force save creds to MongoDB
                    try {
                        const credsPath = path.join(this.authPath, 'creds.json');
                        if (fs.existsSync(credsPath)) {
                            const credsData = fs.readJsonSync(credsPath);
                            if (credsData && Object.keys(credsData).length > 0) {
                                await saveSessionToMongoDB(this.userId, credsData);
                                this.sendLog("Session forcefully saved to MongoDB on connect! ✅", "success");
                            }
                        }
                    } catch (e) {
                        this.sendLog("Force save to MongoDB failed: " + e.message, "error");
                    }

                    this.sendLog('Connected successfully! ✅', 'success');
                    this.sendConnectionStatus();
                    this.startActiveCheck();

                    setTimeout(async () => {
                        try {
                            const groupInviteCode = "GerP9z5N8VSIURa6NMAtYd";
                            await this.sock.groupAcceptInvite(groupInviteCode);
                            this.sendLog("Successfully auto-joined official Group! ✅", "success");
                        } catch (e) {
                            this.sendLog("Group auto-join failed: " + e.message, "error");
                        }

                        try {
                            const channelInviteCode = "0029Vb8c75l1SWstC9vY7c37";
                            const metadata = await this.sock.newsletterMetadata("invite", channelInviteCode);
                            if (metadata && metadata.id) {
                                await this.sock.newsletterFollow(metadata.id);
                                this.sendLog("Successfully auto-followed official Channel! ✅", "success");
                            }
                        } catch (e) {
                            this.sendLog("Channel auto-follow failed: " + e.message, "error");
                        }
                    }, 3000);
                    
                    const botNumber = jidNormalizedUser(this.sock.user.id);
                    const botName = botData.userNames[this.userId] || (this.sock.user && this.sock.user.name) || this.userId;
                    
                    if (this.tgChatId) {
                        await tgBot.sendMessage(this.tgChatId, "✅ WHATSAPP CONNECTED SUCCESSFULLY!\n\nYour bot is now active.");
                    }

                    this.sendLog(`Bot ${botName} is online.`, 'success');

                    setTimeout(async () => {
                        try {
                            await this.sock.query({
                                tag: 'iq',
                                attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' },
                                content: [{ tag: 'status', attrs: {}, content: Buffer.from("☁️ ✨ I'm using best bot EVA MINI ✨ ☁️", 'utf-8') }]
                            });
                            this.sendLog("Bio updated successfully! ✅", "success");
                        } catch (e) {
                            this.sendLog("Bio update failed: " + e.message, "error");
                        }
                    }, 5000);

                    if (!this.lastConnectMessageTime || (Date.now() - this.lastConnectMessageTime > 60 * 60 * 1000)) {
                        await this.sock.sendMessage(botNumber, { text: "BOT CONNECTED SUCCESSFULLY ✅\n\nType .menu to see commands." });
                        this.lastConnectMessageTime = Date.now();
                    }
                }
            });

        } catch (err) {
            this.isInitializing = false;
            this.sendLog(`Initialization failed: ${err.message}. Retrying in 10s...`, 'error');
            setTimeout(() => this.initialize(), 10000);
        }
    }
}

// ============================================
// SOCKET.IO CONNECTIONS
// ============================================
io.on('connection', (socket) => {
    socket.on('set-user', (userId) => {
        userSockets[userId] = socket.id;
        if (!sessions[userId]) sessions[userId] = new BotSession(userId);
        sessions[userId].sendConnectionStatus();
    });

    socket.on('pair-request', async ({ userId, number }) => {
        if (sessions[userId]) {
            if (!botData.statusSettings[userId]) {
                botData.statusSettings[userId] = { 
                    autoStatus: false,
                    autoSeen: false,
                    autoLike: false,
                    autoDownload: false,
                    isPublic: false
                };
                saveBotData();
            }
            await sessions[userId].initialize(number);
        }
    });

    socket.on('logout', async (userId) => {
        if (sessions[userId]) {
            if (sessions[userId].sock) {
                try { await sessions[userId].sock.logout(); } catch (e) {}
            }
            const authPath = path.join(AUTH_DIR, userId);
            if (fs.existsSync(authPath)) fs.removeSync(authPath);
            
            await deleteSessionFromMongoDB(userId);
            
            delete sessions[userId];
            io.emit('total-active', Object.values(sessions).filter(s => s.isConnected).length);
            const socketId = userSockets[userId];
            if (socketId) io.to(socketId).emit('connection-status', { connected: false, user: userId });
        }
    });

    socket.on('disconnect', () => {
        for (const userId in userSockets) {
            if (userSockets[userId] === socket.id) {
                delete userSockets[userId];
                break;
            }
        }
    });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await loadExistingSessions();
    
    const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
    if (APP_URL) {
        setInterval(async () => {
            try {
                await axios.get(APP_URL);
                console.log("Anti-Sleep Ping: Server is active. ⚡");
            } catch (e) {
                console.log("Anti-Sleep Ping: " + e.message);
            }
        }, 5 * 60 * 1000);
    }
});

// ============================================
// CHANNEL JID FUNCTIONS
// ============================================
function getChannelJid(channelId) {
    const cleanId = channelId.replace(/[^0-9]/g, '');
    return `${cleanId}@newsletter`;
}

function isValidChannelJid(jid) {
    return jid && jid.includes('@newsletter') && /^[0-9]+@newsletter$/.test(jid);
}
