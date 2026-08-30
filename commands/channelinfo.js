// commands/channelinfo.js - Channel එක ගැන විස්තර ලබා ගැනීමට

case 'channelinfo':
case 'cinfo': {
  if (!isPremium) {
    return reply('❌ Only the bot owner can use this command.');
  }

  let channelJid = text || m.quoted?.text || '';
  
  if (!channelJid) {
    return reply(
      `❗ *Usage:*\n${prefix}channelinfo <channel_jid>\n\n` +
      `*Example:*\n${prefix}channelinfo 123456789@newsletter\n\n` +
      `💡 *First use ${prefix}getchannel to get the JID*`
    );
  }

  // Ensure it has @newsletter suffix
  if (!channelJid.includes('@newsletter')) {
    channelJid = `${channelJid}@newsletter`;
  }

  try {
    const channel = await client.getChatById(channelJid);
    
    if (channel) {
      let info = `📢 *Channel Information*\n\n`;
      info += `📌 *JID:* ${channelJid}\n`;
      info += `📱 *Name:* ${channel.name || 'Unknown'}\n`;
      info += `👥 *Subscribers:* ${channel.participants?.length || 'Unknown'}\n`;
      info += `📝 *Description:* ${channel.description || 'No description'}\n`;
      info += `📅 *Created:* ${channel.createdAt || 'Unknown'}\n`;
      info += `🔒 *Type:* ${channel.isGroup ? 'Group' : 'Channel'}\n`;
      
      if (channel.participants && channel.participants.length > 0) {
        info += `\n👤 *Sample Subscribers:*\n`;
        const sample = channel.participants.slice(0, 5);
        sample.forEach((p, i) => {
          info += `${i+1}. ${p.id._serialized || p.id || 'Unknown'}\n`;
        });
        if (channel.participants.length > 5) {
          info += `... and ${channel.participants.length - 5} more\n`;
        }
      }
      
      return reply(info);
    } else {
      return reply(`❌ Channel not found: ${channelJid}`);
    }
  } catch (error) {
    console.error('Error getting channel info:', error);
    return reply(
      `❌ *Error getting channel info:*\n` +
      `${error.message}\n\n` +
      `💡 *Make sure the JID is correct:*\n` +
      `Format: 123456789@newsletter`
    );
  }
}
break;
