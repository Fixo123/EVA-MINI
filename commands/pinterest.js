// commands/pinterest.js - Pinterest Image Search for EVA-MINI
const axios = require('axios');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '📌',
                    key: msg.key
                }
            });
        } catch (e) {}

        // ============================================
        // CHECK SEARCH QUERY
        // ============================================
        const q = args.join(' ').trim();
        if (!q) {
            await sock.sendMessage(from, {
                text: `📌 *Pinterest Image Search*\n\n📌 *Usage:* .pinterest [search_term]\n\n📝 *Example:* .pinterest beautiful sunset\n\n🖼️ *Search for images on Pinterest!*`
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
        const statusMsg = await sock.sendMessage(from, {
            text: `📌 *Searching Pinterest for:* ${q}\n\n⏳ Please wait...`
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
        // SEARCH IMAGES
        // ============================================
        try {
            let imageUrl = null;
            let imageAuthor = 'Pinterest';
            let imageTitle = q;

            // METHOD 1: Try Pinterest API
            try {
                const pinterestUrl = `https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(q)}&data=%7B%22options%22%3A%7B%22filters%22%3A%22%22%2C%22page_size%22%3A10%7D%2C%22context%22%3A%7B%7D%7D`;
                
                const response = await axios.get(pinterestUrl, {
                    headers: { 
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'application/json'
                    },
                    timeout: 10000
                });

                if (response.data && response.data.resource_response && response.data.resource_response.data) {
                    const results = response.data.resource_response.data.results || [];
                    if (results.length > 0) {
                        const pin = results[0];
                        imageUrl = pin.images?.orig?.url || pin.images?.large?.url || pin.images?.medium?.url;
                        imageTitle = pin.title || q;
                        imageAuthor = pin.pinner?.full_name || 'Pinterest';
                    }
                }
            } catch (e) {
                console.log('Pinterest API failed:', e.message);
            }

            // METHOD 2: Fallback to Unsplash API
            if (!imageUrl) {
                try {
                    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=5&client_id=demo`;
                    const response = await axios.get(unsplashUrl, { timeout: 8000 });
                    
                    if (response.data && response.data.results && response.data.results.length > 0) {
                        const result = response.data.results[0];
                        imageUrl = result.urls.regular || result.urls.full;
                        imageTitle = result.description || result.alt_description || q;
                        imageAuthor = result.user?.name || 'Unsplash';
                    }
                } catch (e) {
                    console.log('Unsplash API failed:', e.message);
                }
            }

            // METHOD 3: Fallback to Pollinations AI
            if (!imageUrl) {
                try {
                    const prompt = q.replace(/[^a-zA-Z0-9 ]/g, '').trim();
                    imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
                    imageAuthor = 'AI Generated';
                    
                    // Check if image is accessible
                    const checkResponse = await axios.head(imageUrl, { timeout: 5000 });
                    if (checkResponse.status !== 200) {
                        imageUrl = null;
                    }
                } catch (e) {
                    console.log('Pollinations API failed:', e.message);
                }
            }

            // ============================================
            // SEND IMAGE
            // ============================================
            if (imageUrl) {
                const caption = `📌 *Pinterest Search Results*\n\n` +
                              `🔍 *Search:* ${q}\n` +
                              `📷 *Image:* ${imageTitle || q}\n` +
                              `👤 *Source:* ${imageAuthor}\n\n` +
                              `> 🤖 *EVA-MINI Pinterest Bot*`;

                await sock.sendMessage(from, {
                    image: { url: imageUrl },
                    caption: caption
                });

                try {
                    await sock.sendMessage(from, {
                        react: {
                            text: '✅',
                            key: msg.key
                        }
                    });
                } catch (e) {}

            } else {
                // If all methods fail
                await sock.sendMessage(from, {
                    text: `❌ *No images found for:* "${q}"\n\nPlease try a different search term.`
                });
                try {
                    await sock.sendMessage(from, {
                        react: {
                            text: '❌',
                            key: msg.key
                        }
                    });
                } catch (e) {}
            }

        } catch (error) {
            console.error('Pinterest search error:', error);
            await sock.sendMessage(from, {
                text: `❌ *Error searching:* ${error.message}\n\nPlease try again later.`
            });
            try {
                await sock.sendMessage(from, {
                    react: {
                        text: '❌',
                        key: msg.key
                    }
                });
            } catch (e) {}
        }

        // ============================================
        // DELETE STATUS MESSAGE
        // ============================================
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            await sock.sendMessage(from, {
                delete: statusMsg.key
            });
        } catch (e) {}

    } catch (error) {
        console.error('Pinterest command error:', error);
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