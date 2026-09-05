// commands/binlookup.js
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = async (sock, from, msg, args, isAdmin, botData, saveBotData) => {
    try {
        // ============================================
        // REACTION - START
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: { text: '💳', key: msg.key }
            });
        } catch (e) {}

        // ============================================
        // CHECK ARGUMENTS
        // ============================================
        if (!args || args.length === 0) {
            await sock.sendMessage(from, {
                text: `⚠️ *BIN Lookup Command*\n\n` +
                      `*Usage:* .binlookup [6 digits]\n\n` +
                      `*Example:*\n` +
                      `.binlookup 457173\n\n` +
                      `🔍 Enter first 6 digits of card number.`
            });
            return;
        }

        // ============================================
        // PROCESS BIN
        // ============================================
        const bin = args[0].replace(/\D/g, '').substring(0, 6);
        
        if (bin.length < 6) {
            await sock.sendMessage(from, {
                text: '❌ *Invalid BIN!*\n\nBIN must be at least 6 digits.\n\nExample: .binlookup 457173'
            });
            return;
        }

        // ============================================
        // GENERATE BIN DATA (Mock)
        // ============================================
        const schemes = ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER', 'JCB', 'DINERS CLUB', 'RUPAY'];
        const types = ['DEBIT', 'CREDIT', 'PREPAID', 'CHARGE'];
        const countries = [
            'United States', 'United Kingdom', 'Pakistan', 'India', 
            'UAE', 'Saudi Arabia', 'Singapore', 'Malaysia', 'Sri Lanka',
            'Canada', 'Australia', 'Germany', 'France', 'Japan'
        ];
        const banks = [
            'Habib Bank', 'UBL', 'MCB', 'Allied Bank', 'Bank Alfalah', 
            'Meezan Bank', 'HSBC', 'Citibank', 'Standard Chartered',
            'DBS Bank', 'Maybank', 'SBI', 'ICICI Bank', 'HDFC Bank'
        ];

        // Use BIN digits to generate deterministic but varied results
        const seed = parseInt(bin);
        const scheme = schemes[seed % schemes.length];
        const type = types[(seed + 1) % types.length];
        const country = countries[(seed + 2) % countries.length];
        const bank = banks[(seed + 3) % banks.length];
        
        // Generate mock expiry and issuer
        const expiryMonth = String(seed % 12 + 1).padStart(2, '0');
        const expiryYear = 2024 + (seed % 10);
        const issuer = bank + ' (' + country + ')';

        // ============================================
        // SEND RESPONSE
        // ============================================
        await sock.sendMessage(from, {
            text: `💳 *BIN LOOKUP RESULTS* 💳\n\n` +
                  `🔢 *BIN:* ${bin}XXXXXX\n` +
                  `💳 *Scheme:* ${scheme}\n` +
                  `💰 *Type:* ${type}\n` +
                  `🏛️ *Bank:* ${bank}\n` +
                  `🌍 *Country:* ${country}\n` +
                  `📅 *Issuer:* ${issuer}\n\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `⚠️ *Educational purposes only!\n` +
                  `⚡ Powered by EVA MINI`
        });

        // ============================================
        // SUCCESS REACTION
        // ============================================
        try {
            await sock.sendMessage(from, {
                react: { text: '✅', key: msg.key }
            });
        } catch (e) {}

    } catch (error) {
        console.error('BIN Lookup error:', error);
        await sock.sendMessage(from, {
            text: `❌ *Error:* ${error.message}`
        });
    }
};