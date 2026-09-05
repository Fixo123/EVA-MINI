// commands/broadcast.js
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData, saveBotData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: { text: '📣', key: msg.key }
            });
        } catch (e) {}

        // ============================================
        // CHECK ADMIN/OWNER
        // ============================================
        if (!isAdmin) {
            await sock.sendMessage(from, {
                text: '❌ *Owner only!*\n\nThis command is restricted to the bot owner.'
            });
            return;
        }

        // ============================================
        // CHECK MESSAGE
        // ============================================
        if (!args || args.length === 0) {
            await sock.sendMessage(from, {
                text: `📣 *Broadcast Command*\n\n` +
                      `*Usage:* .broadcast [message]\n\n` +
                      `*Example:*\n` +
                      `.broadcast Hello everyone! This is a broadcast message.\n\n` +
                      `⚠️ *Note:* Message will be sent to all chats and groups.`
            });
            return;
        }

        const broadcastMessage = args.join(' ');

        // ============================================
        // GET ALL CHATS
        // ============================================
        const allChats = Object.keys(sock.chats || {}).filter(jid => 
            jid.endsWith('@s.whatsapp.net') || jid.endsWith('@g.us')
        );

        if (allChats.length === 0) {
            await sock.sendMessage(from, {
                text: '❌ *No chats found!*\n\nPlease make sure the bot has chats to broadcast to.'
            });
            return;
        }

        // ============================================
        // SEND BROADCAST
        // ============================================
        await sock.sendMessage(from, {
            text: `📣 *Broadcasting...*\n\n` +
                  `📌 *Message:* ${broadcastMessage.substring(0, 50)}${broadcastMessage.length > 50 ? '...' : ''}\n` +
                  `📊 *Total Chats:* ${allChats.length}\n` +
                  `⏳ *Status:* Sending...`
        });

        let sent = 0;
        let failed = 0;

        for (const jid of allChats) {
            try {
                await sock.sendMessage(jid, { 
                    text: `📣 *BROADCAST MESSAGE* 📣\n\n${broadcastMessage}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⚡ Powered by EVA MINI` 
                });
                sent++;
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (e) {
                failed++;
                console.error(`Failed to send to ${jid}:`, e.message);
            }
        }

        // ============================================
        // COMPLETION REPORT
        // ============================================
        await sock.sendMessage(from, {
            text: `✅ *Broadcast Complete*\n\n` +
                  `📌 *Message:* ${broadcastMessage.substring(0, 50)}${broadcastMessage.length > 50 ? '...' : ''}\n` +
                  `✅ *Sent:* ${sent}\n` +
                  `❌ *Failed:* ${failed}\n` +
                  `📊 *Total:* ${allChats.length}\n\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `⚡ Powered by EVA MINI`
        });

        // ============================================
        // SUCCESS REACTION
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: { text: '✅', key: msg.key }
            });
        } catch (e) {}

    } catch (error) {
        console.error('Broadcast error:', error);
        await sock.sendMessage(from, {
            text: `❌ *Error:* ${error.message}`
        });
    }
};