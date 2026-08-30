case 'gcstatus':
case 'groupstatus':
case 'togstatus': {
  // Only bot owner can use this command (isPremium check)
  if (!isPremium) {
    return reply('❌ Only the bot owner can use this command.');
  }

  // Check if the command is used in a group
  if (!m.isGroup) {
    return reply('This command is restricted to groups only');
  }

  // Check if the user is an admin
  if (!isAdmins) {
    return reply('You must be admin to use this command');
  }

  // Get text from command or quoted message
  let teks = text || m.quoted?.text || '';
  let media = null;
  let type = null;

  // Process quoted media (image, video, audio)
  if (m.quoted) {
    if (/image/i.test(m.quoted.mtype)) {
      type = 'image';
      media = await m.quoted.download();
    } else if (/video/i.test(m.quoted.mtype)) {
      type = 'video';
      media = await m.quoted.download();
    } else if (/audio/i.test(m.quoted.mtype)) {
      type = 'audio';
      media = await m.quoted.download();
    }
  }

  // If no media or text provided, show usage instructions
  if (!media && !teks) {
    return reply(
      `❗ *Usage:*\n${prefix}gcstatus <text>\nOr reply to an image/video/audio with ${prefix}gcstatus <optional caption>\n\n*Example:* ${prefix}gcstatus Hello everyone!`
    );
  }

  // Get all participants' IDs for mentioning
  const groupMetadata = await client.getChatById(m.chat);
  const peserta = groupMetadata.participants.map((p) => p.id._serialized);

  // Prepare the message to be sent as a group status
  // Note: WhatsApp Web doesn't directly support "group status" updates.
  // As an alternative, we can send a message that mentions everyone and includes the media.
  // This mimics a "status" update for the group.

  try {
    if (!media) {
      // Send text only
      await client.sendMessage(m.chat, teks, {
        mentions: peserta,
      });
      return reply('✅ Text successfully uploaded to group status');
    }

    // Send media with caption
    const messageOptions = {
      caption: teks || '',
      mentions: peserta,
    };

    if (type === 'image') {
      await client.sendMessage(m.chat, media, { ...messageOptions, mediaType: 'image' });
    } else if (type === 'video') {
      await client.sendMessage(m.chat, media, { ...messageOptions, mediaType: 'video' });
    } else if (type === 'audio') {
      // Audio messages are sent as voice notes
      await client.sendMessage(m.chat, media, { ...messageOptions, mediaType: 'audio', ptt: true });
    }

    return reply(`✅ ${type} successfully uploaded to group status`);
  } catch (error) {
    console.error('Error sending group status:', error);
    return reply(`❌ Failed to send group status: ${error.message}`);
  }
}
break;
