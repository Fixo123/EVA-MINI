// commands/slleak.js - Sri Lanka Leak Video Downloader
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
                    text: '🔞',
                    key: msg.key
                }
            });
        } catch (e) {}

        if (!args || args.length === 0) {
            await sock.sendMessage(from, {
                text: `🔞 *SL Leak Video Downloader*

📌 *Usage:* .slleak [keyword]

📝 *Examples:*
.slleak actress name
.slleak viral video
.slleak sri lanka

🔍 *Features:*
• Search Sri Lanka leak videos
• Get direct download links
• Auto-send as WhatsApp video
• Multiple sources

⚠️ *Note:* 18+ content only`
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

        const searchQuery = args.join(' ');
        const tempDir = path.join(__dirname, '../temp');
        fs.ensureDirSync(tempDir);

        // ============================================
        // STATUS MESSAGE
        // ============================================
        const statusMsg = await sock.sendMessage(from, {
            text: `🔞 *Searching for:* ${searchQuery}\n\n🔄 Scanning sources...\n⏳ Please wait...`
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
        // STEP 1: SEARCH VIDEOS
        // ============================================
        let searchResults = [];
        
        // Source 1: Try Thenkiri
        try {
            if (thenkiriScraper) {
                const results = await thenkiriScraper.searchVideo(searchQuery);
                if (results && results.length > 0) {
                    searchResults.push(...results.map(r => ({
                        title: r.title,
                        link: r.link,
                        source: 'thenkiri'
                    })));
                }
            }
        } catch (e) {
            console.log('Thenkiri search failed:', e.message);
        }

        // Source 2: Try yt-dlp for Sri Lanka content
        try {
            const { stdout } = await execPromise(
                `yt-dlp "ytsearch10:${searchQuery} sri lanka leak" --get-id --get-title --get-duration --get-url --no-warnings 2>/dev/null`,
                { maxBuffer: 10 * 1024 * 1024 }
            );
            
            const lines = stdout.split('\n').filter(line => line.trim());
            for (let i = 0; i < lines.length; i += 4) {
                if (i + 3 < lines.length) {
                    searchResults.push({
                        title: lines[i].trim(),
                        duration: lines[i+1].trim(),
                        link: `https://www.youtube.com/watch?v=${lines[i+2].trim()}`,
                        source: 'youtube'
                    });
                }
            }
        } catch (e) {
            console.log('YT-DLP search failed:', e.message);
        }

        // Source 3: Try direct sources
        try {
            const sources = [
                'https://api.example.com/sri-lanka-leak/search',
                'https://api.example2.com/sl-leak/videos'
            ];
            
            for (const source of sources) {
                try {
                    const response = await axios.get(source, {
                        params: { q: searchQuery, limit: 5 },
                        timeout: 5000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    if (response.data && response.data.results) {
                        searchResults.push(...response.data.results.map(r => ({
                            title: r.title,
                            link: r.url,
                            source: 'api'
                        })));
                    }
                } catch (e) {}
            }
        } catch (e) {
            console.log('Direct sources failed:', e.message);
        }

        if (!searchResults || searchResults.length === 0) {
            await sock.sendMessage(from, {
                text: `❌ *No results found for:* "${searchQuery}"\n\nPlease try different keywords.`
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
        let resultList = '🔞 *Search Results:*\n\n';
        searchResults.slice(0, 5).forEach((video, index) => {
            resultList += `${index + 1}. ${video.title.substring(0, 50)}...\n`;
            resultList += `   📌 Source: ${video.source || 'Unknown'}\n`;
            if (video.duration) resultList += `   ⏱️ Duration: ${video.duration}\n`;
            resultList += `\n`;
        });
        resultList += `📝 *Using first result automatically...*`;

        await sock.sendMessage(from, {
            text: resultList
        });

        // Select first result
        const selectedVideo = searchResults[0];

        await sock.sendMessage(from, {
            text: `✅ *Selected:* ${selectedVideo.title}\n\n🔄 Getting download link...`
        });

        // ============================================
        // STEP 2: GET DIRECT DOWNLOAD LINK
        // ============================================
        let directLink = null;
        let videoBuffer = null;

        // Try Thenkiri download
        if (selectedVideo.source === 'thenkiri' && thenkiriScraper) {
            try {
                const options = await thenkiriScraper.getDownloadOptions(selectedVideo.link);
                if (options && options.length > 0) {
                    const firstOption = options[0];
                    const finalLink = await thenkiriScraper.bypassDownloadwella(firstOption.link);
                    if (finalLink) {
                        directLink = finalLink;
                    }
                }
            } catch (e) {
                console.log('Thenkiri download failed:', e.message);
            }
        }

        // Try yt-dlp download
        if (!directLink && selectedVideo.source === 'youtube') {
            try {
                const outputPath = path.join(tempDir, `video_${Date.now()}.mp4`);
                const command = `yt-dlp -f "best[ext=mp4]" -o "${outputPath}" "${selectedVideo.link}" --no-warnings 2>/dev/null`;
                await execPromise(command, { maxBuffer: 50 * 1024 * 1024 });
                
                if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
                    videoBuffer = await fs.readFile(outputPath);
                    await fs.remove(outputPath);
                }
            } catch (e) {
                console.log('YT-DLP download failed:', e.message);
            }
        }

        // Try direct download
        if (!directLink && !videoBuffer) {
            try {
                const response = await axios.get(selectedVideo.link, {
                    responseType: 'arraybuffer',
                    timeout: 60000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                
                if (response.data && response.data.length > 0) {
                    const contentType = response.headers['content-type'] || '';
                    if (contentType.includes('video') || contentType.includes('mp4')) {
                        videoBuffer = Buffer.from(response.data);
                    }
                }
            } catch (e) {
                console.log('Direct download failed:', e.message);
            }
        }

        // Try to get link if no buffer
        if (!directLink && !videoBuffer) {
            // Try to resolve with yt-dlp without downloading
            try {
                const { stdout } = await execPromise(
                    `yt-dlp -g "${selectedVideo.link}" --no-warnings 2>/dev/null`,
                    { maxBuffer: 10 * 1024 * 1024 }
                );
                if (stdout) {
                    directLink = stdout.trim();
                }
            } catch (e) {
                console.log('URL extraction failed:', e.message);
            }
        }

        if (!directLink && !videoBuffer) {
            await sock.sendMessage(from, {
                text: `❌ *Failed to get download link!*\n\nPlease try another video.`
            });
            return;
        }

        // ============================================
        // STEP 3: SEND VIDEO
        // ============================================
        const caption = `🔞 *Sri Lanka Leak Video*\n\n` +
                       `📌 *Title:* ${selectedVideo.title}\n` +
                       `📅 *Source:* ${selectedVideo.source || 'Unknown'}\n` +
                       `${selectedVideo.duration ? `⏱️ *Duration:* ${selectedVideo.duration}\n` : ''}` +
                       `⚠️ *18+ Content*\n\n` +
                       `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                       `⚠️ *Disclaimer:* This content is for informational purposes only.`;

        if (videoBuffer) {
            // Send as WhatsApp video
            await sock.sendMessage(from, {
                video: videoBuffer,
                caption: caption,
                mimetype: 'video/mp4',
                fileName: `${selectedVideo.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}.mp4`
            });
        } else if (directLink) {
            // Send as download link
            await sock.sendMessage(from, {
                text: `🔞 *${selectedVideo.title}*\n\n📥 *Download Link:*\n${directLink}\n\n${caption}`
            });
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
        console.error('SL Leak error:', error);
        
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
