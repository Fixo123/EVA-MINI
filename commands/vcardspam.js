// commands/vcardspam.js - vCard Spam Attack for EVA-MINI
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '📇',
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
                text: `⚠️ *Usage:* .vcardspam [@mention] or reply to user\n\n📌 *Example:* .vcardspam @94703945265\n\n📇 *Send vCard spam to target!*`
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
            text: `📇 *Sending vCard spam to @${targetNumber}...*\n\n⏳ Please wait...`,
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
        // SEND VCARD SPAM
        // ============================================
        let successCount = 0;
        let totalMessages = 20;

        // Contact names for vCards
        const contactNames = [
            'John Doe', 'Jane Smith', 'Michael Brown', 'Sarah Wilson',
            'David Lee', 'Emma Taylor', 'James Anderson', 'Lisa Thomas',
            'Robert Martin', 'Maria Garcia', 'William Johnson', 'Patricia Davis',
            'Richard Miller', 'Jennifer Jones', 'Charles Wilson', 'Linda Moore',
            'Thomas Taylor', 'Barbara Anderson', 'Christopher Thomas', 'Jessica White'
        ];

        for (let i = 0; i < totalMessages; i++) {
            try {
                const name = contactNames[i % contactNames.length];
                const phoneNum = 1000000000 + i;
                
                // Create vCard
                const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nN:${name};;;\nTEL;TYPE=CELL:+${phoneNum}\nEMAIL:${name.toLowerCase().replace(/\s/g, '')}@email.com\nORG:EVA-MINI Spam\nTITLE:Contact ${i + 1}\nNOTE:This is vCard spam #${i + 1}\nEND:VCARD`;
                
                await sock.sendMessage(target, {
                    contacts: {
                        displayName: `${name}`,
                        contacts: [{
                            vcard: vcard
                        }]
                    }
                });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (e) {
                console.log(`vCard spam ${i + 1} failed:`, e.message);
            }
        }

        // ============================================
        // SEND BULK VCARDS
        // ============================================
        try {
            // Send multiple vCards in one message
            let bulkVcards = [];
            for (let i = 0; i < 5; i++) {
                const name = `Bulk Contact ${i + 1}`;
                const phoneNum = 2000000000 + i;
                const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;TYPE=CELL:+${phoneNum}\nEND:VCARD`;
                bulkVcards.push({ vcard: vcard });
            }
            
            await sock.sendMessage(target, {
                contacts: {
                    displayName: 'Bulk Contacts 📇',
                    contacts: bulkVcards
                }
            });
            successCount += 5;
        } catch (e) {
            console.log('Bulk vCard spam failed:', e.message);
        }

        // ============================================
        // SEND VCARDS WITH DIFFERENT FORMATS
        // ============================================
        try {
            const specialVcards = [
                {
                    name: 'Company Contact',
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Company Contact\nORG:EVA-MINI Inc.\nTEL;TYPE=WORK:+1234567890\nEMAIL:info@eva-mini.com\nEND:VCARD`
                },
                {
                    name: 'Emergency Contact',
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Emergency Contact\nTEL;TYPE=CELL:+0987654321\nTEL;TYPE=HOME:+1234567890\nEND:VCARD`
                },
                {
                    name: 'Support Team',
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Support Team\nORG:EVA-MINI Support\nTEL;TYPE=WORK:+1122334455\nEMAIL:support@eva-mini.com\nEND:VCARD`
                }
            ];

            for (const contact of specialVcards) {
                await sock.sendMessage(target, {
                    contacts: {
                        displayName: contact.name,
                        contacts: [{ vcard: contact.vcard }]
                    }
                });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        } catch (e) {
            console.log('Special vCard spam failed:', e.message);
        }

        // ============================================
        // SEND VCARDS WITH LOCATION
        // ============================================
        try {
            for (let i = 0; i < 3; i++) {
                const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:Location Contact ${i + 1}\nTEL;TYPE=CELL:+${3000000000 + i}\nADR;TYPE=WORK:;;123 Main St;City;State;12345;Country\nEND:VCARD`;
                await sock.sendMessage(target, {
                    contacts: {
                        displayName: `Location Contact ${i + 1}`,
                        contacts: [{ vcard: vcard }]
                    }
                });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        } catch (e) {
            console.log('Location vCard spam failed:', e.message);
        }

        // ============================================
        // SUCCESS MESSAGE
        // ============================================
        await sock.sendMessage(from, {
            text: `📇 *vCard spam delivered!*\n\n📱 *Target:* @${targetNumber}\n📊 *vCards:* ${successCount} sent\n💥 *Status:* SUCCESS\n\n⚠️ *Target's WhatsApp may experience issues with contacts!*`,
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
                text: `📇 *vCard Spam Report*\n\n📱 *Target:* @${targetNumber}\n👤 *By:* ${msg.pushName || 'Unknown'}\n📊 *vCards:* ${successCount}\n✅ *Status:* SUCCESS\n🕐 *Time:* ${new Date().toLocaleString()}`,
                mentions: [target]
            });
        } catch (e) {}

    } catch (error) {
        console.error('vCard spam error:', error);
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