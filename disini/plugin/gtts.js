import fs from "fs";
import path from "path";
import { exec } from "child_process";
import axios from "axios";
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
                newsletterName: `GTTS V1.0`
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

function cleanupFile(filePath) {
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
}

export const commands = {
    "gtts": async (sock, m, options) => {
        const { reply, args, from } = options;
        if (!args[0]) return reply("🎤 Mau suarain teks apa?\n\nContoh: *.gtts Halo semua!*");

        const text = args.join(" ");
        if (text.length > 200) return reply("❌ Teks terlalu panjang! Maksimal 200 karakter.");

        const replyFn = buildReplyFunction(sock, from, m);

        try {
            await sock.sendPresenceUpdate("recording", from);

            const response = await axios.get(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=id&client=tw-ob`, {
                responseType: 'arraybuffer',
                headers: { 'Referer': 'http://translate.google.com/', 'User-Agent': 'Mozilla/5.0' }
            });

            if (!fs.existsSync("./temp")) fs.mkdirSync("./temp", { recursive: true });

            const tmpFile = path.join("./temp", `tts_${Date.now()}.mp3`);
            const outFile = path.join("./temp", `tts_${Date.now()}.opus`);
            fs.writeFileSync(tmpFile, Buffer.from(response.data));

            exec(`ffmpeg -i ${tmpFile} -c:a libopus -b:a 32k -vbr on -compression_level 10 ${outFile}`, async (err) => {
                if (err) {
                    cleanupFile(tmpFile);
                    await sock.sendPresenceUpdate("paused", from);
                    return replyFn("❌ Gagal konversi audio.");
                }
                await sock.sendMessage(from, {
                    audio: fs.readFileSync(outFile),
                    mimetype: "audio/ogg; codecs=opus",
                    ptt: true
                }, { quoted: m });
                cleanupFile(tmpFile);
                cleanupFile(outFile);
                await sock.sendPresenceUpdate("paused", from);
            });

        } catch (e) {
            await sock.sendPresenceUpdate("paused", from);
            console.error("GTTS error:", e);
            replyFn("❌ Gagal memproses permintaan.");
        }
    },

    "tts": async (sock, m, options) => {
        return await commands["gtts"](sock, m, options);
    }
};