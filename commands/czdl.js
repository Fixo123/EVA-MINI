// commands/cinesubz.js - Cinesubz Movie Downloader for EVA-MINI
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

📝 *Example:* .cinesubz batman

🔍 *Features:*
• Search Sinhala subbed movies
• Multiple quality options
• Direct download links
• Auto subtitle support

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
                    // GET DOWNLOAD LINKS
                    // ============================================
                    let downloads = [];
                    let isOldApi = false;

                    // Try New API
                    try {
                        const movidlUrl = `${CZ_API}/movidl?url=${encodeURIComponent(selectedMovie.url)}`;
                        const dlRes = await axios.get(movidlUrl, { timeout: 20000 });
                        downloads = dlRes.data.result?.downloads || [];
                    } catch (dlErr) {
                        console.log('CZ movidl Error:', dlErr.message);
                        
                        // Try Old API Fallback
                        if (dlErr.response && (dlErr.response.status >= 500 || dlErr.response.status === 404)) {
                            try {
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
                                    }
                                }
                            } catch (oldErr) {
                                console.log('CZ: Old API fallback failed', oldErr.message);
                            }
                        }
                    }

                    if (downloads.length === 0) {
                        await sock.sendMessage(from, {
                            text: `❌ *No download links found for:* ${selectedMovie.title}\n\nPlease try another movie.`
                        });
                        return;
                    }

                    const movieTitle = selectedMovie.title;
                    const shortTitle = movieTitle.substring(0, 20).replace(/[^a-zA-Z0-9 ]/g, "").trim();

                    // ============================================
                    // SEND MOVIE INFO WITH BUTTONS
                    // ============================================
                    const buttons = [];
                    downloads.forEach((dl, idx) => {
                        const resolvedUrl = dl.resolvedUrl || '';
                        const label = dl.meta || `Quality ${idx + 1}`;
                        const isPlayerFlag = dl.isPlayer ? "true" : "false";

                        if (resolvedUrl) {
                            buttons.push({
                                buttonId: `.czdl ${shortTitle} || ${label} || ${resolvedUrl} || ${isPlayerFlag}`,
                                buttonText: { displayText: `📥 ${label}` },
                                type: 1
                            });
                        }
                    });

                    // If more than 3 buttons, use list instead
                    if (buttons.length > 3) {
                        const sections = [{
                            title: "📥 Download Qualities",
                            rows: downloads.map((dl, idx) => ({
                                title: dl.meta || `Quality ${idx + 1}`,
                                rowId: `.czdl ${shortTitle} || ${dl.meta || `Quality ${idx + 1}`} || ${dl.resolvedUrl || ''} || ${dl.isPlayer ? "true" : "false"}`,
                                description: `Click to download ${dl.meta || `Quality ${idx + 1}`}`
                            }))
                        }];

                        await sock.sendMessage(from, {
                            text: `🎬 *${movieTitle}*\n\n📅 Date: ${selectedMovie.date || 'N/A'}\n⭐ IMDB: ${selectedMovie.imdb || 'N/A'}\n⏱ Runtime: ${selectedMovie.runtime || 'N/A'}\n\n📥 *Select quality from the list below:*`,
                            footer: '👸 EVA-MINI Cinesubz',
                            buttonText: "📥 Download",
                            sections: sections
                        });
                    } else {
                        // Send with buttons
                        const captionText = `🎬 *${movieTitle}*\n\n📅 *Date:* ${selectedMovie.date || 'N/A'}\n⭐ *IMDB:* ${selectedMovie.imdb || 'N/A'}\n⏱ *Runtime:* ${selectedMovie.runtime || 'N/A'}\n\n📥 *Select quality below:*`;

                        await sock.sendMessage(from, {
                            image: { url: selectedMovie.img || 'https://files.catbox.moe/4oo2jh.png' },
                            caption: captionText,
                            footer: '🎬 EVA-MINI Cinesubz',
                            buttons: buttons,
                            headerType: 4
                        });
                    }

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
