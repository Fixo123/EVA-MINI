const { jidNormalizedUser } = require('@whiskeysockets/baileys');

// Simple text font styler
const toBold = (text) => {
    const boldChars = {
        'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
        '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
    };
    return text.split('').map(c => boldChars[c] || c).join('');
};

module.exports = async (sock, from, msg, sessionData) => {
    try {
        const pushName = msg.pushName || 'Friend';
        const botNumber = jidNormalizedUser(sock.user.id);
        const aliveImageUrl = 'https://files.catbox.moe/0z9js9.jpg'; // ඔබට අවශ්‍ය වෙනත් image link එකක් වුවද යොදාගත හැක

        const aliveText = 
`Heyyy ${pushName} 👋💗

I'm ${toBold("EVA MINI BOT")} and I'm active right now! ✨

🌸 ${toBold("Status:")} Online & Ready! ⚡
🌸 ${toBold("Owner:")} FIXO DEV
🌸 ${toBold("Mode:")} ${sessionData.isPublic ? 'Public 🌍' : 'Private 🔐'}
🌸 ${toBold("Prefix:")} Multi-Prefix [.]

Don't worry, I'm always here to help you out! 💖 
Type ${toBold(".menu")} to check out all my features~ 🥰

> ${toBold("POWERED BY FIXO DEV")} ✨`;

        await sock.sendMessage(from, {
            image: { url: aliveImageUrl },
            caption: aliveText,
            contextInfo: {
                externalAdReply: {
                    title: "🌸 EVA MINI-BOT IS ONLINE 💕",
                    body: "Click here to main hub ⚡",
                    mediaType: 1,
                    thumbnailUrl: aliveImageUrl,
                    sourceUrl: "https://eva-mini.onrender.com/",
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: msg });

    } catch (error) {
        console.error('Alive Command Error:', error);
        await sock.sendMessage(from, { text: '❌ Failed to fetch Alive Status!' }, { quoted: msg });
    }
};
