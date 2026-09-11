// commands/cinesubz.js - FIXED: Document Send Version
const axios = require('axios');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const CZ_API = "https://cz-dnuz.vercel.app";

let czContexts = {};

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // Reaction
        try {
            await sock.sendMessage(from, { react: { text: '🎬', key: msg.key } });
        } catch (e) {}

        if (!args || args.length === 0) {
            await sock.sendMessage(from, {
                text: `🎬 *Cinesubz Movie Downloader*\n\n📌 *Usage:* .cinesubz [movie_name]\n\n📝 *Example:* .cinesubz scary movie`
            });
            return;
        }

        const query = args.join(" ").trim();

        const statusMsg = await sock.sendMessage(from, {
            text: `🎬 *Searching Cinesubz...*\n\n🔍 *Movie:* ${query}\n⏳ Please wait...`
        });

        try {
            await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } });
        } catch (e) {}

        // ============================================
        // STEP 1: SEARCH MOVIE
        // ============================================
        try {
            const searchUrl = `${CZ_API}/search?q=${encodeURIComponent(query)}`;
            console.log('Searching:', searchUrl);
            
            const res = await axios.get(searchUrl, { timeout: 15000 });
            const data = res.data;

            if (!data.success || !data.result || data.result.length === 0) {
                await sock.sendMessage(from, {
                    text: `❌ *No movies found for:* "${query}"`
                });
                return;
            }

            const topResults = data.result.slice(0, 10);
            
            if (!czContexts[from]) czContexts[from] = {};
            czContexts[from].results = topResults;

            let listText = `🎬 *Cinesubz Search Results*\n\n🔍 *Query:* ${query}\n📊 *Found:* ${topResults.length} movies\n\n`;
            
            topResults.forEach((mv, index) => {
                listText += `*${index + 1}.* 🎬 *${mv.title}*\n`;
                listText += `   ⭐ IMDB: ${mv.imdb || 'N/A'} | 📅 ${mv.date || 'N/A'}\n\n`;
            });
            
            listText += `📝 *Reply with number (1-${topResults.length}) to select*`;

            const listMsg = await sock.sendMessage(from, { text: listText });
            czContexts[from].searchMsgId = listMsg.key.id;

            // ============================================
            // WAIT FOR MOVIE SELECTION
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
                        await sock.sendMessage(from, { text: "❌ *Invalid number!*" });
                        return;
                    }

                    const selectedMovie = topResults[selectedIndex];
                    sock.ev.off('messages.upsert', listener);

                    await sock.sendMessage(from, {
                        text: `🔄 *Getting download links for:* ${selectedMovie.title}\n⏳ Please wait... (30-60 seconds)`
                    });

                    // ============================================
                    // STEP 2: GET DOWNLOAD LINKS
                    // ============================================
                    let downloadLinks = [];

                    try {
                        console.log('Getting download links...');
                        const movidlUrl = `${CZ_API}/movidl?url=${encodeURIComponent(selectedMovie.url)}`;
                        const dlRes = await axios.get(movidlUrl, { timeout: 90000 });
                        
                        console.log('movidl response received');
                        
                        if (dlRes.data.success && dlRes.data.result) {
                            if (dlRes.data.result.downloads) {
                                downloadLinks = dlRes.data.result.downloads;
                            } else if (Array.isArray(dlRes.data.result)) {
                                downloadLinks = dlRes.data.result;
                            }
                        }
                    } catch (dlErr) {
                        console.log('movidl Error:', dlErr.message);
                    }

                    if (downloadLinks.length === 0) {
                        await sock.sendMessage(from, {
                            text: `❌ *No download links found for:* ${selectedMovie.title}`
                        });
                        return;
                    }

                    // ============================================
                    // STEP 3: RESOLVE LINKS
                    // ============================================
                    const movieTitle = selectedMovie.title;
                    const shortTitle = movieTitle.substring(0, 30).replace(/[^a-zA-Z0-9 ]/g, "").trim();
                    let resolvedLinks = [];

                    await sock.sendMessage(from, {
                        text: `🔗 *Found ${downloadLinks.length} links. Resolving...*`
                    });

                    for (let i = 0; i < downloadLinks.length; i++) {
                        const dl = downloadLinks[i];
                        const linkUrl = dl.resolvedUrl || dl.url || dl.link || '';
                        const quality = dl.meta || dl.quality || dl.name || `Quality ${i + 1}`;

                        if (!linkUrl) continue;

                        try {
                            if (linkUrl.includes('.mp4') && !linkUrl.includes('player')) {
                                resolvedLinks.push({
                                    quality: quality,
                                    url: linkUrl,
                                    isDirect: true
                                });
                                continue;
                            }

                            const resolveUrl = `${CZ_API}/resolve?url=${encodeURIComponent(linkUrl)}`;
                            const resolveRes = await axios.get(resolveUrl, { timeout: 30000 });
                            
                            if (resolveRes.data.success && resolveRes.data.result) {
                                const directUrl = resolveRes.data.result.downloadUrl || 
                                                resolveRes.data.result.url || 
                                                resolveRes.data.result.directUrl ||
                                                resolveRes.data.result;
                                
                                if (directUrl && typeof directUrl === 'string') {
                                    resolvedLinks.push({
                                        quality: quality,
                                        url: directUrl,
                                        isDirect: true
                                    });
                                }
                            }
                        } catch (resolveErr) {
                            console.log(`Resolve failed for ${quality}:`, resolveErr.message);
                            resolvedLinks.push({
                                quality: quality,
                                url: linkUrl,
                                isDirect: false
                            });
                        }
                    }

                    czContexts[from].movieDownloads = resolvedLinks;
                    czContexts[from].movieTitle = movieTitle;
                    czContexts[from].shortTitle = shortTitle;
                    czContexts[from].selectedMovie = selectedMovie;

                    // ============================================
                    // STEP 4: DISPLAY QUALITY OPTIONS
                    // ============================================
                    let qualityList = '';
                    let validUrls = [];

                    resolvedLinks.forEach((link, idx) => {
                        if (link.url) {
                            const num = idx + 1;
                            const directIcon = link.isDirect ? '✅' : '⚠️';
                            qualityList += `${num}. ${directIcon} ${link.quality}\n`;
                            validUrls.push({
                                number: num,
                                label: link.quality,
                                url: link.url,
                                isDirect: link.isDirect
                            });
                        }
                    });

                    if (validUrls.length === 0) {
                        await sock.sendMessage(from, {
                            text: `❌ *No valid download links for:* ${movieTitle}`
                        });
                        return;
                    }

                    czContexts[from].validUrls = validUrls;

                    const captionText = `🎬 *${movieTitle}*

📅 *Date:* ${selectedMovie.date || 'N/A'}
⭐ *IMDB:* ${selectedMovie.imdb || 'N/A'}
🕒 *Runtime:* ${selectedMovie.runtime || 'N/A'}

📥 *Available Qualities:*

${qualityList}

📝 *Reply with number (1-${validUrls.length}) to download*

⚡ *EVA-MINI Cinesubz*`;

                    await sock.sendMessage(from, {
                        image: { url: selectedMovie.img || 'https://files.catbox.moe/4oo2jh.png' },
                        caption: captionText
                    });

                    // ============================================
                    // STEP 5: WAIT FOR QUALITY SELECTION
                    // ============================================
                    const qualityListener = async (m) => {
                        try {
                            if (m.type !== 'notify') return;
                            
                            const replyMsg = m.messages[0];
                            if (!replyMsg.message) return;
                            if (replyMsg.key.remoteJid !== from) return;

                            const userReply = replyMsg.message.extendedTextMessage?.text?.trim() || 
                                              replyMsg.message.conversation?.trim();
                            
                            if (!userReply) return;

                            const selectedNum = parseInt(userReply);

                            if (isNaN(selectedNum) || selectedNum < 1 || selectedNum > validUrls.length) {
                                await sock.sendMessage(from, {
                                    text: `❌ *Invalid number!* Reply with 1-${validUrls.length}`
                                });
                                return;
                            }

                            const selectedQuality = validUrls.find(u => u.number === selectedNum);
                            if (!selectedQuality) return;

                            sock.ev.off('messages.upsert', qualityListener);
                            
                            await sock.sendMessage(from, {
                                text: `📥 *Downloading ${movieTitle} (${selectedQuality.label})...*\n\n⏳ Please wait... 2-5 minutes.\n📁 *Sending as document*`
                            });

                            try {
                                await sock.sendMessage(from, { react: { text: '📥', key: replyMsg.key } });
                            } catch (e) {}

                            const caption = `🎬 *${movieTitle}*\n📥 *Quality:* ${selectedQuality.label}\n\n> 🎬 *EVA-MINI Cinesubz*`;

                            // ============================================
                            // SEND AS DOCUMENT
                            // ============================================
                            try {
                                console.log('Sending as document...');
                                
                                await sock.sendMessage(from, {
                                    document: { url: selectedQuality.url },
                                    mimetype: "video/mp4",
                                    fileName: `${shortTitle} - ${selectedQuality.label}.mp4`,
                                    caption: caption
                                });
                                
                                console.log('✅ Movie sent as document!');
                                
                                await sock.sendMessage(from, {
                                    react: { text: '✅', key: replyMsg.key }
                                });

                            } catch (docErr) {
                                console.log('❌ Document send failed:', docErr.message);
                                
                                try {
                                    await sock.sendMessage(from, {
                                        video: { url: selectedQuality.url },
                                        mimetype: "video/mp4",
                                        caption: caption
                                    });
                                    
                                    await sock.sendMessage(from, {
                                        react: { text: '✅', key: replyMsg.key }
                                    });
                                    
                                } catch (videoErr) {
                                    console.log('❌ Video send failed:', videoErr.message);
                                    
                                    await sock.sendMessage(from, {
                                        text: `⚠️ *Could not send file directly!*\n\n📥 *Download Link:*\n${selectedQuality.url}\n\n💡 *Open this link in your browser to download the movie.*`
                                    });
                                }
                            }

                        } catch (listenerErr) {
                            console.error('Quality listener error:', listenerErr.message);
                        }
                    };

                    sock.ev.on('messages.upsert', qualityListener);
                    
                    setTimeout(() => {
                        sock.ev.off('messages.upsert', qualityListener);
                        delete czContexts[from];
                    }, 300000);

                } catch (listenerErr) {
                    console.error('CZ listener error:', listenerErr.message);
                }
            };

            sock.ev.on('messages.upsert', listener);
            
            setTimeout(() => {
                sock.ev.off('messages.upsert', listener);
                delete czContexts[from];
            }, 120000);

        } catch (e) {
            console.error('Cinesubz Search Error:', e.message);
            await sock.sendMessage(from, {
                text: `❌ *Error:* ${e.message}`
            });
        }

    } catch (error) {
        console.error('Cinesubz command error:', error);
        await sock.sendMessage(from, {
            text: `❌ *Error:* ${error.message}`
        });
    }
};
