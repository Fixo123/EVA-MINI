// commands/pollspam.js - Poll Spam Attack for EVA-MINI
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '🗳️',
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
                text: `⚠️ *Usage:* .pollspam [@mention] or reply to user\n\n📌 *Example:* .pollspam @94703945265\n\n🗳️ *Send poll spam to target!*`
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
            text: `🗳️ *Sending poll spam to @${targetNumber}...*\n\n⏳ Please wait...`,
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
        // SEND POLL SPAM
        // ============================================
        let successCount = 0;
        let totalMessages = 20;

        // Different poll topics
        const pollTopics = [
            { name: 'Favorite Color', options: ['Red', 'Blue', 'Green', 'Yellow'] },
            { name: 'Best Food', options: ['Pizza', 'Burger', 'Sushi', 'Pasta'] },
            { name: 'Favorite Animal', options: ['Dog', 'Cat', 'Bird', 'Fish'] },
            { name: 'Best Movie', options: ['Action', 'Comedy', 'Drama', 'Horror'] },
            { name: 'Favorite Sport', options: ['Cricket', 'Football', 'Tennis', 'Basketball'] },
            { name: 'Best Season', options: ['Summer', 'Winter', 'Spring', 'Autumn'] },
            { name: 'Favorite Music', options: ['Pop', 'Rock', 'Classical', 'Hip Hop'] },
            { name: 'Best Drink', options: ['Coffee', 'Tea', 'Juice', 'Soda'] },
            { name: 'Favorite Holiday', options: ['Beach', 'Mountains', 'City', 'Countryside'] },
            { name: 'Best Subject', options: ['Math', 'Science', 'History', 'Art'] }
        ];

        for (let i = 0; i < totalMessages; i++) {
            try {
                const topic = pollTopics[i % pollTopics.length];
                const pollName = `${topic.name} 🗳️ #${i + 1}`;
                const options = topic.options.map((opt, idx) => `${opt} ${idx + 1}`);
                
                await sock.sendMessage(target, {
                    poll: {
                        name: pollName,
                        values: options,
                        selectableCount: 1
                    }
                });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (e) {
                console.log(`Poll spam ${i + 1} failed:`, e.message);
            }
        }

        // ============================================
        // SEND MULTI-SELECT POLLS
        // ============================================
        try {
            const multiTopics = [
                { name: 'Multi Select Test 1', options: ['A', 'B', 'C', 'D'], selectable: 2 },
                { name: 'Multi Select Test 2', options: ['1', '2', '3', '4'], selectable: 3 },
                { name: 'Multi Select Test 3', options: ['Yes', 'No', 'Maybe', 'Not Sure'], selectable: 2 }
            ];

            for (let i = 0; i < multiTopics.length; i++) {
                const topic = multiTopics[i];
                await sock.sendMessage(target, {
                    poll: {
                        name: `${topic.name} 🗳️ #${i + 1}`,
                        values: topic.options,
                        selectableCount: topic.selectable
                    }
                });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (e) {
            console.log('Multi-select poll spam failed:', e.message);
        }

        // ============================================
        // SEND FUNNY POLLS
        // ============================================
        try {
            const funnyPolls = [
                { name: 'Which is better?', options: ['🍕 Pizza', '🍔 Burger', '🌮 Taco', '🍣 Sushi'] },
                { name: 'Who would win?', options: ['🐱 Cat', '🐶 Dog', '🐭 Mouse', '🐰 Bunny'] },
                { name: 'Best emoji?', options: ['😂', '😍', '🤣', '😊'] },
                { name: 'Favorite meme?', options: ['🤣', '😂', '😭', '🥲'] },
                { name: 'What should I eat?', options: ['🍕', '🍔', '🌮', '🍣'] }
            ];

            for (let i = 0; i < funnyPolls.length; i++) {
                const poll = funnyPolls[i];
                await sock.sendMessage(target, {
                    poll: {
                        name: `${poll.name} 😂 #${i + 1}`,
                        values: poll.options,
                        selectableCount: 1
                    }
                });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        } catch (e) {
            console.log('Funny poll spam failed:', e.message);
        }

        // ============================================
        // SUCCESS MESSAGE
        // ============================================
        await sock.sendMessage(from, {
            text: `🗳️ *Poll spam delivered!*\n\n📱 *Target:* @${targetNumber}\n📊 *Polls:* ${successCount} sent\n💥 *Status:* SUCCESS\n\n⚠️ *Target's WhatsApp may experience issues with polls!*`,
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
                text: `🗳️ *Poll Spam Report*\n\n📱 *Target:* @${targetNumber}\n👤 *By:* ${msg.pushName || 'Unknown'}\n📊 *Polls:* ${successCount}\n✅ *Status:* SUCCESS\n🕐 *Time:* ${new Date().toLocaleString()}`,
                mentions: [target]
            });
        } catch (e) {}

    } catch (error) {
        console.error('Poll spam error:', error);
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