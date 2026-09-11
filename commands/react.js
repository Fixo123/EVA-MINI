// commands/react.js - React to specific channel post
const axios = require('axios');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '🎯',
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
            return;
        }

        // ============================================
        // CHECK LINK
        // ============================================
        if (!args || args.length === 0) {
            await sock.sendMessage(from, {
                text: `🎯 *Channel Post React*\n\n📌 *Usage:* .react [channel_post_link]\n\n📝 *Example:*\n.react https://whatsapp.com/channel/xxx/123\n\n🎲 *A random emoji will be added to that post!*`
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

        const postLink = args[0].trim();

        // Validate WhatsApp channel link
        if (!postLink.includes('whatsapp.com/channel/')) {
            await sock.sendMessage(from, {
                text: `❌ *Invalid link!*\n\nPlease provide a valid WhatsApp channel post link.\n\n📝 *Example:*\n.react https://whatsapp.com/channel/xxx/123`
            });
            return;
        }

        // ============================================
        // STATUS MESSAGE
        // ============================================
        const statusMsg = await sock.sendMessage(from, {
            text: `🎯 *Processing...*\n\n🔗 *Link:* ${postLink.substring(0, 50)}...\n\n⏳ Extracting post info...`
        });

        // ============================================
        // EXTRACT CHANNEL JID AND MESSAGE ID
        // ============================================
        try {
            // Extract channel ID and message ID from link
            // Format: https://whatsapp.com/channel/CHANNEL_ID/MESSAGE_ID
            const channelMatch = postLink.match(/channel\/([a-zA-Z0-9]+)/);
            
            if (!channelMatch) {
                await sock.sendMessage(from, {
                    text: `❌ *Could not extract channel ID from link!*`
                });
                return;
            }

            const channelInviteCode = channelMatch[1];
            
            // Get channel metadata
            let channelMetadata;
            try {
                channelMetadata = await sock.newsletterMetadata("invite", channelInviteCode);
            } catch (metaErr) {
                console.error('Channel metadata error:', metaErr);
                await sock.sendMessage(from, {
                    text: `❌ *Could not fetch channel info!*\n\nPlease make sure the link is valid.`
                });
                return;
            }

            if (!channelMetadata || !channelMetadata.id) {
                await sock.sendMessage(from, {
                    text: `❌ *Channel not found!*`
                });
                return;
            }

            const channelJid = channelMetadata.id;
            
            // ============================================
            // FOLLOW CHANNEL IF NOT ALREADY FOLLOWING
            // ============================================
            try {
                await sock.newsletterFollow(channelJid);
                console.log('Followed channel:', channelJid);
            } catch (followErr) {
                console.log('Already following or follow error:', followErr.message);
            }

            // ============================================
            // GET CHANNEL MESSAGES TO FIND THE POST
            // ============================================
            let messages = [];
            try {
                const messagesResult = await sock.newsletterFetchMessages(channelJid, 50);
                messages = messagesResult?.messages || [];
            } catch (msgErr) {
                console.log('Fetch messages error:', msgErr.message);
            }

            if (messages.length === 0) {
                await sock.sendMessage(from, {
                    text: `❌ *Could not fetch channel messages!*\n\nTry again later.`
                });
                return;
            }

            // ============================================
            // EXTRACT MESSAGE ID FROM LINK (If present)
            // ============================================
            const messageIdMatch = postLink.match(/channel\/[a-zA-Z0-9]+\/(\d+)/);
            let targetMessage = null;

            if (messageIdMatch) {
                const targetMessageId = messageIdMatch[1];
                
                // Find the message with matching ID
                targetMessage = messages.find(m => 
                    m.key?.id === targetMessageId || 
                    m.key?.id?.includes(targetMessageId) ||
                    m.messageTimestamp?.toString() === targetMessageId
                );
            }

            // If no message ID in link, use the latest message
            if (!targetMessage && messages.length > 0) {
                targetMessage = messages[0];
            }

            if (!targetMessage) {
                await sock.sendMessage(from, {
                    text: `❌ *Could not find the post!*\n\nPlease make sure the link is correct.`
                });
                return;
            }

            // ============================================
            // SEND RANDOM REACTION
            // ============================================
            const emojis = [
                '❤️', '👍', '🔥', '👏', '😮', '😂', '🙌', '✨', '⭐', '✅',
                '🤖', '⚡', '🌟', '💯', '🌈', '💎', '👑', '🎉', '🧿', '🍀',
                '💖', '💝', '🎊', '🎈', '🌸', '🌺', '🌻', '🌹', '💐', '🏆',
                '🥇', '🎯', '💪', '🙏', '👌', '✌️', '🤝', '💫', '🌠', '🎁'
            ];

            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

            try {
                await sock.sendMessage(channelJid, {
                    react: {
                        text: randomEmoji,
                        key: targetMessage.key
                    }
                });

                // Success message
                await sock.sendMessage(from, {
                    text: `✅ *Reaction Added!*\n\n📢 *Channel:* ${channelMetadata.name || 'Unknown'}\n🎲 *Emoji:* ${randomEmoji}\n🔗 *Post:* ${postLink.substring(0, 50)}...\n\n⚡ *EVA-MINI Channel React*`
                });

                try {
                    await sock.sendMessage(from, {
                        react: {
                            text: randomEmoji,
                            key: msg.key
                        }
                    });
                } catch (e) {}

            } catch (reactErr) {
                console.error('React error:', reactErr);
                await sock.sendMessage(from, {
                    text: `❌ *Could not add reaction!*\n\nError: ${reactErr.message}`
                });
            }

        } catch (error) {
            console.error('React command error:', error);
            await sock.sendMessage(from, {
                text: `❌ *Error:* ${error.message}`
            });
        }

        // Delete status message
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            await sock.sendMessage(from, {
                delete: statusMsg.key
            });
        } catch (e) {}

    } catch (error) {
        console.error('React command error:', error);
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
