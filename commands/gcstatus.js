const { downloadMediaMessage } = require('@whiskeysockets/baileys');

async function gcstatusCommand(sock, chatId, message, isGroup, isAdmin, isOwner) {
    try {
        // Owner Check
        if (!isOwner) {
            await sock.sendMessage(chatId, { text: '❌ Only the bot owner can use this command.' }, { quoted: message });
            return;
        }

        // Group Check
        if (!isGroup) {
            await sock.sendMessage(chatId, { text: '❌ This command is restricted to groups only.' }, { quoted: message });
            return;
        }

        // Admin Check
        if (!isAdmin) {
            await sock.sendMessage(chatId, { text: '❌ You must be an admin to use this command.' }, { quoted: message });
            return;
        }

        // Extract Message Content & Text
        const messageContent = message.message?.ephemeralMessage?.message || message.message?.viewOnceMessage?.message || message.message?.viewOnceMessageV2?.message || message.message;
        const text = (messageContent.conversation || messageContent.extendedTextMessage?.text || messageContent.imageMessage?.caption || messageContent.videoMessage?.caption || '').replace(/^\.(gcstatus|groupstatus|togstatus)\s*/i, '').trim();

        // Get Quoted Message
        const quotedMsg = messageContent?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        let media = null;
        let type = null;

        if (quotedMsg) {
            const quotedType = Object.keys(quotedMsg)[0];
            if (/imageMessage/i.test(quotedType)) {
                type = "image";
            } else if (/videoMessage/i.test(quotedType)) {
                type = "video";
            } else if (/audioMessage/i.test(quotedType)) {
                type = "audio";
            }

            if (type) {
                // Download Media from Quoted Message
                media = await downloadMediaMessage(
                    { message: quotedMsg },
                    'buffer',
                    {}
                );
            }
        }

        if (!media && !text) {
            await sock.sendMessage(chatId, { 
                text: `❗ *Usage:*\n.gcstatus <text>\nOr reply to an image/video/audio with .gcstatus <optional caption>\n\n*Example:* .gcstatus Hello everyone!` 
            }, { quoted: message });
            return;
        }

        // Get Group Participants
        const groupMetadata = await sock.groupMetadata(chatId);
        const peserta = groupMetadata.participants.map(v => v.id);

        // Send Status to Group Status JID
        const statusJid = 'status@broadcast';

        // Upload Text Status
        if (!media) {
            await sock.sendMessage(statusJid, {
                text: text || "undefined",
                contextInfo: {
                    mentionedJid: peserta,
                    isGroupStatus: true
                }
            }, {
                backgroundColor: "#000000",
                statusJidList: peserta
            });

            await sock.sendMessage(chatId, { text: '✅ Text successfully uploaded to group status' }, { quoted: message });
            return;
        }

        // Upload Image Status
        if (type === "image") {
            await sock.sendMessage(statusJid, {
                image: media,
                caption: text || "",
                contextInfo: {
                    mentionedJid: peserta,
                    isGroupStatus: true
                }
            }, {
                statusJidList: peserta
            });
            await sock.sendMessage(chatId, { text: '✅ Image successfully uploaded to group status' }, { quoted: message });
            return;
        }

        // Upload Video Status
        if (type === "video") {
            await sock.sendMessage(statusJid, {
                video: media,
                caption: text || "",
                contextInfo: {
                    mentionedJid: peserta,
                    isGroupStatus: true
                }
            }, {
                statusJidList: peserta
            });
            await sock.sendMessage(chatId, { text: '✅ Video successfully uploaded to group status' }, { quoted: message });
            return;
        }

        // Upload Audio Status
        if (type === "audio") {
            await sock.sendMessage(statusJid, {
                audio: media,
                mimetype: "audio/mp4",
                ptt: false,
                contextInfo: {
                    mentionedJid: peserta,
                    isGroupStatus: true
                }
            }, {
                statusJidList: peserta
            });
            await sock.sendMessage(chatId, { text: '✅ Audio successfully uploaded to group status' }, { quoted: message });
            return;
        }

    } catch (err) {
        console.error('GCStatus command error:', err);
        await sock.sendMessage(chatId, { text: `❌ Error: ${err.message}` }, { quoted: message });
    }
}

module.exports = gcstatusCommand;
