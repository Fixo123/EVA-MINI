const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, isAdmin, args, isOwner) => {
    // 1. Validation Checks
    if (!isOwner) {
        return await sock.sendMessage(from, { text: '❌ Only the bot owner can use this command.' }, { quoted: msg });
    }
    if (!from.endsWith('@g.us')) {
        return await sock.sendMessage(from, { text: '❌ This command is restricted to groups only.' }, { quoted: msg });
    }
    if (!isAdmin) {
        return await sock.sendMessage(from, { text: '❌ You must be an admin to use this command.' }, { quoted: msg });
    }

    try {
        const text = args.join(' ');
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let media = null;
        let type = null;

        // 2. Check Quoted Media
        if (quoted) {
            if (quoted.imageMessage) {
                type = 'image';
                media = await downloadMediaMessage({ message: quoted }, 'buffer', {});
            } else if (quoted.videoMessage) {
                type = 'video';
                media = await downloadMediaMessage({ message: quoted }, 'buffer', {});
            } else if (quoted.audioMessage) {
                type = 'audio';
                media = await downloadMediaMessage({ message: quoted }, 'buffer', {});
            }
        }

        const captionText = text || quoted?.conversation || quoted?.extendedTextMessage?.text || '';

        if (!media && !captionText) {
            return await sock.sendMessage(from, { 
                text: `❗ *Usage:*\n.gcstatus <text>\nOr reply to an image/video/audio with .gcstatus <optional caption>\n\n*Example:* .gcstatus Hello everyone!` 
            }, { quoted: msg });
        }

        // 3. Fetch Group Participants
        const groupMetadata = await sock.groupMetadata(from);
        const peserta = groupMetadata.participants.map(v => v.id);

        // 4. Send Group Status Content
        if (!media) {
            await sock.sendMessage(from, {
                text: captionText,
                contextInfo: {
                    mentionedJid: peserta,
                    isGroupStatus: true
                }
            }, {
                backgroundColor: "#000000",
                statusJidList: peserta
            });
            return await sock.sendMessage(from, { text: '✅ Text successfully uploaded to group status.' }, { quoted: msg });
        }

        if (type === 'image') {
            await sock.sendMessage(from, {
                image: media,
                caption: captionText,
                contextInfo: {
                    mentionedJid: peserta,
                    isGroupStatus: true
                }
            }, {
                statusJidList: peserta
            });
            return await sock.sendMessage(from, { text: '✅ Image successfully uploaded to group status.' }, { quoted: msg });
        }

        if (type === 'video') {
            await sock.sendMessage(from, {
                video: media,
                caption: captionText,
                contextInfo: {
                    mentionedJid: peserta,
                    isGroupStatus: true
                }
            }, {
                statusJidList: peserta
            });
            return await sock.sendMessage(from, { text: '✅ Video successfully uploaded to group status.' }, { quoted: msg });
        }

        if (type === 'audio') {
            await sock.sendMessage(from, {
                audio: media,
                mimetype: 'audio/mp4',
                ptt: false,
                contextInfo: {
                    mentionedJid: peserta,
                    isGroupStatus: true
                }
            }, {
                statusJidList: peserta
            });
            return await sock.sendMessage(from, { text: '✅ Audio successfully uploaded to group status.' }, { quoted: msg });
        }

    } catch (error) {
        console.error('GC Status Command Error:', error);
        await sock.sendMessage(from, { text: '❌ Failed to upload group status: ' + error.message }, { quoted: msg });
    }
};
