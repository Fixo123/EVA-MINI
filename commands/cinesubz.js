// commands/cinesubz.js - FIXED VERSION
const axios = require('axios');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

// API Endpoints
const CZ_API = "https://cz-dnuz.vercel.app";
const OLD_API = "https://cinesubz-api-cnw.vercel.app/api";

// Store search contexts
let czContexts = {};

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '🎬',
                    key: msg.key
                }
            });
        } catch (e) {}

        // ============================================
        // USAGE CHECK
        // ============================================
        if (!args || args.length === 0) {
            await sock.sendMessage(from, {
                text: `🎬 *Cinesubz Movie Downloader*

📌 *Usage:* .cinesubz [movie_name]

📝 *Example:* .cinesubz scary movie

🔍 *Features:*
• Search Sinhala subbed movies
• Multiple quality options
• Direct download links

🎭 *Powered by Cinesubz API*`
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

        const query = args.join(" ").trim();

        // ============================================
        // STATUS MESSAGE
        // ============================================
        const statusMsg = await sock.sendMessage(from, {
            text: `🎬 *Searching Cinesubz...*\n\n🔍 *Movie:* ${query}\n⏳ Please wait...`
        });

        try {
            await sock.sendMessage(from, {
                react: {
                    text: '🔍',
                    key: msg.key
                }
            });
        } catch (e) {}

        // ============================================
        // SEARCH MOVIE
        // ============================================
        try {
            const searchUrl = `${CZ_API}/search?q=${encodeURIComponent(query)}`;
            console.log('Searching:', searchUrl);
            
            const res = await axios.get(searchUrl, { timeout: 15000 });
            const data = res.data;

            if (!data.success || !data.result || data.result.length === 0) {
                await sock.sendMessage(from, {
                    text: `❌ *No movies found for:* "${query}"\n\nPlease try a different movie name.`
                });
                try {
                    await sock.sendMessage(from, {
                        react: {
                            text: '❌',
                            key: msg.key
                        }
                    });
                } catch (e) {}
                return;
            }

            const topResults = data.result.slice(0, 10);
            
            // Store results for selection
            if (!czContexts[from]) czContexts[from] = {};
            czContexts[from].results = topResults;

            // ============================================
            // DISPLAY RESULTS
            // ============================================
            let listText = `🎬 *Cinesubz Search Results*\n\n🔍 *Query:* ${query}\n📊 *Found:* ${topResults.length} movies\n\n`;
            
            topResults.forEach((mv, index) => {
                listText += `*${index + 1}.* 🎬 *${mv.title}*\n`;
                listText += `   ⭐ IMDB: ${mv.imdb || 'N/A'} | 📅 ${mv.date || 'N/A'}\n`;
                listText += `   ⏱ ${mv.runtime || 'N/A'} | 🎭 ${mv.genres || 'N/A'}\n\n`;
            });
            
            listText += `📝 *Reply with number (1-${topResults.length}) to select*`;

            const listMsg = await sock.sendMessage(from, {
                text: listText
            });

            czContexts[from].searchMsgId = listMsg.key.id;

            // ============================================
            // WAIT FOR USER SELECTION
            // ============================================
            const listener = async (m) => {
                try {
                    if (m.type !== 'notify') return;
                    
                    const replyMsg = m.messages[0];
                    if (!replyMsg.message) return;
                    if (replyMsg.key.remoteJid !== from) return;

                    const replyContext = replyMsg.message.extendedTextMessage?.contextInfo;
                    if (!replyContext || replyContext.stanzaId !== listMsg.key.id) return;

                    const userReply = replyMsg.message.extendedTextMessage?.text?.trim() || 
                                      replyMsg.message.conversation?.trim();
                    
                    if (!userReply) return;

                    const selectedIndex = parseInt(userReply) - 1;

                    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= topResults.length) {
                        await sock.sendMessage(from, {
                            text: "❌ *Invalid number!* Please enter a valid number."
                        });
                        return;
                    }

                    const selectedMovie = topResults[selectedIndex];
                    sock.ev.off('messages.upsert', listener);

                    await sock.sendMessage(from, {
                        react: {
                            text: '⏳',
                            key: replyMsg.key
                        }
                    });

                    await sock.sendMessage(from, {
                        text: `🔄 *Getting download links for:* ${selectedMovie.title}\n⏳ Please wait...`
                    });

                    // ============================================
                    // GET DOWNLOAD LINKS - IMPROVED
                    // ============================================
                    let downloads = [];
                    let isOldApi = false;

                    // Try New API - Method 1
                    try {
                        console.log('Trying /movidl API...');
                        const movidlUrl = `${CZ_API}/movidl?url=${encodeURIComponent(selectedMovie.url)}`;
                        const dlRes = await axios.get(movidlUrl, { timeout: 20000 });
                        console.log('movidl response:', JSON.stringify(dlRes.data).substring(0, 200));
                        
                        if (dlRes.data.success && dlRes.data.result) {
                            downloads = dlRes.data.result.downloads || [];
                            console.log('Downloads found:', downloads.length);
                        }
                    } catch (dlErr) {
                        console.log('movidl Error:', dlErr.message);
                    }

                    // If no downloads, try Old API
                    if (downloads.length === 0) {
                        try {
                            console.log('Trying Old API...');
                            const oldApiUrl = `${OLD_API}/extract?id=${selectedMovie.id}&type=mv`;
                            const oldRes = await axios.get(oldApiUrl, { timeout: 15000 });

                            if (oldRes.data && oldRes.data.data) {
                                const directVideo = oldRes.data.data.find(v => v.is_direct_mp4) || oldRes.data.data[0];
                                const playerUrl = directVideo.link;

                                if (playerUrl && playerUrl.includes('player')) {
                                    isOldApi = true;
                                    downloads = [
                                        { meta: "480p Quality", resolvedUrl: playerUrl, isPlayer: true },
                                        { meta: "720p Quality", resolvedUrl: playerUrl, isPlayer: true }
                                    ];
                                    console.log('Old API downloads found');
                                }
                            }
                        } catch (oldErr) {
                            console.log('Old API error:', oldErr.message);
                        }
                    }

                    // If still no downloads, try alternative API
                    if (downloads.length === 0) {
                        try {
                            console.log('Trying alternative API...');
                            const altUrl = `${CZ_API}/api/movie/${selectedMovie.id}`;
                            const altRes = await axios.get(altUrl, { timeout: 15000 });
                            
                            if (altRes.data && altRes.data.downloads) {
                                downloads = altRes.data.downloads;
                                console.log('Alternative API downloads found');
                            }
                        } catch (altErr) {
                            console.log('Alternative API error:', altErr.message);
                        }
                    }

                    // ============================================
                    // DISPLAY QUALITY OPTIONS
                    // ============================================
                    const movieTitle = selectedMovie.title;
                    const shortTitle = movieTitle.substring(0, 20).replace(/[^a-zA-Z0-9 ]/g, "").trim();

                    if (downloads.length === 0) {
                        // Show error with direct link option
                        await sock.sendMessage(from, {
                            text: `❌ *No download links found for:* ${movieTitle}\n\n📌 *Movie URL:* ${selectedMovie.url}\n\n💡 Try downloading from the website directly.`,
                            mentions: [from]
                        });
                        return;
                    }

                    // ============================================
                    // CREATE QUALITY BUTTONS
                    // ============================================
                    const buttons = [];
                    downloads.forEach((dl, idx) => {
                        const resolvedUrl = dl.resolvedUrl || dl.url || dl.link || '';
                        const label = dl.meta || dl.quality || `Quality ${idx + 1}`;
                        const isPlayerFlag = dl.isPlayer ? "true" : "false";

                        if (resolvedUrl) {
                            buttons.push({
                                buttonId: `.czdl ${shortTitle} || ${label} || ${resolvedUrl} || ${isPlayerFlag}`,
                                buttonText: { displayText: `📥 ${label}` },
                                type: 1
                            });
                        }
                    });

                    // ============================================
                    // SEND MOVIE INFO WITH BUTTONS
                    // ============================================
                    const captionText = `🎬 *${movieTitle}*\n\n📅 *Date:* ${selectedMovie.date || 'N/A'}\n⭐ *IMDB:* ${selectedMovie.imdb || 'N/A'}\n⏱ *Runtime:* ${selectedMovie.runtime || 'N/A'}\n\n📥 *Select quality below:*`;

                    if (buttons.length === 0) {
                        // If no buttons, send error
                        await sock.sendMessage(from, {
                            text: `❌ *No quality options available for:* ${movieTitle}\n\n📌 *Movie URL:* ${selectedMovie.url}\n\n💡 Try downloading from the website directly.`
                        });
                        return;
                    }

                    // Send with buttons
                    await sock.sendMessage(from, {
                        image: { url: selectedMovie.img || 'https://files.catbox.moe/4oo2jh.png' },
                        caption: captionText,
                        footer: '🎬 EVA-MINI Cinesubz',
                        buttons: buttons,
                        headerType: 4
                    });

                    await sock.sendMessage(from, {
                        react: {
                            text: '✅',
                            key: replyMsg.key
                        }
                    });

                } catch (listenerErr) {
                    console.error('CZ listener error:', listenerErr.message);
                }
            };

            sock.ev.on('messages.upsert', listener);
            
            // Auto-cleanup after 2 minutes
            setTimeout(() => {
                sock.ev.off('messages.upsert', listener);
                delete czContexts[from];
            }, 120000);

        } catch (e) {
            console.error('Cinesubz Search Error:', e.message);
            await sock.sendMessage(from, {
                text: `❌ *Error searching:* ${e.message}\n\nPlease try again later.`
            });
            try {
                await sock.sendMessage(from, {
                    react: {
                        text: '❌',
                        key: msg.key
                    }
                });
            } catch (err) {}
        }

    } catch (error) {
        console.error('Cinesubz command error:', error);
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
