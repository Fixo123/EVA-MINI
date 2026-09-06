module.exports = async function(sock, from, msg) {
    const initial = Date.now();

    // මුල් පණිවිඩය
    let pingMsg = await sock.sendMessage(from, { text: '*_Pinging to Module..._* ❗' }, { quoted: msg });

    // ප්‍රගති තීරුව (edit කිරීම)
    await sock.sendMessage(from, { text: '《 █▒▒▒▒▒▒▒▒▒▒▒》10%', edit: pingMsg.key });
    await sock.sendMessage(from, { text: '《 ████▒▒▒▒▒▒▒▒》30%', edit: pingMsg.key });
    await sock.sendMessage(from, { text: '《 ███████▒▒▒▒▒》50%', edit: pingMsg.key });
    await sock.sendMessage(from, { text: '《 ██████████▒▒》80%', edit: pingMsg.key });
    await sock.sendMessage(from, { text: '《 ████████████》100%', edit: pingMsg.key });

    const final = Date.now();
    const latency = final - initial;

    // අවසාන ප්‍රතිඵලය + Button(s)
    await sock.sendMessage(from, {
        text: `❗ *Pong ${latency} Ms*`,
        buttons: [
            {
                buttonId: `${config.PREFIX}menu`, // හෝ 'menu' ලෙස
                buttonText: { displayText: '📋 Main Menu' },
                type: 1
            },
            {
                buttonId: `${config.PREFIX}ping`, // නැවත ping කිරීමට
                buttonText: { displayText: '🔄 Ping Again' },
                type: 1
            }
        ],
        edit: pingMsg.key // පෙර පණිවිඩයම edit කර buttons එකතු කරයි
    });
};
