const axios = require('axios');

async function fbCommand(sock, from, msg, args) {
    const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });

    const fbUrl = args.join(" ");
    if (!fbUrl) {
        return reply('*𝐏ℓєαʂє 𝐏ɼ๏νιɖє 𝐀 fb҇ 𝐕ιɖє๏ ๏ɼ ɼєєℓ 𝐔ɼℓ..*');
    }

    try {
        // 🌐 නොමිලේ සහ API key නැති SiputZx API එක (හොඳින් වැඩ කරයි)
        const apiUrl = `https://api.siputzx.my.id/api/d/fb?url=${encodeURIComponent(fbUrl)}`;
        const response = await axios.get(apiUrl, { timeout: 20000 });

        // 📦 ප්‍රතිචාරයේ විවිධ keys check කිරීම (HD, SD, හෝ URL)
        const result = response.data?.data || response.data?.result || response.data;
        
        // වීඩියෝ ලින්ක් එක හොයාගැනීම (විවිධ API ව්‍යුහයන්ට ඔරොත්තු දෙන ලෙස)
        const videoUrl = result?.hd || result?.sd || result?.url || result?.downloadUrl || result?.video;
        const title = result?.title || 'Facebook Video';
        const description = result?.description || '';

        // ❌ වීඩියෝ ලින්ක් එක හමු නොවුනොත්
        if (!videoUrl) {
            console.log('API Response:', JSON.stringify(response.data, null, 2)); // Debug එකට
            return reply('*❌ මෙම FB ලින්ක් එකෙන් වීඩියෝව හොයාගන්න බැරි වුණා. ලින්ක් එක හරිද කියලා බලන්න.*');
        }

        // 📤 වීඩියෝව යැවීම
        await sock.sendMessage(from, {
            video: { url: videoUrl },
            caption: `*❒📥 ɴɪᴍᴀ ꜰᴀᴍɪʟʏ ꜰʀᴇᴇ ʙᴏᴛ ꜰʙ ᴠɪᴅᴇᴏ 📥❒*\n\n📌 *Title:* ${title}\n📝 *Desc:* ${description || 'N/A'}\n\n⚡ *Powered by EVA-MINI*`
        }, { quoted: msg });

    } catch (error) {
        console.error('FB Download Error:', error.message);
        // Network error එකක් නම් වෙනම message එකක්
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            reply('⏳ *Request Timeout:* සර්වරයට සම්බන්ධ වෙන්න වැඩි වෙලා ගියා. නැවත උත්සාහ කරන්න.');
        } else {
            reply('❌ දැනට FB වීඩියෝව ගේන්න බැරි වුණා. ටික වේලාවකින් නැවත උත්සාහ කරන්න.');
        }
    }
}

module.exports = fbCommand;
