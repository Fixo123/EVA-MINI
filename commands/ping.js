module.exports = async function(sock, from, msg) {
    const initial = Date.now(); // start time

    // Send initial message
    let pingMsg = await sock.sendMessage(from, { text: '*_Pinging to Module..._* ❗' }, { quoted: msg });

    // Progress updates (editing the same message)
    await sock.sendMessage(from, { text: '《 █▒▒▒▒▒▒▒▒▒▒▒》10%', edit: pingMsg.key });
    await sock.sendMessage(from, { text: '《 ████▒▒▒▒▒▒▒▒》30%', edit: pingMsg.key });
    await sock.sendMessage(from, { text: '《 ███████▒▒▒▒▒》50%', edit: pingMsg.key });
    await sock.sendMessage(from, { text: '《 ██████████▒▒》80%', edit: pingMsg.key });
    await sock.sendMessage(from, { text: '《 ████████████》100%', edit: pingMsg.key });

    const final = Date.now(); // end time
    const latency = final - initial;

    // Final result with ping time
    await sock.sendMessage(from, {
        text: `❗ *Pong ${latency} Ms*`,
        edit: pingMsg.key
    });
};
