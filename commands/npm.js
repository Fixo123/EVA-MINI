// commands/npm.js - NPM Package Lookup for EVA-MINI
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
                    text: '📦',
                    key: msg.key
                }
            });
        } catch (e) {}

        // ============================================
        // CHECK PACKAGE NAME
        // ============================================
        const q = args.join(' ').trim();
        if (!q) {
            await sock.sendMessage(from, {
                text: `📦 *NPM Package Lookup*\n\n📌 *Usage:* .npm [package_name]\n\n📝 *Example:* .npm express\n\n🔍 *Get information about any npm package!*`
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
            text: `📦 *Searching npm for:* ${q}\n\n⏳ Please wait...`
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
        // FETCH PACKAGE INFO
        // ============================================
        try {
            const response = await axios.get(`https://registry.npmjs.org/${encodeURIComponent(q)}`, { 
                timeout: 15000,
                headers: {
                    'User-Agent': 'EVA-MINI-Bot/1.0'
                }
            });
            
            const pkg = response.data;
            const latest = pkg['dist-tags']?.latest || 'N/A';
            const info = pkg.versions[latest] || {};
            
            // ============================================
            // FORMAT RESULTS
            // ============================================
            let resultText = `📦 *NPM Package Info*\n\n`;
            resultText += `📌 *Name:* ${pkg.name || 'N/A'}\n`;
            resultText += `📌 *Version:* ${latest}\n`;
            resultText += `📌 *Description:* ${pkg.description || 'N/A'}\n\n`;
            
            // Author
            if (pkg.author) {
                const authorName = typeof pkg.author === 'string' ? pkg.author : pkg.author.name || 'N/A';
                resultText += `👤 *Author:* ${authorName}\n`;
            } else {
                resultText += `👤 *Author:* N/A\n`;
            }
            
            // License
            resultText += `📜 *License:* ${pkg.license || info.license || 'N/A'}\n`;
            
            // Homepage
            if (pkg.homepage) {
                resultText += `🌐 *Homepage:* ${pkg.homepage}\n`;
            }
            
            // Repository
            if (pkg.repository) {
                const repo = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository.url || 'N/A';
                resultText += `📂 *Repository:* ${repo.replace(/^git\+/, '').replace(/\.git$/, '')}\n`;
            }
            
            // Last modified
            if (pkg.time?.modified) {
                resultText += `📅 *Last Modified:* ${new Date(pkg.time.modified).toLocaleDateString()}\n`;
            }
            
            // Downloads link
            resultText += `📊 *Downloads:* https://www.npmjs.com/package/${pkg.name}\n\n`;
            
            // Keywords
            if (info.keywords && info.keywords.length > 0) {
                resultText += `🏷️ *Keywords:* ${info.keywords.slice(0, 5).join(', ')}${info.keywords.length > 5 ? '...' : ''}\n\n`;
            }
            
            // Dependencies
            if (info.dependencies && Object.keys(info.dependencies).length > 0) {
                const deps = Object.keys(info.dependencies).slice(0, 5);
                resultText += `📦 *Dependencies:* ${deps.join(', ')}${Object.keys(info.dependencies).length > 5 ? '...' : ''}\n\n`;
            }
            
            // Install command
            resultText += `📥 *Install:*\n\`npm install ${pkg.name}\`\n\n`;
            
            // Dev install
            resultText += `🔧 *Dev Install:*\n\`npm install --save-dev ${pkg.name}\``;

            // ============================================
            // SEND RESULT
            // ============================================
            await sock.sendMessage(from, { text: resultText });

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

        } catch (error) {
            console.error('NPM lookup error:', error);
            
            if (error.response && error.response.status === 404) {
                await sock.sendMessage(from, {
                    text: `❌ *Package not found:* "${q}"\n\nPlease check the package name and try again.`
                });
            } else {
                await sock.sendMessage(from, {
                    text: `❌ *Error fetching package:* ${error.message}\n\nPlease try again later.`
                });
            }
            
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
        console.error('NPM command error:', error);
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