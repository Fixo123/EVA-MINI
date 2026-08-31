const getChannelJid = (channelId) => {
    const cleanId = channelId.replace(/[^0-9]/g, '');
    return `${cleanId}@newsletter`;
};

module.exports = async (sock, from, msg, args) => {
    try {
        const input = args.join(' ').trim();
        const quotedText = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || 
                           msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text;

        const targetText = input || quotedText;

        if (!targetText) {
            return await sock.sendMessage(from, { 
                text: "❗ *Usage:*\n.jid <Channel Link or Channel ID>\nOr reply to a channel link/ID with .jid\n\n*Example:* .jid https://whatsapp.com/channel/0029VaXXXXX" 
            }, { quoted: msg });
        }

        let channelId = targetText;
        if (targetText.includes('whatsapp.com/channel/')) {
            channelId = targetText.split('whatsapp.com/channel/')[1].split('/')[0].split('?')[0];
        }

        const channelJid = getChannelJid(channelId);

        const responseText = 
`📢 *CHANNEL JID FINDER*

📌 *Input:* ${channelId}
🆔 *Channel JID:* \`${channelJid}\`

> *POWERED BY FIXO DEV* ✨`;

        await sock.sendMessage(from, { text: responseText }, { quoted: msg });

    } catch (error) {
        console.error('JID Command Error:', error);
        await sock.sendMessage(from, { text: '❌ Failed to extract Channel JID!' }, { quoted: msg });
    }
};
