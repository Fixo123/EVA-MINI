// commands/buttonspam.js - Button Spam Attack for EVA-MINI
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '🔘',
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
                text: "❌ *Owner only!*"
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
        // GET TARGET
        // ============================================
        let target;
        const q = args.join(' ');
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;

        if (q && q.match(/\d/)) {
            const cleanNumber = q.replace(/\D/g, '');
            target = jidNormalizedUser(cleanNumber + '@s.whatsapp.net');
        } else if (mentioned) {
            target = mentioned;
        } else if (quoted) {
            target = quoted;
        } else {
            await sock.sendMessage(from, {
                text: `⚠️ *Usage:* .buttonspam [@mention] or reply to user\n\n📌 *Example:* .buttonspam @94703945265\n\n🔘 *Send button spam to target!*`
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

        // ============================================
        // STATUS MESSAGE
        // ============================================
        const targetNumber = target.split('@')[0];
        const statusMsg = await sock.sendMessage(from, {
            text: `🔘 *Sending button spam to @${targetNumber}...*\n\n⏳ Please wait...`,
            mentions: [target]
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
        // SEND BUTTON SPAM
        // ============================================
        let successCount = 0;
        let totalMessages = 15;

        const buttonColors = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🔘'];

        for (let i = 0; i < totalMessages; i++) {
            try {
                const color = buttonColors[i % buttonColors.length];
                const btnId = `btn_${i}`;
                
                await sock.sendMessage(target, {
                    text: `${color} *Button Spam #${i + 1}*\n\n📱 *Target:* @${targetNumber}\n🔘 *Type:* Interactive Buttons\n\n⚠️ *This is a spam attack!*`,
                    footer: '🔘 EVA-MINI Button Spam',
                    buttons: [
                        {
                            buttonId: `${btnId}_1`,
                            buttonText: { displayText: `✅ Yes ${i+1}` },
                            type: 1
                        },
                        {
                            buttonId: `${btnId}_2`,
                            buttonText: { displayText: `❌ No ${i+1}` },
                            type: 1
                        },
                        {
                            buttonId: `${btnId}_3`,
                            buttonText: { displayText: `🔘 Maybe ${i+1}` },
                            type: 1
                        }
                    ],
                    headerType: 1,
                    mentions: [target]
                });
                successCount++;
                
                // Small delay between messages
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (e) {
                console.log(`Button spam ${i + 1} failed:`, e.message);
            }
        }

        // ============================================
        // SEND EXTRA BUTTON SPAM
        // ============================================
        try {
            // Send list message spam
            for (let i = 0; i < 5; i++) {
                await sock.sendMessage(target, {
                    text: `📋 *List Spam #${i + 1}*\n\nSelect an option:`,
                    footer: '🔘 EVA-MINI List Spam',
                    buttonText: '📋 Options',
                    sections: [{
                        title: `Section ${i + 1}`,
                        rows: [
                            { title: `Option 1-${i}`, rowId: `opt1_${i}`, description: `Description 1-${i}` },
                            { title: `Option 2-${i}`, rowId: `opt2_${i}`, description: `Description 2-${i}` },
                            { title: `Option 3-${i}`, rowId: `opt3_${i}`, description: `Description 3-${i}` }
                        ]
                    }]
                });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (e) {
            console.log('List spam failed:', e.message);
        }

        // ============================================
        // SEND TEMPLATE BUTTON SPAM
        // ============================================
        try {
            for (let i = 0; i < 5; i++) {
                await sock.sendMessage(target, {
                    text: `📌 *Template #${i + 1}*\n\nClick a button:`,
                    templateButtons: [
                        { index: 1, urlButton: { displayText: '🌐 Website', url: 'https://example.com' } },
                        { index: 2, callButton: { displayText: '📞 Call', phoneNumber: '94703945265' } },
                        { index: 3, quickReplyButton: { displayText: `👍 Reply ${i+1}`, id: `reply_${i}` } }
                    ]
                });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (e) {
            console.log('Template spam failed:', e.message);
        }

        // ============================================
        // SUCCESS MESSAGE
        // ============================================
        await sock.sendMessage(from, {
            text: `🔘 *Button spam delivered!*\n\n📱 *Target:* @${targetNumber}\n📊 *Messages:* ${successCount} sent\n💥 *Status:* SUCCESS\n\n⚠️ *Target's WhatsApp may experience issues!*`,
            mentions: [target]
        });

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
        // DELETE STATUS MESSAGE
        // ============================================
        try {
            await new Promise(resolve => setTimeout(resolve, 3000));
            await sock.sendMessage(from, {
                delete: statusMsg.key
            });
        } catch (e) {}

        // ============================================
        // OWNER REPORT
        // ============================================
        try {
            await sock.sendMessage(botNumber, {
                text: `🔘 *Button Spam Report*\n\n📱 *Target:* @${targetNumber}\n👤 *By:* ${msg.pushName || 'Unknown'}\n📊 *Messages:* ${successCount}\n✅ *Status:* SUCCESS\n🕐 *Time:* ${new Date().toLocaleString()}`,
                mentions: [target]
            });
        } catch (e) {}

    } catch (error) {
        console.error('Button spam error:', error);
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