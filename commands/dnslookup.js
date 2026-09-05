// commands/dnslookup.js - DNS Lookup for EVA-MINI
const dns = require('dns').promises;
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: {
                    text: '📡',
                    key: msg.key
                }
            });
        } catch (e) {}

        // ============================================
        // CHECK DOMAIN
        // ============================================
        const q = args.join(' ').trim();
        if (!q) {
            await sock.sendMessage(from, {
                text: `📡 *DNS Lookup Tool*\n\n📌 *Usage:* .dnslookup [domain]\n\n📝 *Example:* .dnslookup google.com\n\n🔍 *Get DNS records for any domain!*`
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
            text: `📡 *Looking up DNS for:* ${q}\n\n⏳ Please wait...`
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
        // DNS LOOKUP
        // ============================================
        try {
            const [aRecords, aaaaRecords, mxRecords, txtRecords, nsRecords, soaRecords] = await Promise.allSettled([
                dns.resolve4(q).catch(() => []),
                dns.resolve6(q).catch(() => []),
                dns.resolveMx(q).catch(() => []),
                dns.resolveTxt(q).catch(() => []),
                dns.resolveNs(q).catch(() => []),
                dns.resolveSoa(q).catch(() => [])
            ]);

            // ============================================
            // FORMAT RESULTS
            // ============================================
            let resultText = `📡 *DNS Lookup Results*\n\n`;
            resultText += `🌐 *Domain:* ${q}\n\n`;

            // A Records
            resultText += `🌍 *A Records (IPv4):*\n`;
            if (aRecords.status === 'fulfilled' && aRecords.value.length > 0) {
                aRecords.value.forEach(ip => {
                    resultText += `  • ${ip}\n`;
                });
            } else {
                resultText += `  ❌ None\n`;
            }
            resultText += `\n`;

            // AAAA Records
            resultText += `🌍 *AAAA Records (IPv6):*\n`;
            if (aaaaRecords.status === 'fulfilled' && aaaaRecords.value.length > 0) {
                aaaaRecords.value.forEach(ip => {
                    resultText += `  • ${ip}\n`;
                });
            } else {
                resultText += `  ❌ None\n`;
            }
            resultText += `\n`;

            // MX Records
            resultText += `📧 *MX Records (Mail Exchange):*\n`;
            if (mxRecords.status === 'fulfilled' && mxRecords.value.length > 0) {
                mxRecords.value.sort((a, b) => a.priority - b.priority);
                mxRecords.value.forEach(record => {
                    resultText += `  • ${record.exchange} (Priority: ${record.priority})\n`;
                });
            } else {
                resultText += `  ❌ None\n`;
            }
            resultText += `\n`;

            // TXT Records
            resultText += `📋 *TXT Records:*\n`;
            if (txtRecords.status === 'fulfilled' && txtRecords.value.length > 0) {
                txtRecords.value.forEach(record => {
                    const txt = Array.isArray(record) ? record.join('') : record;
                    resultText += `  • ${txt.substring(0, 100)}${txt.length > 100 ? '...' : ''}\n`;
                });
            } else {
                resultText += `  ❌ None\n`;
            }
            resultText += `\n`;

            // NS Records
            resultText += `🌐 *NS Records (Name Servers):*\n`;
            if (nsRecords.status === 'fulfilled' && nsRecords.value.length > 0) {
                nsRecords.value.forEach(ns => {
                    resultText += `  • ${ns}\n`;
                });
            } else {
                resultText += `  ❌ None\n`;
            }
            resultText += `\n`;

            // SOA Record
            resultText += `📋 *SOA Record (Start of Authority):*\n`;
            if (soaRecords.status === 'fulfilled' && soaRecords.value) {
                const soa = soaRecords.value;
                resultText += `  • Primary NS: ${soa.nsname}\n`;
                resultText += `  • Email: ${soa.hostmaster}\n`;
                resultText += `  • Serial: ${soa.serial}\n`;
                resultText += `  • Refresh: ${soa.refresh}\n`;
                resultText += `  • Retry: ${soa.retry}\n`;
                resultText += `  • Expire: ${soa.expire}\n`;
                resultText += `  • TTL: ${soa.ttl}\n`;
            } else {
                resultText += `  ❌ None\n`;
            }

            // ============================================
            // SEND RESULT
            // ============================================
            // Split if too long (WhatsApp limit ~65536 chars)
            if (resultText.length > 60000) {
                const parts = resultText.match(/.{1,60000}/g) || [resultText];
                for (const part of parts) {
                    await sock.sendMessage(from, { text: part });
                }
            } else {
                await sock.sendMessage(from, { text: resultText });
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

        } catch (error) {
            console.error('DNS lookup error:', error);
            await sock.sendMessage(from, {
                text: `❌ *DNS Error:* ${error.message}\n\nPlease check the domain name and try again.`
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
        console.error('DNS lookup command error:', error);
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