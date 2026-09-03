    async function boomCommand(sock, from, msg) {
    // Message එකේ text එක ගන්න
    const text = msg.message?.conversation ||
                 msg.message?.extendedTextMessage?.text || '';

    // .boom target,message,count කියලා parse කරන්න
    const parts = text.split(',').map(x => x?.trim());
    const target = parts[0];
    const message = parts[1];
    const countRaw = parts[2];
    const count = parseInt(countRaw) || 5;

    // Validation
    if (!target || !message || !count) {
        return await sock.sendMessage(from, {
            text: '👽 *Usage:* .boom <number>,<message>,<count>\n\nExample:\n.boom 94703945265,Hello 👋,5'
        }, { quoted: msg });
    }

    // JID format එකට හරවන්න
    const jid = `${target.replace(/[^0-9]/g, '')}@s.whatsapp.net`;

    if (count > 20) {
        return await sock.sendMessage(from, {
            text: '❌ *Limit is 20 messages per bomb.*'
        }, { quoted: msg });
    }

    // Delay function (මෙතනින්ම define කරන්න පුළුවන්, නැත්නම් utils එකෙන් import කරන්න)
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < count; i++) {
        await sock.sendMessage(jid, { text: message });
        await delay(700); // Block වීම වළක්වන්න
    }

    await sock.sendMessage(from, {
        text: `👽 Bomb sent to ${target} — ${count}x`
    }, { quoted: msg });
}

module.exports = boomCommand;
