import fs from "fs";
import settings from "../settings.js";

export function execute(ctx) {
    const { sock, msg } = ctx;
    const from = msg.key.remoteJid;

    const reply = async (payload) => {
        const logo = fs.existsSync('./logo.png') ? fs.readFileSync('./logo.png') : Buffer.alloc(0);
        let finalPayload = typeof payload === "string" ? { text: payload } : { ...payload };
        finalPayload.contextInfo = {
            ...(finalPayload.contextInfo || {}),
            forwardingScore: 999,
            isForwarded: true,
            externalAdReply: {
                title: `⪨ YT ${settings.ownerName} ⪩`,
                body: `Powered by ${settings.ownerName}`,
                thumbnail: logo,
                mediaType: 1,
                renderLargerThumbnail: false
            }
        };
        return await sock.sendMessage(from, finalPayload, { quoted: msg });
    };

    return { reply };
}