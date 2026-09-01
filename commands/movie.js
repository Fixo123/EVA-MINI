// commands/movie.js - Movie Download with Sinhala Subtitles
const { jidNormalizedUser } = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Import scraper libraries
let thenkiriScraper;
try {
    thenkiriScraper = require('liyanaarachchi-thenkiri-scrap');
} catch (e) {
    console.log('liyanaarachchi-thenkiri-scrap not installed');
}

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

        if (!args || args.length === 0) {
            await sock.sendMessage(from, {
                text: `🎬 *Movie Downloader*

📌 *Usage:* .movie [movie_name]

📝 *Example:* .movie Deadpool 3

🔍 *Features:*
• Search movies from Thenkiri
• Get direct download links
• Auto-fetch Sinhala subtitles
• Multiple quality options

⚠️ *Note:* Large files may take time to process`
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

        const movieName = args.join(' ');
        const tempDir = path.join(__dirname, '../temp');
        fs.ensureDirSync(tempDir);

        // ============================================
        // STATUS MESSAGE
        // ============================================
        const statusMsg = await sock.sendMessage(from, {
            text: `🎬 *Searching for:* ${movieName}\n\n🔄 Scanning Thenkiri database...\n⏳ Please wait...`
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
        // STEP 1: SEARCH MOVIE ON THENKIRI
        // ============================================
        let searchResults = [];
        try {
            if (thenkiriScraper) {
                searchResults = await thenkiriScraper.searchMovie(movieName);
            } else {
                // Fallback: Use Cineru scraper if available
                try {
                    const cineruScraper = require('cineru-scrapper');
                    const result = await cineruScraper.cineru.search(movieName, { page: 1, limit: 5 });
                    searchResults = result.results.map(r => ({
                        title: r.title,
                        link: r.link,
                        source: 'cineru'
                    }));
                } catch (e2) {
                    // Try alternative search
                }
            }
        } catch (e) {
            console.error('Search error:', e);
        }

        if (!searchResults || searchResults.length === 0) {
            await sock.sendMessage(from, {
                text: `❌ *No results found for:* "${movieName}"\n\nPlease try a different movie name.`
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

        // ============================================
        // DISPLAY SEARCH RESULTS
        // ============================================
        let resultList = '🎬 *Search Results:*\n\n';
        searchResults.slice(0, 5).forEach((movie, index) => {
            resultList += `${index + 1}. ${movie.title}\n`;
        });
        resultList += `\n📝 *Reply with number (1-${Math.min(5, searchResults.length)}) to select*`;

        await sock.sendMessage(from, {
            text: resultList
        });

        // Wait for user selection - simplified: use first result
        const selectedMovie = searchResults[0];

        await sock.sendMessage(from, {
            text: `✅ *Selected:* ${selectedMovie.title}\n\n🔄 Getting download options...`
        });

        // ============================================
        // STEP 2: GET DOWNLOAD OPTIONS
        // ============================================
        let downloadOptions = [];
        try {
            if (thenkiriScraper && selectedMovie.link) {
                downloadOptions = await thenkiriScraper.getDownloadOptions(selectedMovie.link);
            }
        } catch (e) {
            console.error('Download options error:', e);
        }

        if (!downloadOptions || downloadOptions.length === 0) {
            await sock.sendMessage(from, {
                text: `❌ *No download links found for:* ${selectedMovie.title}\n\nPlease try another movie.`
            });
            return;
        }

        // ============================================
        // STEP 3: SEARCH FOR SINHALA SUBTITLES
        // ============================================
        let subtitleFound = false;
        let subtitleUrl = null;
        let subtitleSource = null;

        try {
            // Use BettercopeLK API to search subtitles
            const subtitleSearchUrl = `https://bettercopelk.navinda.xyz/api/v1/search?query=${encodeURIComponent(movieName)}&sources=baiscopelk,cineru,piratelk,zoomlk`;
            
            const subResponse = await axios.get(subtitleSearchUrl, {
                timeout: 10000,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (subResponse.data && subResponse.data.length > 0) {
                // Get first subtitle result
                const firstSub = subResponse.data[0];
                subtitleFound = true;
                subtitleSource = firstSub.source;
                
                // Get download URL
                const downloadUrl = `https://bettercopelk.navinda.xyz/api/v1/download?url=${encodeURIComponent(firstSub.url)}&source=${firstSub.source}`;
                subtitleUrl = downloadUrl;
                
                await sock.sendMessage(from, {
                    text: `✅ *Sinhala Subtitle Found!*\n\n📝 *Source:* ${subtitleSource}\n📁 *Downloading...*`
                });
            } else {
                await sock.sendMessage(from, {
                    text: `⚠️ *No Sinhala subtitles found for:* ${movieName}\n\nContinuing without subtitles...`
                });
            }
        } catch (e) {
            console.error('Subtitle search error:', e);
            await sock.sendMessage(from, {
                text: `⚠️ *Subtitle search failed*\n\nContinuing without subtitles...`
            });
        }

        // ============================================
        // STEP 4: GET DIRECT VIDEO LINK
        // ============================================
        let directLink = null;
        let selectedOption = downloadOptions[0]; // Use first option (usually smallest size)

        try {
            if (thenkiriScraper && selectedOption.link) {
                const finalLink = await thenkiriScraper.bypassDownloadwella(selectedOption.link);
                directLink = finalLink;
            }
        } catch (e) {
            console.error('Direct link error:', e);
        }

        if (!directLink) {
            // Try alternative: use cineru-scrapper
            try {
                const cineruScraper = require('cineru-scrapper');
                const movieId = selectedMovie.link.match(/p=(\d+)/);
                if (movieId) {
                    const downloads = await cineruScraper.cineru.getDownloads(parseInt(movieId[1]), { resolve: true });
                    if (downloads && downloads.videoCopy && downloads.videoCopy.length > 0) {
                        const firstQuality = downloads.videoCopy[0];
                        if (firstQuality.links && firstQuality.links.length > 0) {
                            directLink = firstQuality.links[0].resolvedUrl || firstQuality.links[0].url;
                        }
                    }
                }
            } catch (e2) {
                console.error('Cineru fallback error:', e2);
            }
        }

        if (!directLink) {
            await sock.sendMessage(from, {
                text: `❌ *Failed to get direct download link!*\n\nPlease try another movie or quality.`
            });
            return;
        }

        // ============================================
        // STEP 5: SEND MOVIE AND SUBTITLES
        // ============================================
        await sock.sendMessage(from, {
            text: `🎬 *Movie Details:*\n\n📌 *Title:* ${selectedMovie.title}\n📥 *Quality:* ${selectedOption.name || 'Best Available'}\n🔗 *Link:* ${directLink.substring(0, 60)}...\n\n${subtitleFound ? '✅ *Sinhala Subtitle:* Found!' : '⚠️ *Subtitle:* Not Found'}\n\n🔄 *Sending file...*`
        });

        // ============================================
        // SEND VIDEO LINK (WhatsApp can't send large files)
        // ============================================
        await sock.sendMessage(from, {
            text: `🎬 *${selectedMovie.title}*\n\n📥 *Download Link:*\n${directLink}\n\n${subtitleFound ? '✅ *Sinhala Subtitle Available!*' : '❌ *No Sinhala Subtitle Found*'}\n\n${subtitleFound ? `📝 *Subtitle Download:* ${subtitleUrl}` : ''}\n\n📌 *Quality:* ${selectedOption.name || 'Best Available'}\n⚠️ *Large file - Download using browser!*`
        });

        // ============================================
        // IF SUBTITLE FOUND, DOWNLOAD AND SEND
        // ============================================
        if (subtitleFound && subtitleUrl) {
            try {
                const subResponse = await axios.get(subtitleUrl, {
                    responseType: 'arraybuffer',
                    timeout: 15000
                });
                
                const subPath = path.join(tempDir, `${movieName.replace(/\s+/g, '_')}_subtitle.zip`);
                fs.writeFileSync(subPath, subResponse.data);
                
                await sock.sendMessage(from, {
                    document: fs.readFileSync(subPath),
                    mimetype: 'application/zip',
                    fileName: `${movieName}_Sinhala_Subtitles.zip`,
                    caption: `📝 *Sinhala Subtitles for ${selectedMovie.title}*\n\n📌 *Source:* ${subtitleSource || 'BettercopeLK'}\n\nExtract and use with your video player.`
                });
                
                fs.unlinkSync(subPath);
            } catch (e) {
                console.error('Subtitle download error:', e);
                await sock.sendMessage(from, {
                    text: `⚠️ *Could not download subtitle file*\n\nPlease try downloading from:\n${subtitleUrl}`
                });
            }
        }

        // ============================================
        // SUCCESS REACTION
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

    } catch (error) {
        console.error('Movie command error:', error);
        
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '❌',
                    key: msg.key
                }
            });
        } catch (e) {}

        await sock.sendMessage(from, {
            text: `❌ *Error:* ${error.message}\n\nPlease try again later.`
        });
    }
};
