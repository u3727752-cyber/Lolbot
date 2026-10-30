import fs from "fs";
import settings from "../settings.js";

function buildReplyFunction(sock, from, m) {
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
                newsletterName: `BOT VERSION 2.1`
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

export const commands = {
    "owner": async (sock, m, options) => {
        const { from } = options;
        const replyFn = buildReplyFunction(sock, from, m);

        const vcard = 'BEGIN:VCARD\nVERSION:3.0\nFN:Jun Official\nTEL;type=CELL;type=VOICE;waid=6285808630057:+62 815-5646-0844\nEND:VCARD';
        await sock.sendMessage(from, {
            contacts: {
                displayName: 'Jun Official',
                contacts: [{ vcard }]
            }
        }, { quoted: m });
    },

    "shutdown": async (sock, m, options) => {
        const { from, isOwner } = options;
        const replyFn = buildReplyFunction(sock, from, m);
        if (!isOwner) return replyFn("❌ Khusus owner!");

        await replyFn("🛑 *Bot shutting down...*");
        process.exit(0);
    },

    "restart": async (sock, m, options) => {
        const { from, isOwner } = options;
        const replyFn = buildReplyFunction(sock, from, m);
        if (!isOwner) return replyFn("❌ Khusus owner!");

        await replyFn("🔄 *Bot restarting...*");
        process.exit(1);
    }
};