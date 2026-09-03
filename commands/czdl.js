// commands/czdl.js - FIXED DOWNLOAD HANDLER
const axios = require('axios');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const CZ_API = "https://cz-dnuz.vercel.app";

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        const inputData = args.join(" ").trim();
        
        if (!inputData.includes('||')) {
            await sock.sendMessage(from, {
                text: "❌ *Invalid format!* Please use the button to download."
            });
            return;
        }

        const parts = inputData.split(' || ');
        const title = parts[0] || 'Movie';
        const quality = parts[1] || 'Default';
        const resolvedUrl = parts[2] || '';
        const isPlayerFlag = parts[3] === 'true';

        console.log('Download request:', { title, quality, resolvedUrl, isPlayerFlag });

        if (!resolvedUrl) {
            await sock.sendMessage(from, {
                text: "❌ *No download URL found!*\n\nPlease try again with a different quality."
            });
            return;
        }

        try {
            await sock.sendMessage(from, {
                react: {
                    text: '📥',
                    key: msg.key
                }
            });

            await sock.sendMessage(from, {
                text: `🔄 *Downloading ${title} (${quality})...*\n⏳ Please wait...`
            });

            const caption = `🎬 *${title}*\n📥 *Quality:* ${quality}\n\n> 🎬 *EVA-MINI Cinesubz*`;

            let downloadSuccess = false;

            // ============================================
            // TRY DIRECT MP4 URL
            // ============================================
            if (resolvedUrl.includes('.mp4')) {
                try {
                    console.log('Trying direct MP4:', resolvedUrl);
                    await sock.sendMessage(from, {
                        document: { url: resolvedUrl },
                        mimetype: "video/mp4",
                        fileName: `${title} - ${quality}.mp4`,
                        caption: caption
                    });
                    downloadSuccess = true;
                } catch (e) {
                    console.log('Direct MP4 failed:', e.message);
                }
            }

            // ============================================
            // OLD API FALLBACK (for player links)
            // ============================================
            if (!downloadSuccess && isPlayerFlag) {
                try {
                    console.log('Trying Old API extraction...');
                    const htmlRes = await axios.get(resolvedUrl, { timeout: 15000 });
                    const htmlContent = htmlRes.data;

                    const match = htmlContent.match(/const ALL_QUALITIES = (\[.*?\]);/);
                    if (match) {
                        const qualities = JSON.parse(match[1]);
                        const reqQuality = quality.toLowerCase().includes('480p') ? '480p' : '720p';

                        const matchedQuality = qualities.find(q => 
                            q.html?.toLowerCase().includes(reqQuality) || 
                            q.url?.toLowerCase().includes(reqQuality)
                        );

                        if (matchedQuality && matchedQuality.url) {
                            await sock.sendMessage(from, {
                                document: { url: matchedQuality.url },
                                mimetype: "video/mp4",
                                fileName: `${title} - ${quality}.mp4`,
                                caption: caption
                            });
                            downloadSuccess = true;
                        }
                    }
                } catch (oldDlErr) {
                    console.log('Old API extraction failed:', oldDlErr.message);
                }
            }

            // ============================================
            // NEW API HANDLER
            // ============================================
            if (!downloadSuccess && !isPlayerFlag) {
                let downloadPageUrlOriginal = resolvedUrl.trim();
                downloadPageUrlOriginal = downloadPageUrlOriginal.replace(/\/(server\d+)\/\d+:\//g, '/$1/');

                if (downloadPageUrlOriginal.endsWith('.mp4') && !downloadPageUrlOriginal.includes('?ext=')) {
                    downloadPageUrlOriginal = downloadPageUrlOriginal.replace(/\.mp4$/, '?ext=mp4');
                }

                let downloadPageUrlFallback = downloadPageUrlOriginal.replace(/\/server\d+\//, '/server1/');

                const tryDownloadApi = async (urlToTry) => {
                    try {
                        const dlApiUrl = `${CZ_API}/download?url=${urlToTry}`;
                        console.log('Trying /download API:', dlApiUrl);
                        
                        const dlRes = await axios.get(dlApiUrl, { timeout: 20000 });
                        const dlData = dlRes.data;

                        if (dlData.success && dlData.result && dlData.result.downloadUrls) {
                            const httpUrl = dlData.result.downloadUrls.find(u => 
                                u.url && !u.url.includes('t.me/') && u.url.startsWith('http')
                            );

                            if (httpUrl && httpUrl.url) {
                                await sock.sendMessage(from, {
                                    document: { url: httpUrl.url },
                                    mimetype: "video/mp4",
                                    fileName: `${title} - ${quality}.mp4`,
                                    caption: caption
                                });
                                return true;
                            }
                        }
                        return false;
                    } catch (e) {
                        console.log('Download API error:', e.message);
                        return false;
                    }
                };

                downloadSuccess = await tryDownloadApi(downloadPageUrlOriginal);
                if (!downloadSuccess && downloadPageUrlFallback !== downloadPageUrlOriginal) {
                    downloadSuccess = await tryDownloadApi(downloadPageUrlFallback);
                }
            }

            // ============================================
            // IF ALL FAILED - SEND LINK
            // ============================================
            if (!downloadSuccess) {
                await sock.sendMessage(from, {
                    text: `⚠️ *Direct download failed!*\n\n📥 *Download Link:*\n${resolvedUrl}\n\n💡 Try opening this link in your browser.`
                });
                downloadSuccess = true; // Mark as handled
            }

            if (downloadSuccess) {
                await sock.sendMessage(from, {
                    react: {
                        text: '✅',
                        key: msg.key
                    }
                });
            }

        } catch (e) {
            console.error('Cinesubz DL Error:', e.message);
            await sock.sendMessage(from, {
                react: {
                    text: '❌',
                    key: msg.key
                }
            });
            await sock.sendMessage(from, {
                text: `❌ *Download Error:* ${e.message}\n\n📥 *Try this link:*\n${resolvedUrl}`
            });
        }

    } catch (error) {
        console.error('CZ Download error:', error);
        await sock.sendMessage(from, {
            text: `❌ *Error:* ${error.message}`
        });
    }
};
