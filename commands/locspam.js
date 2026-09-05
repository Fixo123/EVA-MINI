// commands/locspam.js - Location Spam Attack for EVA-MINI
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '📍',
                    key: msg.key
                }
            });
        } catch (e) {}

        // ============================================
        // ADMIN/OWNER CHECK
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
            try {
                await sock.sendMessage(from, {
                    react: {
                        text: '⛔',
                        key: msg.key
                    }
                });
            } catch (e) {}
            return;
        }

        // ============================================
        // GET TARGET
        // ============================================
        let target;
        const q = args.join(' ');
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;

        if (q && q.match(/\d/)) {
            const cleanNumber = q.replace(/\D/g, '');
            target = jidNormalizedUser(cleanNumber + '@s.whatsapp.net');
        } else if (mentioned) {
            target = mentioned;
        } else if (quoted) {
            target = quoted;
        } else {
            await sock.sendMessage(from, {
                text: `⚠️ *Usage:* .locspam [@mention] or reply to user\n\n📌 *Example:* .locspam @94703945265\n\n📍 *Send location spam to target!*`
            });
            try {
                await sock.sendMessage(from, {
                    react: {
                        text: 'ℹ️',
                        key: msg.key
                    }
                });
            } catch (e) {}
            return;
        }

        // ============================================
        // STATUS MESSAGE
        // ============================================
        const targetNumber = target.split('@')[0];
        const statusMsg = await sock.sendMessage(from, {
            text: `📍 *Sending location spam to @${targetNumber}...*\n\n⏳ Please wait...`,
            mentions: [target]
        });

        try {
            await sock.sendMessage(from, {
                react: {
                    text: '⏳',
                    key: msg.key
                }
            });
        } catch (e) {}

        // ============================================
        // SEND LOCATION SPAM
        // ============================================
        let successCount = 0;
        let totalMessages = 25;

        // Famous locations around the world
        const famousLocations = [
            // Sri Lanka
            { lat: 6.9271, lng: 79.8612, name: 'Colombo, Sri Lanka' },
            { lat: 7.2906, lng: 80.6337, name: 'Kandy, Sri Lanka' },
            { lat: 6.0326, lng: 80.2166, name: 'Galle, Sri Lanka' },
            { lat: 8.3356, lng: 80.4099, name: 'Anuradhapura, Sri Lanka' },
            { lat: 6.4169, lng: 81.3333, name: 'Yala, Sri Lanka' },
            { lat: 7.2471, lng: 80.3232, name: 'Rambukkana, Sri Lanka' },
            
            // World
            { lat: 40.7128, lng: -74.0060, name: 'New York, USA' },
            { lat: 51.5074, lng: -0.1278, name: 'London, UK' },
            { lat: 48.8566, lng: 2.3522, name: 'Paris, France' },
            { lat: 35.6762, lng: 139.6503, name: 'Tokyo, Japan' },
            { lat: 37.5665, lng: 126.9780, name: 'Seoul, South Korea' },
            { lat: 22.3193, lng: 114.1694, name: 'Hong Kong' },
            { lat: 25.2048, lng: 55.2708, name: 'Dubai, UAE' },
            { lat: 30.0444, lng: 31.2357, name: 'Cairo, Egypt' },
            { lat: -33.8688, lng: 151.2093, name: 'Sydney, Australia' }
        ];

        for (let i = 0; i < totalMessages; i++) {
            try {
                const loc = famousLocations[i % famousLocations.length];
                const randomLat = loc.lat + (Math.random() - 0.5) * 0.1;
                const randomLng = loc.lng + (Math.random() - 0.5) * 0.1;
                
                await sock.sendMessage(target, {
                    location: {
                        degreesLatitude: randomLat,
                        degreesLongitude: randomLng,
                        name: `${loc.name} 📍 #${i + 1}`,
                        address: `Location ${i + 1} of ${totalMessages}`
                    }
                });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (e) {
                console.log(`Location spam ${i + 1} failed:`, e.message);
            }
        }

        // ============================================
        // SEND LIVE LOCATIONS (if supported)
        // ============================================
        try {
            for (let i = 0; i < 5; i++) {
                const loc = famousLocations[i % famousLocations.length];
                await sock.sendMessage(target, {
                    location: {
                        degreesLatitude: loc.lat,
                        degreesLongitude: loc.lng,
                        name: `📍 Live Location #${i + 1}`,
                        address: `Live location ${i + 1}`
                    }
                });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        } catch (e) {
            console.log('Live location spam failed:', e.message);
        }

        // ============================================
        // SEND RANDOM LOCATIONS
        // ============================================
        try {
            for (let i = 0; i < 10; i++) {
                const randomLat = (Math.random() * 180) - 90;
                const randomLng = (Math.random() * 360) - 180;
                
                await sock.sendMessage(target, {
                    location: {
                        degreesLatitude: randomLat,
                        degreesLongitude: randomLng,
                        name: `📍 Random Location ${i + 1}`,
                        address: `Random location ${i + 1}`
                    }
                });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 150));
            }
        } catch (e) {
            console.log('Random location spam failed:', e.message);
        }

        // ============================================
        // SUCCESS MESSAGE
        // ============================================
        await sock.sendMessage(from, {
            text: `📍 *Location spam delivered!*\n\n📱 *Target:* @${targetNumber}\n📊 *Locations:* ${successCount} sent\n💥 *Status:* SUCCESS\n\n⚠️ *Target's WhatsApp may experience issues with map!*`,
            mentions: [target]
        });

        // ============================================
        // FINAL REACTION
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '✅',
                    key: msg.key
                }
            });
        } catch (e) {}

        // ============================================
        // DELETE STATUS MESSAGE
        // ============================================
        try {
            await new Promise(resolve => setTimeout(resolve, 3000));
            await sock.sendMessage(from, {
                delete: statusMsg.key
            });
        } catch (e) {}

        // ============================================
        // OWNER REPORT
        // ============================================
        try {
            await sock.sendMessage(botNumber, {
                text: `📍 *Location Spam Report*\n\n📱 *Target:* @${targetNumber}\n👤 *By:* ${msg.pushName || 'Unknown'}\n📊 *Locations:* ${successCount}\n✅ *Status:* SUCCESS\n🕐 *Time:* ${new Date().toLocaleString()}`,
                mentions: [target]
            });
        } catch (e) {}

    } catch (error) {
        console.error('Location spam error:', error);
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '❌',
                    key: msg.key
                }
            });
        } catch (e) {}
        await sock.sendMessage(from, {
            text: `❌ *Error:* ${error.message}`
        });
    }
};