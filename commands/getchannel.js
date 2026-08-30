// commands/getchannel.js හෝ ඔබගේ පවතින commands file එකට එකතු කරන්න

case 'getchannel':
case 'channeljid':
case 'getjid': {
  // Only bot owner can use this command
  if (!isPremium) {
    return reply('❌ Only the bot owner can use this command.');
  }

  // Get channel link or ID from text
  let channelInput = text || m.quoted?.text || '';
  
  if (!channelInput) {
    return reply(
      `❗ *Usage:*\n${prefix}getchannel <channel_link_or_id>\n\n` +
      `*Example:*\n` +
      `${prefix}getchannel https://whatsapp.com/channel/123456789\n` +
      `${prefix}getchannel 123456789\n\n` +
      `*Note:* You can also reply to a message with the channel link.`
    );
  }

  try {
    // Extract channel ID from link if it's a URL
    let channelId = channelInput;
    if (channelInput.includes('whatsapp.com/channel/')) {
      const match = channelInput.match(/whatsapp\.com\/channel\/([^\/\s]+)/);
      if (match) {
        channelId = match[1];
      }
    }

    // Try to get channel info
    const channelJid = `${channelId}@newsletter`;
    
    // Check if channel exists by trying to get info
    try {
      // Attempt to get channel metadata
      const channelInfo = await client.getChatById(channelJid);
      
      if (channelInfo) {
        let response = `✅ *Channel Information Found!*\n\n`;
        response += `📌 *Channel JID:* ${channelJid}\n`;
        response += `🔗 *Channel ID:* ${channelId}\n`;
        response += `📱 *Channel Name:* ${channelInfo.name || 'Unknown'}\n`;
        response += `👥 *Subscribers:* ${channelInfo.participants?.length || 'Unknown'}\n`;
        response += `📅 *Created:* ${channelInfo.createdAt || 'Unknown'}\n\n`;
        response += `💡 *Use this JID for further operations:*\n`;
        response += `\`${channelJid}\``;
        
        return reply(response);
      }
    } catch (error) {
      // If channel not found, still return the JID
      return reply(
        `⚠️ *Channel not found or inaccessible*\n\n` +
        `📌 *Generated JID:* ${channelJid}\n` +
        `🔗 *Channel ID:* ${channelId}\n\n` +
        `💡 *You can still use this JID for operations:*\n` +
        `\`${channelJid}\``
      );
    }

  } catch (error) {
    console.error('Error getting channel JID:', error);
    return reply(
      `❌ *Error getting channel JID:*\n` +
      `${error.message}\n\n` +
      `💡 *Try using the channel ID directly:*\n` +
      `${prefix}getchannel 123456789`
    );
  }
}
break;
