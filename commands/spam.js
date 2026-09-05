// commands/spam.js - Spam Command for EVA-MINI
const fs = require('fs-extra');
const path = require('path');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const SPAM_FILE = path.join(__dirname, '..', 'spam.txt');

function onlyDigits(s = '') { 
    return String(s).replace(/\D/g, ''); 
}

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '📨',
                    key: msg.key
                }
            });
        } catch (e) {}

        // ============================================
        // ADMIN/OWNER CHECK
        // ============================================
        const sender = msg.key.participant || from;
        const botNumber = jidNormalizedUser(sock.user.id);
        const isOwner = sender.includes(botNumber.split('@')[0]) || msg.key.fromMe;
        
        let isAdmin = isOwner;
        if (!isAdmin && from.endsWith('@g.us')) {
            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participant = groupMetadata.participants.find(p => p.id === sender);
                isAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
            } catch (e) {
                isAdmin = false;
            }
        }

        if (!isAdmin) {
            await sock.sendMessage(from, {
                text: "❌ *Only admins/owner can use this command!*"
            });
            try {
                await sock.sendMessage(from, {
                    react: {
                        text: '⛔',
                        key: msg.key
                    }
                });
            } catch (e) {}
            return;
        }

        // ============================================
        // CHECK SPAM FILE
        // ============================================
        if (!fs.existsSync(SPAM_FILE)) {
            await sock.sendMessage(from, {
                text: `⚠️ *spam.txt file not found!*\n\n📌 *Create spam.txt file in the project root directory.*\n\n📝 *Example content:*\nHello! This is a spam message.\n\n> 🤖 *EVA-MINI Spam Tool*`
            });
            try {
                await sock.sendMessage(from, {
                    react: {
                        text: '⚠️',
                        key: msg.key
                    }
                });
            } catch (e) {}
            return;
        }

        const spamText = fs.readFileSync(SPAM_FILE, 'utf8').trim();
        if (!spamText) {
            await sock.sendMessage(from, {
                text: `⚠️ *spam.txt is empty!*\n\n📌 *Add content to spam.txt file.*`
            });
            try {
                await sock.sendMessage(from, {
                    react: {
                        text: '⚠️',
                        key: msg.key
                    }
                });
            } catch (e) {}
            return;
        }

        // ============================================
        // GET COUNT
        // ============================================
        const q = args.join(' ');
        let count = 50;
        if (q && !isNaN(parseInt(q))) {
            count = Math.min(parseInt(q), 100);
        }

        // ============================================
        // STATUS MESSAGE
        // ============================================
        const statusMsg = await sock.sendMessage(from, {
            text: `📨 *SPAM ATTACK*\n\n📁 *File:* spam.txt\n📊 *Count:* ${count}\n⚡ *Speed:* ULTRA FAST\n\n⏳ Starting spam...`
        });

        try {
            await sock.sendMessage(from, {
                react: {
                    text: '⏳',
                    key: msg.key
                }
            });
        } catch (e) {}

        // ============================================
        // SEND SPAM
        // ============================================
        let sent = 0;
        let failed = 0;

        for (let i = 0; i < count; i++) {
            try {
                const messageText = `${spamText}\n\n🔥 ${i + 1}/${count}\n📨 EVA-MINI Spam Bot`;
                await sock.sendMessage(from, { text: messageText });
                sent++;
                
                // Small delay to prevent rate limiting
                if (i % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            } catch (e) {
                failed++;
                console.log(`Spam ${i + 1} failed:`, e.message);
            }
        }

        // ============================================
        // EXTRA SPAM (if requested)
        // ============================================
        if (count > 50) {
            try {
                // Send additional spam with variations
                for (let i = 0; i < Math.min(count - 50, 20); i++) {
                    const variation = `🔥 SPAM #${i + 1}\n${spamText}\n\n📨 EVA-MINI Spam Bot`;
                    await sock.sendMessage(from, { text: variation });
                    sent++;
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (e) {
                console.log('Extra spam failed:', e.message);
            }
        }

        // ============================================
        // SUCCESS MESSAGE
        // ============================================
        await sock.sendMessage(from, {
            text: `✅ *SPAM COMPLETE!*\n\n📨 *Sent:* ${sent}/${count}\n❌ *Failed:* ${failed}\n⚡ *Speed:* ULTRA FAST\n\n📁 *File:* spam.txt\n\n> 🤖 *EVA-MINI Spam Tool*`
        });

        // ============================================
        // FINAL REACTION
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '✅',
                    key: msg.key
                }
            });
        } catch (e) {}

        // ============================================
        // DELETE STATUS MESSAGE
        // ============================================
        try {
            await new Promise(resolve => setTimeout(resolve, 3000));
            await sock.sendMessage(from, {
                delete: statusMsg.key
            });
        } catch (e) {}

        // ============================================
        // OWNER REPORT
        // ============================================
        try {
            await sock.sendMessage(botNumber, {
                text: `📨 *Spam Report*\n\n👤 *By:* ${msg.pushName || 'Unknown'}\n📊 *Count:* ${sent}/${count}\n✅ *Status:* SUCCESS\n🕐 *Time:* ${new Date().toLocaleString()}`
            });
        } catch (e) {}

    } catch (error) {
        console.error('Spam command error:', error);
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '❌',
                    key: msg.key
                }
            });
        } catch (e) {}
        await sock.sendMessage(from, {
            text: `❌ *Error:* ${error.message}`
        });
    }
};