// gcstatus command - Group Status Upload
async function gcstatusCommand(sock, chatId, message, args, isPremium, isGroup, isAdmins, groupMetadata, prefix) {
    try {
        // Premium check
        if (!isPremium) {
            return await sock.sendMessage(chatId, { 
                text: "❌ Only the bot owner can use this command." 
            }, { quoted: message });
        }

        // Group check
        if (!isGroup) {
            return await sock.sendMessage(chatId, { 
                text: "❌ This command is restricted to groups only." 
            }, { quoted: message });
        }

        // Admin check
        if (!isAdmins) {
            return await sock.sendMessage(chatId, { 
                text: "❌ You must be admin to use this command." 
            }, { quoted: message });
        }

        // Extract text and media
        const messageContent = message.message?.ephemeralMessage?.message || 
                             message.message?.viewOnceMessage?.message || 
                             message.message?.viewOnceMessageV2?.message || 
                             message.message;
        
        const text = (messageContent.conversation || 
                     messageContent.extendedTextMessage?.text || 
                     messageContent.imageMessage?.caption || 
                     messageContent.videoMessage?.caption || 
                     '').trim();
        
        // Check for quoted message
        const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let media = null;
        let mediaType = null;

        if (quotedMsg) {
            if (quotedMsg.imageMessage) {
                mediaType = 'image';
                // Download quoted image
                const imageMsg = quotedMsg.imageMessage;
                media = await sock.downloadMediaMessage({
                    message: {
                        imageMessage: imageMsg
                    }
                });
            } else if (quotedMsg.videoMessage) {
                mediaType = 'video';
                const videoMsg = quotedMsg.videoMessage;
                media = await sock.downloadMediaMessage({
                    message: {
                        videoMessage: videoMsg
                    }
                });
            } else if (quotedMsg.audioMessage) {
                mediaType = 'audio';
                const audioMsg = quotedMsg.audioMessage;
                media = await sock.downloadMediaMessage({
                    message: {
                        audioMessage: audioMsg
                    }
                });
            }
        }

        // Check if either text or media exists
        if (!media && !text) {
            return await sock.sendMessage(chatId, { 
                text: `❗ *Usage:*\n${prefix}gcstatus <text>\nOr reply to an image/video/audio with ${prefix}gcstatus <optional caption>\n\n*Example:* ${prefix}gcstatus Hello everyone!`
            }, { quoted: message });
        }

        // Get all participants
        const participants = groupMetadata.participants.map(p => p.id);

        // Send status based on type
        if (!media) {
            // Text only status
            await sock.sendMessage(chatId, {
                text: text,
                contextInfo: {
                    mentionedJid: participants,
                    isGroupStatus: true
                }
            }, {
                backgroundColor: "#000000",
                statusJidList: participants
            });
            
            return await sock.sendMessage(chatId, { 
                text: "✅ Text successfully uploaded to group status" 
            }, { quoted: message });
        }

        // Media status
        if (mediaType === 'image') {
            await sock.sendMessage(chatId, {
                image: media,
                caption: text || "",
                contextInfo: {
                    mentionedJid: participants,
                    isGroupStatus: true
                }
            }, {
                statusJidList: participants
            });
            
            return await sock.sendMessage(chatId, { 
                text: "✅ Image successfully uploaded to group status" 
            }, { quoted: message });
        }

        if (mediaType === 'video') {
            await sock.sendMessage(chatId, {
                video: media,
                caption: text || "",
                contextInfo: {
                    mentionedJid: participants,
                    isGroupStatus: true
                }
            }, {
                statusJidList: participants
            });
            
            return await sock.sendMessage(chatId, { 
                text: "✅ Video successfully uploaded to group status" 
            }, { quoted: message });
        }

        if (mediaType === 'audio') {
            await sock.sendMessage(chatId, {
                audio: media,
                mimetype: "audio/mp4",
                ptt: false,
                contextInfo: {
                    mentionedJid: participants,
                    isGroupStatus: true
                }
            }, {
                statusJidList: participants
            });
            
            return await sock.sendMessage(chatId, { 
                text: "✅ Audio successfully uploaded to group status" 
            }, { quoted: message });
        }

    } catch (error) {
        console.error('Group Status error:', error);
        await sock.sendMessage(chatId, { 
            text: "❌ Error uploading group status." 
        }, { quoted: message });
    }
}

module.exports = gcstatusCommand;
