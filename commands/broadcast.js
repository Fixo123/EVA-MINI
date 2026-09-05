
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '📢',
                    key: msg.key
                }
            });
        } catch (e) {}

        // ============================================
        // ADMIN CHECK
        // ============================================
        const sender = msg.key.participant || from;
        const botNumber = jidNormalizedUser(sock.user.id);
        const isOwner = sender.includes(botNumber.split('@')[0]) || msg.key.fromMe;
        
        let isAdmin = isOwner;
        if (!isAdmin && from.endsWith('@g.us')) {
            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participant = groupMetadata.participants.find(p => p.id === sender);
                isAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
            } catch (e) {
                isAdmin = false;
            }
        }

        if (!isAdmin) {
            await sock.sendMessage(from, {
                text: "❌ *Only admins/owner can use this command!*"
            });
            return;
        }

        // ============================================
        // CHECK MESSAGE
        // ============================================
        const q = args.join(' ').trim();
        if (!q) {
            await sock.sendMessage(from, {
                text: `📢 *Mass Message Broadcaster*\n\n📌 *Usage:* .broadcast [message]\n\n📝 *Example:* .broadcast Hello everyone!\n\n📢 *Send message to all group members!*`
            });
            return;
        }

        // ============================================
        // GET GROUP PARTICIPANTS
        // ============================================
        if (!from.endsWith('@g.us')) {
            await sock.sendMessage(from, {
                text: "❌ *This command only works in groups!*"
            });
            return;
        }

        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const botJid = jidNormalizedUser(sock.user.id);

        // Filter out bot and admins
        const targets = participants
            .filter(p => p.id !== botJid)
            .filter(p => p.admin !== 'admin' && p.admin !== 'superadmin')
            .map(p => p.id);

        if (targets.length === 0) {
            await sock.sendMessage(from, {
                text: "⚠️ *No targets found!*"
            });
            return;
        }

        // ============================================
        // STATUS MESSAGE
        // ============================================
        const statusMsg = await sock.sendMessage(from, {
            text: `📢 *Broadcasting to ${targets.length} members...*\n\n⏳ Please wait...`
        });

        // ============================================
        // SEND BROADCAST
        // ============================================
        let sent = 0;
        let failed = 0;

        for (const target of targets) {
            try {
                await sock.sendMessage(target, {
                    text: `📢 *Broadcast Message*\n\n${q}\n\n> 🤖 *EVA-MINI Bot*`
                });
                sent++;
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (e) {
                failed++;
                console.log(`Failed to send to ${target}:`, e.message);
            }
        }

        // ============================================
        // SUCCESS MESSAGE
        // ============================================
        await sock.sendMessage(from, {
            text: `✅ *Broadcast Complete!*\n\n📨 *Sent:* ${sent}\n❌ *Failed:* ${failed}\n📊 *Total:* ${targets.length}\n\n📝 *Message:* ${q.substring(0, 50)}${q.length > 50 ? '...' : ''}`
        });

        // ============================================
        // DELETE STATUS MESSAGE
        // ============================================
        try {
            await new Promise(resolve => setTimeout(resolve, 3000));
            await sock.sendMessage(from, {
                delete: statusMsg.key
            });
        } catch (e) {}

    } catch (error) {
        console.error('Broadcast error:', error);
        await sock.sendMessage(from, {
            text: `❌ *Error:* ${error.message}`
        });
    }
};
