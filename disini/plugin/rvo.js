import { downloadMediaMessage } from "@itsliaaa/baileys";
import { buildReplyFunction as R, msg } from "../function/global.js";

export const commands = {
    "rvo": async (s, m, o) => {
        const r = R(s, o.from, m);
        try {
            const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!q) return r("❌ ʙᴀʟᴀs ᴘᴇsᴀɴ ᴠɪᴇᴡ ᴏɴᴄᴇ!");

            let vt = Object.keys(q)[0], md = q;
            if (vt === "viewOnceMessage" || vt === "viewOnceMessageV2") { md = q[vt].message; vt = Object.keys(md)[0]; }
            if (!["imageMessage","videoMessage","audioMessage"].includes(vt)) return r("❌ ʙᴜᴋᴀɴ ᴠɪᴇᴡ ᴏɴᴄᴇ!");

            const tm = vt.replace("Message","");
            const buf = await downloadMediaMessage({ message: md }, "buffer", {}, { logger: console, reuploadRequest: s.updateMediaMessage });
            if (!buf) return r(msg.error);

            await s.sendMessage(o.from, tm === "audio" ? { audio: buf, mimetype: "audio/mp4", ptt: true } : { [tm]: buf, caption: "✅ ʙᴇʀʜᴀsɪʟ ᴅɪʙᴜᴋᴀ" }, { quoted: m });
        } catch (e) { console.error(e); r(msg.error); }
    }
};