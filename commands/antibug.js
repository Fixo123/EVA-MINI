// commands/antibug.js
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData, saveBotData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: { text: '🛡️', key: msg.key }
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

        const action = args[0]?.toLowerCase();

        // ============================================
        // ANTI-BUG ON
        // ============================================
        if (action === 'on') {
            botData.antiBug = true;
            saveBotData();
            
            await sock.sendMessage(from, {
                text: '🛡️ *Anti-Bug Protection ON!*\n\n' +
                      '✅ System will now block bug commands\n' +
                      '🔒 All suspicious activities will be prevented'
            });
            
            try {
                await sock.sendMessage(from, {
                    react: { text: '✅', key: msg.key }
                });
            } catch (e) {}

        // ============================================
        // ANTI-BUG OFF
        // ============================================
        } else if (action === 'off') {
            botData.antiBug = false;
            saveBotData();
            
            await sock.sendMessage(from, {
                text: '❌ *Anti-Bug Protection OFF!*\n\n' +
                      '⚠️ System will allow bug commands\n' +
                      '🔓 Bot is now vulnerable'
            });
            
            try {
                await sock.sendMessage(from, {
                    react: { text: '❌', key: msg.key }
                });
            } catch (e) {}

        // ============================================
        // SHOW STATUS
        // ============================================
        } else {
            const status = botData.antiBug ? '🟢 ON' : '🔴 OFF';
            const statusEmoji = botData.antiBug ? '✅' : '❌';
            
            await sock.sendMessage(from, {
                text: `🛡️ *Anti-Bug Protection*\n\n` +
                      `📌 *Status:* ${status}\n` +
                      `🔒 *Protection:* ${botData.antiBug ? 'Active' : 'Inactive'}\n\n` +
                      `*Commands:*\n` +
                      `.antibug on - Enable protection\n` +
                      `.antibug off - Disable protection\n\n` +
                      `⚠️ Only bot owner can use this command.`
            });
            
            try {
                await sock.sendMessage(from, {
                    react: { text: statusEmoji, key: msg.key }
                });
            } catch (e) {}
        }

    } catch (error) {
        console.error('Anti-Bug error:', error);
        await sock.sendMessage(from, {
            text: `❌ *Error:* ${error.message}`
        });
    }
};