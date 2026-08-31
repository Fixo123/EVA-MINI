// Nima Family Free Bot - Alive Plugin

module.exports = {
    command: 'alive',
    description: 'Check bot online status and uptime',
    category: 'main',
    async execute(socket, msg, args, { sender, number, config, formatMessage, socketCreationTime }) {
        try {
            // Uptime එක ගණනය කිරීම
            const startTime = socketCreationTime.get(number) || Date.now();
            const uptime = Math.floor((Date.now() - startTime) / 1000);
            const hours = String(Math.floor(uptime / 3600)).padStart(2, '0');
            const minutes = String(Math.floor((uptime % 3600) / 60)).padStart(2, '0');
            const seconds = String(Math.floor(uptime % 60)).padStart(2, '0');

            // පණිවිඩයේ මාතෘකාව සහ අන්තර්ගතය (Uptime එකද එකතු කර ඇත)
            const title = '*ɴɪᴍᴀ ꜰᴀᴍɪʟʏ ꜰʀᴇᴇ ʙᴏᴛ 🔥*';
            const content = `*⏳ ᴜᴘᴛɪᴍᴇ :-* ${hours}:${minutes}:${seconds}\n\n` +
                           `*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʟᴏᴋᴜ ɴɪᴍᴀ 🔥*\n` + 
                           `*ʙᴏᴛ ᴏᴡɴᴇʀ :- ʟᴏᴋᴜ ɴɪᴍᴀ*\n` +
                           `*ᴏᴡɴᴇʀ ɴᴜᴍʙᴇʀ :- 94760743488*\n` +
                           `*ᴅᴇᴘʟᴏʏ ᴍɪɴɪ ꜱɪᴛᴇ 👇*\n` +
                           `> https://nima-family-bot-web.vercel.app/`;
            
            const footer = config.BOT_FOOTER || 'Nima Family Bot';

            // පින්තූරය සහ බටන් සමඟ පණිවිඩය යැවීම
            await socket.sendMessage(sender, {
                image: { url: config.BUTTON_IMAGES.ALIVE },
                caption: formatMessage(title, content, footer),
                buttons: [
                    { buttonId: `${config.PREFIX}menu`, buttonText: { displayText: 'MENU' }, type: 1 },
                    { buttonId: `${config.PREFIX}ping`, buttonText: { displayText: 'PING' }, type: 1 }
                ],
                headerType: 4
            }, { quoted: msg });

        } catch (error) {
            console.error('Error in alive plugin:', error);
            await socket.sendMessage(sender, { text: 'An error occurred while running the alive command.' }, { quoted: msg });
        }
    }
};

