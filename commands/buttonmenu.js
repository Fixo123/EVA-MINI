// commands/buttonmenu.js - LIST MENU VERSION (Works on WhatsApp Web)
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
        // SEND LIST MESSAGE (Works everywhere)
        // ============================================
        const listMessage = {
            text: `🔘 *EVA MINI INTERACTIVE MENU*

👋 *Hello ${msg.pushName || 'User'}!*

📌 *Select an option from the menu below:*`,
            footer: '🔘 EVA MINI Menu',
            buttonText: '📋 Open Menu',
            sections: [
                {
                    title: '🎵 Music & Video',
                    rows: [
                        {
                            title: '🎵 Search for a song',
                            rowId: 'menu_song',
                            description: 'Find your favorite songs'
                        },
                        {
                            title: '🎬 Search for a video',
                            rowId: 'menu_video',
                            description: 'Find videos online'
                        },
                        {
                            title: '📥 Download YouTube video',
                            rowId: 'menu_yt',
                            description: 'Download from YouTube'
                        }
                    ]
                },
                {
                    title: '🤖 AI & Movies',
                    rows: [
                        {
                            title: '🤖 Chat with AI',
                            rowId: 'menu_ai',
                            description: 'Ask anything to AI'
                        },
                        {
                            title: '🎬 Search for a movie',
                            rowId: 'menu_movie',
                            description: 'Find movies with subtitles'
                        }
                    ]
                },
                {
                    title: '📚 Help & Support',
                    rows: [
                        {
                            title: '📚 Get help',
                            rowId: 'menu_help',
                            description: 'Get assistance'
                        },
                        {
                            title: '📋 Full Menu',
                            rowId: 'menu_full',
                            description: 'See all commands'
                        }
                    ]
                }
            ]
        };

        try {
            await sock.sendMessage(from, listMessage);
        } catch (error) {
            console.log('List message failed:', error.message);
            // Fallback: Send normal text
            await sock.sendMessage(from, {
                text: `🔘 *EVA MINI MENU*

👋 Hello ${msg.pushName || 'User'}!

📌 *Commands:*

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
