// commands/sendtochannel.js - Channel එකට පණිවිඩ යැවීමට

case 'sendchannel':
case 'sch': {
  if (!isPremium) {
    return reply('❌ Only the bot owner can use this command.');
  }

  // Format: .sendchannel <jid> <message>
  const args = text.split(' ');
  if (args.length < 2) {
    return reply(
      `❗ *Usage:*\n${prefix}sendchannel <channel_jid> <message>\n\n` +
      `*Example:*\n${prefix}sendchannel 123456789@newsletter Hello Channel!\n\n` +
      `💡 *First use ${prefix}getchannel to get the JID*`
    );
  }

  const channelJid = args[0];
  const message = args.slice(1).join(' ');

  // Ensure it has @newsletter suffix
  let finalJid = channelJid;
  if (!finalJid.includes('@newsletter')) {
    finalJid = `${finalJid}@newsletter`;
  }

  try {
    await client.sendMessage(finalJid, message);
    return reply(`✅ *Message sent to channel:*\n📌 ${finalJid}\n📝 ${message}`);
  } catch (error) {
    console.error('Error sending to channel:', error);
    return reply(
      `❌ *Error sending message:*\n${error.message}\n\n` +
      `💡 *Verify the channel JID is correct:*\n${finalJid}`
    );
  }
}
break;
