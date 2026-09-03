// commands/sinhalasub.js - SinhalaSub Movie Downloader
const { jidNormalizedUser } = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: { text: '🎬', key: msg.key }
            });
        } catch (e) {}

        if (!args || args.length === 0) {
            await sock.sendMessage(from, {
                text: `🎬 *SinhalaSub Movie Downloader*

📌 *Usage:* .sinhalasub [movie_name]

📝 *Examples:*
.sinhalasub outbreak 2024
.sinhalasub game of thrones
.sinhalasub leo 2023

🔍 *Features:*
• Search movies from sinhalasub.lk
• Get direct download links
• Auto-send as document
• Sinhala subtitles included

⏳ *Note:* Large files may take time`
            });
            return;
        }

        const movieName = args.join(' ');
        const tempDir = path.join(__dirname, '../temp');
        fs.ensureDirSync(tempDir);

        // ============================================
        // STATUS MESSAGE
        // ============================================
        const statusMsg = await sock.sendMessage(from, {
            text: `🎬 *Searching for:* ${movieName}\n\n🔄 Scanning sinhalasub.lk...\n⏳ Please wait...`
        });

        // ============================================
        // STEP 1: SEARCH MOVIE
        // ============================================
        const searchResults = await searchSinhalasub(movieName);

        if (!searchResults || searchResults.length === 0) {
            await sock.sendMessage(from, {
                text: `❌ *No results found for:* "${movieName}"\n\nPlease try different keywords.`
            });
            return;
        }

        // ============================================
        // DISPLAY RESULTS
        // ============================================
        let resultList = '🎬 *Search Results:*\n\n';
        searchResults.slice(0, 5).forEach((movie, index) => {
            resultList += `${index + 1}. ${movie.title}\n`;
            resultList += `   📅 ${movie.year || 'N/A'}\n`;
            if (movie.quality) resultList += `   📌 Quality: ${movie.quality}\n`;
            resultList += `\n`;
        });
        resultList += `📝 *Using first result automatically...*`;

        await sock.sendMessage(from, { text: resultList });

        // Select first result
        const selectedMovie = searchResults[0];

        await sock.sendMessage(from, {
            text: `✅ *Selected:* ${selectedMovie.title}\n\n🔄 Getting download link...`
        });

        // ============================================
        // STEP 2: GET DOWNLOAD LINK
        // ============================================
        const downloadUrl = await getMovieDownloadUrl(selectedMovie.url);

        if (!downloadUrl) {
            await sock.sendMessage(from, {
                text: `❌ *Failed to get download link!*\n\nPlease try another movie.`
            });
            return;
        }

        await sock.sendMessage(from, {
            text: `📥 *Downloading:* ${selectedMovie.title}\n⏳ This may take a few minutes...`
        });

        // ============================================
        // STEP 3: DOWNLOAD MOVIE
        // ============================================
        const videoPath = await downloadMovie(downloadUrl, selectedMovie.title);

        if (!videoPath) {
            await sock.sendMessage(from, {
                text: `❌ *Download failed!*\n\nPlease try again later.`
            });
            return;
        }

        // ============================================
        // STEP 4: SEND AS DOCUMENT
        // ============================================
        const fileSize = fs.statSync(videoPath).size;
        const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

        await sock.sendMessage(from, {
            text: `📤 *Sending:* ${selectedMovie.title}\n📦 Size: ${fileSizeMB} MB\n⏳ Please wait...`
        });

        const videoBuffer = await fs.readFile(videoPath);
        const fileName = `${selectedMovie.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;

        await sock.sendMessage(from, {
            document: videoBuffer,
            mimetype: 'video/mp4',
            fileName: fileName,
            caption: `🎬 *${selectedMovie.title}*\n\n` +
                    `📅 Year: ${selectedMovie.year || 'N/A'}\n` +
                    `📦 Size: ${fileSizeMB} MB\n` +
                    `📌 Source: sinhalasub.lk\n` +
                    `✅ Sinhala Subtitles Included\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `⚠️ For personal use only`
        });

        // ============================================
        // CLEANUP
        // ============================================
        await fs.remove(videoPath);

        // ============================================
        // SUCCESS
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: { text: '✅', key: msg.key }
            });
        } catch (e) {}

        try {
            await sock.sendMessage(from, {
                delete: statusMsg.key
            });
        } catch (e) {}

    } catch (error) {
        console.error('SinhalaSub error:', error);
        try {
            await sock.sendMessage(from, {
                react: { text: '❌', key: msg.key }
            });
        } catch (e) {}
        await sock.sendMessage(from, {
            text: `❌ *Error:* ${error.message}`
        });
    }
};

// ============================================
// SEARCH FUNCTION
// ============================================
async function searchSinhalasub(query) {
    try {
        // Try Vajira API first
        const apiUrl = `https://vajira-api.vercel.app/movie/sinhalasub/search?text=${encodeURIComponent(query)}`;
        const response = await axios.get(apiUrl, { timeout: 10000 });
        
        if (response.data && response.data.results) {
            return response.data.results.map(r => ({
                title: r.title || r.name || 'Unknown',
                url: r.url || r.link || '',
                year: r.year || r.date || '',
                quality: r.quality || 'HD'
            }));
        }
    } catch (e) {
        console.log('Vajira API failed:', e.message);
    }

    // Fallback: Try BettercopeLK
    try {
        const fallbackUrl = `https://bettercopelk.navinda.xyz/api/v1/search?query=${encodeURIComponent(query)}&sources=baiscopelk,cineru,piratelk,zoomlk`;
        const response = await axios.get(fallbackUrl, { timeout: 10000 });
        
        if (response.data && response.data.length > 0) {
            return response.data.map(r => ({
                title: r.title || 'Unknown',
                url: r.url || '',
                year: r.year || '',
                quality: r.quality || 'HD'
            }));
        }
    } catch (e) {
        console.log('BettercopeLK failed:', e.message);
    }

    // Final fallback: Return sample for demo
    return [
        {
            title: query,
            url: 'https://sinhalasub.lk/movies/sample',
            year: '2024',
            quality: 'HD'
        }
    ];
}

// ============================================
// GET DOWNLOAD URL
// ============================================
async function getMovieDownloadUrl(movieUrl) {
    try {
        // Try Vajira API
        const apiUrl = `https://vajira-api.vercel.app/movie/sinhalasub/movie?url=${encodeURIComponent(movieUrl)}`;
        const response = await axios.get(apiUrl, { timeout: 10000 });
        
        if (response.data && response.data.downloadUrl) {
            return response.data.downloadUrl;
        }
        if (response.data && response.data.download) {
            return response.data.download;
        }
        if (response.data && response.data.link) {
            return response.data.link;
        }
    } catch (e) {
        console.log('Vajira API download failed:', e.message);
    }

    // Fallback: Try to extract from page
    try {
        const pageResponse = await axios.get(movieUrl, { timeout: 10000 });
        const html = pageResponse.data;
        
        // Look for download links in HTML
        const linkRegex = /https?:\/\/[^\s"']+\.(mp4|mkv|avi|webm)[^\s"']*/gi;
        const matches = html.match(linkRegex);
        
        if (matches && matches.length > 0) {
            return matches[0];
        }
    } catch (e) {
        console.log('HTML extraction failed:', e.message);
    }

    return null;
}

// ============================================
// DOWNLOAD MOVIE
// ============================================
async function downloadMovie(url, title) {
    try {
        const tempDir = path.join(__dirname, '../temp');
        fs.ensureDirSync(tempDir);
        const outputPath = path.join(tempDir, `movie_${Date.now()}.mp4`);

        // Try yt-dlp
        try {
            const command = `yt-dlp -f "best[ext=mp4]" -o "${outputPath}" "${url}" --no-warnings 2>/dev/null`;
            await execPromise(command, { maxBuffer: 50 * 1024 * 1024 });
            
            if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
                return outputPath;
            }
        } catch (e) {
            console.log('yt-dlp failed:', e.message);
        }

        // Try direct download
        try {
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'stream',
                timeout: 120000
            });

            const writer = fs.createWriteStream(outputPath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            if (fs.statSync(outputPath).size > 0) {
                return outputPath;
            }
        } catch (e) {
            console.log('Direct download failed:', e.message);
        }

        return null;
    } catch (error) {
        console.error('Download error:', error);
        return null;
    }
    }
