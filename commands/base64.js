// commands/base64.js
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData, saveBotData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: { text: '🔐', key: msg.key }
            });
        } catch (e) {}

        // ============================================
        // CHECK IF ARGUMENTS PROVIDED
        // ============================================
        if (!args || args.length === 0) {
            await sock.sendMessage(from, {
                text: `⚠️ *Usage:*\n` +
                      `.base64 enc Hello World\n` +
                      `.base64 dec SGVsbG8gV29ybGQ=\n\n` +
                      `📌 *Example:*\n` +
                      `.base64 enc Hello World\n` +
                      `.base64 dec SGVsbG8gV29ybGQ=`
            });
            return;
        }

        const action = args[0].toLowerCase();
        const text = args.slice(1).join(' ');

        if (!text) {
            await sock.sendMessage(from, {
                text: '❌ *Please provide text to encode/decode!*\n\n' +
                      `Example:\n` +
                      `.base64 enc Hello World\n` +
                      `.base64 dec SGVsbG8gV29ybGQ=`
            });
            return;
        }

        // ============================================
        // ENCODE
        // ============================================
        if (action === 'enc' || action === 'encode') {
            const result = Buffer.from(text).toString('base64');
            
            await sock.sendMessage(from, {
                text: `🔐 *BASE64 ENCODER* 🔐\n\n` +
                      `📝 *Original:*\n${text}\n\n` +
                      `🔒 *Encoded:*\n\`${result}\`\n\n` +
                      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                      `⚡ Powered by EVA MINI`
            });
            
            try {
                await sock.sendMessage(from, {
                    react: { text: '✅', key: msg.key }
                });
            } catch (e) {}

        // ============================================
        // DECODE
        // ============================================
        } else if (action === 'dec' || action === 'decode') {
            try {
                const result = Buffer.from(text, 'base64').toString('utf8');
                
                await sock.sendMessage(from, {
                    text: `🔓 *BASE64 DECODER* 🔓\n\n` +
                          `🔒 *Encoded:*\n${text}\n\n` +
                          `📝 *Decoded:*\n\`${result}\`\n\n` +
                          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                          `⚡ Powered by EVA MINI`
                });
                
                try {
                    await sock.sendMessage(from, {
                        react: { text: '✅', key: msg.key }
                    });
                } catch (e) {}
                
            } catch (error) {
                await sock.sendMessage(from, {
                    text: '❌ *Invalid Base64 string!*\n\nPlease check your input and try again.'
                });
                
                try {
                    await sock.sendMessage(from, {
                        react: { text: '❌', key: msg.key }
                    });
                } catch (e) {}
            }

        // ============================================
        // INVALID ACTION
        // ============================================
        } else {
            await sock.sendMessage(from, {
                text: `⚠️ *Invalid action!*\n\n` +
                      `*Usage:*\n` +
                      `.base64 enc Hello World\n` +
                      `.base64 dec SGVsbG8gV29ybGQ=\n\n` +
                      `*Actions:*\n` +
                      `• enc / encode - Encode text to Base64\n` +
                      `• dec / decode - Decode Base64 to text`
            });
        }

    } catch (error) {
        console.error('Base64 error:', error);
        await sock.sendMessage(from, {
            text: `❌ *Error:* ${error.message}`
        });
    }
};