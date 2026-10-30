import fs from "fs";
import { downloadMediaMessage } from "@itsliaaa/baileys";
import sharp from "sharp";
import { buildReplyFunction as R, cleanupFile as C, msg } from "../function/global.js";

async function dl(s, q) { return await downloadMediaMessage({ message: q }, 'buffer', {}, { logger: console, reuploadRequest: s.updateMediaMessage }); }

function getMedia(m) {
    const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    let mk = null, md = null, iv = false;
    const check = (src) => {
        if (!md && src.imageMessage) { mk = "imageMessage"; md = src.imageMessage; }
        if (!md && src.videoMessage) { mk = "videoMessage"; md = src.videoMessage; iv = true; }
    };
    check(m.message||{});
    check(q||{});
    if (!md && q?.viewOnceMessageV2?.message) check(q.viewOnceMessageV2.message);
    if (!md && q?.viewOnceMessage?.message) check(q.viewOnceMessage.message);
    return { mk, md, iv };
}

export const commands = {
    "s": async (s, m, o) => {
        const r = R(s, o.from, m);
        try {
            const { mk, md, iv } = getMedia(m);
            if (!mk || !md) return r("❌ ᴋɪʀɪᴍ/ʙᴀʟᴀs ɢᴀᴍʙᴀʀ ᴀᴛᴀᴜ ᴠɪᴅᴇᴏ ᴅᴇɴɢᴀɴ *.s*");
            const buf = await dl(s, { [mk]: md });
            if (!buf) return r(msg.error);

            if (!fs.existsSync("./temp")) fs.mkdirSync("./temp", { recursive: true });
            const ti = `./temp/in_${Date.now()}.${iv?"mp4":"png"}`;
            const to = `./temp/out_${Date.now()}.webp`;
            fs.writeFileSync(ti, buf);

            await sharp(ti, { animated: iv }).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 60 }).toFile(to);
            await s.sendMessage(o.from, { sticker: fs.readFileSync(to) }, { quoted: m });
            C(ti); C(to);
        } catch (e) { console.error(e); r(msg.error); }
    },

    "sticker": async (s, m, o) => commands["s"](s, m, o),

    "toimg": async (s, m, o) => {
        const r = R(s, o.from, m);
        try {
            const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            let md = m.message?.stickerMessage || q?.stickerMessage || q?.viewOnceMessageV2?.message?.stickerMessage || q?.viewOnceMessage?.message?.stickerMessage;
            if (!md) return r("❌ ʙᴀʟᴀs sᴛɪᴋᴇʀ ᴅᴇɴɢᴀɴ *.toimg*");

            const buf = await dl(s, { stickerMessage: md });
            if (!buf) return r(msg.error);

            if (!fs.existsSync("./temp")) fs.mkdirSync("./temp", { recursive: true });
            const ti = `./temp/in_${Date.now()}.webp`, to = `./temp/out_${Date.now()}.png`;
            fs.writeFileSync(ti, buf);
            await sharp(ti).png().toFile(to);

            await s.sendMessage(o.from, { image: fs.readFileSync(to), caption: "✅ ʙᴇʀʜᴀsɪʟ ᴅɪᴜʙᴀʜ ᴋᴇ ɢᴀᴍʙᴀʀ" }, { quoted: m });
            C(ti); C(to);
        } catch (e) { console.error(e); r(msg.error); }
    },

    "toimage": async (s, m, o) => commands["toimg"](s, m, o)
};