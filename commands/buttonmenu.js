// commands/buttonmenu.js - Interactive Button Menu
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '🔘',
                    key: msg.key
                }
            });
        } catch (e) {}

        // ============================================
        // SEND BUTTON MESSAGE
        // ============================================
        const buttonMessage = {
            text: `🔘 *EVA MINI INTERACTIVE MENU*

👋 *Hello ${msg.pushName || 'User'}!*

📌 *Button Menu Options:*

• 🎵 *Search for a song*
• 🎬 *Search for a video*
• 📥 *Download YouTube video*
• 🤖 *Chat with AI*
• 🎬 *Search for a movie*
• 📚 *Get help*

_Press the button you need_ 👇`,
            footer: '🔘 EVA MINI Interactive Menu',
            buttons: [
                {
                    buttonId: 'menu_song',
                    buttonText: { displayText: '🎵 Song' },
                    type: 1
                },
                {
                    buttonId: 'menu_video',
                    buttonText: { displayText: '🎬 Video' },
                    type: 1
                },
                {
                    buttonId: 'menu_yt',
                    buttonText: { displayText: '📥 YouTube' },
                    type: 1
                },
                {
                    buttonId: 'menu_ai',
                    buttonText: { displayText: '🤖 AI Chat' },
                    type: 1
                }
            ],
            headerType: 1
        };

        try {
            await sock.sendMessage(from, buttonMessage);
        } catch (error) {
            console.log('Button message failed, sending normal text:', error.message);
            await sock.sendMessage(from, {
                text: `🔘 *EVA MINI INTERACTIVE MENU*

👋 Hello ${msg.pushName || 'User'}!

Your browser doesn't support buttons.
Please use these commands:

🎵 .song [song name] - Search for a song
🎬 .video [video name] - Search for a video
📥 .yt [URL] - Download YouTube video
🤖 .ai [question] - Chat with AI
🎬 .movie [movie name] - Search for a movie
📚 .menu - Full menu`
            });
        }

        // ============================================
        // REACTION - SUCCESS
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '✅',
                    key: msg.key
                }
            });
        } catch (e) {}

    } catch (error) {
        console.error('Button menu error:', error);
        await sock.sendMessage(from, {
            text: `❌ *Error:* ${error.message}`
        });
    }
};
