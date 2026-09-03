const axios = require('axios');

async function fbCommand(sock, from, msg, args) {
    const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });

    const fbUrl = args.join(" ");
    if (!fbUrl) {
        return reply('*𝐏ℓєαʂє 𝐏ɼ๏νιɖє 𝐀 fb҇ 𝐕ιɖє๏ ๏ɼ ɼєєℓ 𝐔ɼℓ..*');
    }

    try {
        const apiKey = 'e276311658d835109c';
        const apiUrl = `https://api.nexoracle.com/downloader/facebook?apikey=${apiKey}&url=${encodeURIComponent(fbUrl)}`;
        const response = await axios.get(apiUrl);

        if (!response.data || !response.data.result || !response.data.result.sd) {
            return reply('*❌ Invalid or unsupported Facebook video URL.*');
        }

        const { title, desc, sd } = response.data.result;

        await sock.sendMessage(from, {
            video: { url: sd },
            caption: `*❒📥 ɴɪᴍᴀ ꜰᴀᴍɪʟʏ ꜰʀᴇᴇ ʙᴏᴛ ꜰʙ ᴠɪᴅᴇᴏ 📥❒*\n📌 *Title:* ${title || 'N/A'}\n📝 *Desc:* ${desc || 'N/A'}`
        }, { quoted: msg });

    } catch (error) {
        console.error('Error downloading Facebook video:', error);
        reply('❌ Unable to download the Facebook video. Please try again later.');
    }
}

module.exports = fbCommand;
