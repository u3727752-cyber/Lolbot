import fs from "fs";
import settings from "../settings.js";

export function buildReplyFunction(sock, from, m) {
    return async function reply(payload) {
        const logo = fs.existsSync('./logo.png') ? fs.readFileSync('./logo.png') : Buffer.alloc(0);
        let finalPayload = typeof payload === "string" ? { text: payload } : { ...payload };
        finalPayload.contextInfo = {
            ...(finalPayload.contextInfo || {}),
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: settings.chId,
                serverMessageId: 100,
                newsletterName: `⏤͟͟͞͞𝗕𝗼𝘁 𝗡𝗲𝘄 𝗘𝗿𝗮 | 𝟮𝟬𝟮𝟯 - 𝟮𝟬𝟮𝟲`
            },
            externalAdReply: {
                title: `⪨ YT ${settings.ownerName} ⪩`,
                body: `Powered by ${settings.ownerName}`,
                thumbnail: logo,
                mediaType: 1,
                renderLargerThumbnail: false
            }
        };
        return await sock.sendMessage(from, finalPayload, { quoted: m });
    };
}

export function sendReaction(sock, key, emoji) {
    try { sock.sendMessage(key.remoteJid, { react: { text: emoji, key: key } }); } catch (e) {}
}

export function formatFileSize(bytes) {
    if (!bytes || bytes === "0" || isNaN(bytes)) return "?";
    const b = parseInt(bytes);
    if (b < 1024) return b + " B";
    if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
    return (b / 1048576).toFixed(1) + " MB";
}

export function formatNumber(num) {
    if (!num || num === "0") return "0";
    const n = parseInt(num);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
}

export function cleanupFile(filePath) {
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
}

export const msg = {
    onlyGroup: "❌ *ᴛʜɪs ꜰᴇᴀᴛᴜʀᴇ ɪs ᴏɴʟʏ ꜰᴏʀ ɢʀᴏᴜᴘs!*",
    onlyAdmin: "❌ *ᴏɴʟʏ ɢʀᴏᴜᴘ ᴀᴅᴍɪɴs ᴄᴀɴ ᴜsᴇ ᴛʜɪs ꜰᴇᴀᴛᴜʀᴇ!*",
    botNotAdmin: "❌ *ʙᴏᴛ ᴍᴜsᴛ ʙᴇ ᴀᴅᴍɪɴ ꜰɪʀsᴛ!*",
    onlyOwner: "❌ *ᴛʜɪs ꜰᴇᴀᴛᴜʀᴇ ɪs ᴏɴʟʏ ꜰᴏʀ ᴛʜᴇ ᴏᴡɴᴇʀ!*",
    onlyPrivate: "❌ *ᴛʜɪs ꜰᴇᴀᴛᴜʀᴇ ᴄᴀɴ ᴏɴʟʏ ʙᴇ ᴜsᴇᴅ ɪɴ ᴘʀɪᴠᴀᴛᴇ ᴄʜᴀᴛ!*",
    wait: "⏳ *ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ ᴀ ᴍᴏᴍᴇɴᴛ...*",
    error: "❌ *ᴀɴ ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ! ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.*",
    notFound: "❌ *ɴᴏᴛ ꜰᴏᴜɴᴅ!*",
    invalidFormat: (f, c) => `❌ *ɪɴᴠᴀʟɪᴅ ꜰᴏʀᴍᴀᴛ!*\n\n📌 *${f}*\n${c}`,
    success: "✅ *sᴜᴄᴄᴇss!*"
};