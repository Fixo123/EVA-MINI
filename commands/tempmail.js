// commands/tempmail.js - Temporary Email for EVA-MINI
const axios = require('axios');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

// Store active tempmail sessions
const tempmailSessions = {};

// Mail.tm API base URL
const MAIL_API = 'https://api.mail.tm';

async function createAccount() {
    try {
        // Get available domains
        const domainsRes = await axios.get(`${MAIL_API}/domains`, { timeout: 10000 });
        const domain = domainsRes.data['hydra:member'][0].domain;

        // Generate random credentials
        const randomId = Math.random().toString(36).substring(2, 10);
        const email = `${randomId}@${domain}`;
        const password = Math.random().toString(36).substring(2, 15);

        // Create account
        await axios.post(`${MAIL_API}/accounts`, {
            address: email,
            password: password
        }, { timeout: 10000 });

        // Get token
        const tokenRes = await axios.post(`${MAIL_API}/token`, {
            address: email,
            password: password
        }, { timeout: 10000 });

        return {
            email: email,
            password: password,
            token: tokenRes.data.token
        };
    } catch (err) {
        throw new Error('Failed to create tempmail: ' + err.message);
    }
}

async function checkMessages(token) {
    try {
        const res = await axios.get(`${MAIL_API}/messages`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
        });
        return res.data['hydra:member'] || [];
    } catch (err) {
        return [];
    }
}

async function getMessage(token, messageId) {
    try {
        const res = await axios.get(`${MAIL_API}/messages/${messageId}`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
        });
        return res.data;
    } catch (err) {
        return null;
    }
}

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '📧',
                    key: msg.key
                }
            });
        } catch (e) {}

        const userId = from;

        // ============================================
        // IF USER HAS ACTIVE TEMPMAIL
        // ============================================
        if (tempmailSessions[userId]) {
            const session = tempmailSessions[userId];

            // Check if session expired (10 minutes)
            if (Date.now() - session.createdAt > 10 * 60 * 1000) {
                delete tempmailSessions[userId];
                await sock.sendMessage(from, {
                    text: `⏰ *Tempmail session expired!*\n\nUse .tempmail to create a new one.`
                });
                try {
                    await sock.sendMessage(from, {
                        react: {
                            text: '⏰',
                            key: msg.key
                        }
                    });
                } catch (e) {}
                return;
            }

            // Check for new messages
            const messages = await checkMessages(session.token);
            const newMessages = messages.filter(m => !session.seenMessages.includes(m.id));

            if (newMessages.length > 0) {
                // Forward new messages/OTPs
                for (const message of newMessages) {
                    const fullMsg = await getMessage(session.token, message.id);
                    if (fullMsg) {
                        const otpMatch = fullMsg.text?.match(/\b\d{4,8}\b/) || fullMsg.intro?.match(/\b\d{4,8}\b/);
                        const otp = otpMatch ? otpMatch[0] : null;

                        const forwardText = `📧 *NEW EMAIL RECEIVED*\n\n` +
                                          `📨 *From:* ${fullMsg.from?.address || 'Unknown'}\n` +
                                          `📌 *Subject:* ${fullMsg.subject || 'No Subject'}\n` +
                                          `🕐 *Time:* ${new Date(fullMsg.createdAt).toLocaleString()}\n\n` +
                                          (otp ? `🔐 *OTP:* \`${otp}\`\n\n` : '') +
                                          `📝 *Content:*\n${fullMsg.intro || fullMsg.text?.substring(0, 500) || 'No content'}\n\n` +
                                          `> 🤖 *EVA-MINI TempMail*`;

                        await sock.sendMessage(from, { text: forwardText });
                        session.seenMessages.push(message.id);
                    }
                }
            }

            // Show current email info
            const text = `📧 *TEMP MAIL ACTIVE*\n\n` +
                         `📩 *Email:*\n\`${session.email}\`\n\n` +
                         `📨 *Total:* ${messages.length} emails\n` +
                         `🔔 *New:* ${newMessages.length} emails\n\n` +
                         `⏳ *Valid for:* ${Math.round((10 * 60 * 1000 - (Date.now() - session.createdAt)) / 1000 / 60)} minutes\n\n` +
                         `🔄 *Commands:*\n` +
                         `.tempmail - Check new emails\n` +
                         `.tempmail delete - Delete temp mail\n` +
                         `.tempmail refresh - Create new email\n\n` +
                         `> 🤖 *EVA-MINI TempMail*`;

            await sock.sendMessage(from, { text }, { quoted: msg });
            
            try {
                await sock.sendMessage(from, {
                    react: {
                        text: '✅',
                        key: msg.key
                    }
                });
            } catch (e) {}
            return;
        }

        // ============================================
        // CREATE NEW TEMPMAIL
        // ============================================
        await sock.sendMessage(from, {
            text: `📧 *Creating temporary email...*\n\n⏳ Please wait...`
        });

        try {
            await sock.sendMessage(from, {
                react: {
                    text: '⏳',
                    key: msg.key
                }
            });
        } catch (e) {}

        const account = await createAccount();

        // Store session
        tempmailSessions[userId] = {
            email: account.email,
            token: account.token,
            createdAt: Date.now(),
            seenMessages: []
        };

        const text = `📧 *TEMP MAIL CREATED*\n\n` +
                     `✅ *Email:*\n\`${account.email}\`\n\n` +
                     `⏳ *Valid for:* 10 minutes\n` +
                     `🔔 *Auto-forward:* OTPs & emails\n\n` +
                     `🔄 *Commands:*\n` +
                     `.tempmail - Check new emails\n` +
                     `.tempmail delete - Delete temp mail\n` +
                     `.tempmail refresh - Create new email\n\n` +
                     `> 🤖 *EVA-MINI TempMail*`;

        await sock.sendMessage(from, { text }, { quoted: msg });

        try {
            await sock.sendMessage(from, {
                react: {
                    text: '✅',
                    key: msg.key
                }
            });
        } catch (e) {}

        // ============================================
        // START AUTO EMAIL CHECKER
        // ============================================
        startEmailChecker(sock, from, userId);

    } catch (error) {
        console.error('TempMail error:', error);
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '❌',
                    key: msg.key
                }
            });
        } catch (e) {}
        await sock.sendMessage(from, {
            text: `❌ *Error:* ${error.message}\n\nPlease try again later.`
        });
    }
};

// ============================================
// AUTO EMAIL CHECKER
// ============================================
function startEmailChecker(sock, chatId, userId) {
    // Clear existing interval if any
    if (tempmailSessions[userId]?.interval) {
        clearInterval(tempmailSessions[userId].interval);
    }

    const interval = setInterval(async () => {
        const session = tempmailSessions[userId];
        if (!session) {
            clearInterval(interval);
            return;
        }

        // Check if session expired (10 minutes)
        if (Date.now() - session.createdAt > 10 * 60 * 1000) {
            delete tempmailSessions[userId];
            clearInterval(interval);
            try {
                await sock.sendMessage(chatId, {
                    text: `⏰ *Tempmail session expired!*\n\nUse .tempmail to create a new one.`
                });
            } catch (e) {}
            return;
        }

        try {
            const messages = await checkMessages(session.token);
            const newMessages = messages.filter(m => !session.seenMessages.includes(m.id));

            for (const message of newMessages) {
                const fullMsg = await getMessage(session.token, message.id);
                if (fullMsg) {
                    const otpMatch = fullMsg.text?.match(/\b\d{4,8}\b/) || fullMsg.intro?.match(/\b\d{4,8}\b/);
                    const otp = otpMatch ? otpMatch[0] : null;

                    const forwardText = `📧 *NEW EMAIL*\n\n` +
                                      `📨 *From:* ${fullMsg.from?.address || 'Unknown'}\n` +
                                      `📌 *Subject:* ${fullMsg.subject || 'No Subject'}\n` +
                                      `🕐 *Time:* ${new Date(fullMsg.createdAt).toLocaleString()}\n\n` +
                                      (otp ? `🔐 *OTP:* \`${otp}\`\n\n` : '') +
                                      `📝 *Content:*\n${fullMsg.intro || fullMsg.text?.substring(0, 500) || 'No content'}\n\n` +
                                      `> 🤖 *EVA-MINI TempMail*`;

                    await sock.sendMessage(chatId, { text: forwardText });
                    session.seenMessages.push(message.id);
                }
            }
        } catch (e) {
            console.log('Email checker error:', e.message);
        }
    }, 15000); // Check every 15 seconds

    // Store interval reference
    if (tempmailSessions[userId]) {
        tempmailSessions[userId].interval = interval;
    }
}