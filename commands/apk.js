// commands/apk.js
const axios = require('axios');

module.exports = async function apkCommand(sock, from, msg) {
    // භාවිතා කරන්නාගේ පණිවිඩයෙන් query එක ලබා ගන්න
    const q = msg.message?.conversation || 
              msg.message?.extendedTextMessage?.text || 
              msg.message?.imageMessage?.caption || 
              msg.message?.videoMessage?.caption || '';

    const query = q.trim();

    // app නමක් නැතිනම් error පණිවිඩය
    if (!query) {
        await sock.sendMessage(from, {
            text: "🔍 *කරුණාකර app එකේ නම ඇතුළත් කරන්න.*\n\n_උදා:_\n.apk Instagram"
        }, { quoted: msg });
        return;
    }

    try {
        // loading react
        await sock.sendMessage(from, { react: { text: "⬇️", key: msg.key } });

        const apiUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(query)}/limit=1`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data.datalist || !data.datalist.list || !data.datalist.list.length) {
            await sock.sendMessage(from, {
                text: "❌ *ඔබගේ සෙවීමට ගැලපෙන APK එකක් හමු නොවීය.*"
            }, { quoted: msg });
            return;
        }

        const app = data.datalist.list[0];
        const sizeMB = (app.size / (1024 * 1024)).toFixed(2);

        const caption = `
🎮 *App Name:* ${app.name}
📦 *Package:* ${app.package}
📅 *Last Updated:* ${app.updated}
📁 *Size:* ${sizeMB} MB

> > ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴍᴀ ꜰᴀᴍɪʟʏ ʙᴏᴛ 🔥
        `.trim();

        // upload react
        await sock.sendMessage(from, { react: { text: "⬆️", key: msg.key } });

        await sock.sendMessage(from, {
            document: { url: app.file.path_alt },
            fileName: `${app.name}.apk`,
            mimetype: 'application/vnd.android.package-archive',
            caption,
            contextInfo: {
                externalAdReply: {
                    title: app.name,
                    body: "Download via",
                    mediaType: 1,
                    sourceUrl: app.file.path_alt,
                    thumbnailUrl: app.icon,
                    renderLargerThumbnail: true,
                    showAdAttribution: true
                }
            }
        }, { quoted: msg });

        // success react
        await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

    } catch (e) {
        console.error(e);
        await sock.sendMessage(from, {
            text: "❌ *APK බාගත කිරීමේදී දෝෂයක් ඇති විය.*\n\n_" + e.message + "_"
        }, { quoted: msg });
    }
};
