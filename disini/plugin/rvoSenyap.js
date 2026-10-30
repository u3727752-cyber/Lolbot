import { downloadMediaMessage } from "@itsliaaa/baileys";
import { buildReplyFunction as R, sendReaction as react, msg } from "../function/global.js";

export const commands = {
    "ekhm": async (s, m, o) => {
        const r = R(s, o.from, m);
        try {
            const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!q) return react(s, m.key, "❌");

            react(s, m.key, "⏰");

            let vt = Object.keys(q)[0], md = q;
            if (vt === "viewOnceMessage" || vt === "viewOnceMessageV2") { md = q[vt].message; vt = Object.keys(md)[0]; }
            if (!["imageMessage","videoMessage","audioMessage"].includes(vt)) return react(s, m.key, "❌");

            const tm = vt.replace("Message","");
            const buf = await downloadMediaMessage({ message: md }, "buffer", {}, { logger: console, reuploadRequest: s.updateMediaMessage });

            const sender = (m.key.participant || m.key.remoteJid);
            const senderNum = sender.split("@")[0];

            await s.sendMessage(sender, {
                [tm]: buf,
                caption: `📩 *LOG BYPASS*\n👤 Dari: ${senderNum}\n📂 Tipe: ${tm.toUpperCase()}\n⏰ ${new Date().toLocaleTimeString("id-ID")}`,
                mimetype: md[vt]?.mimetype
            });

            react(s, m.key, "✅");
        } catch (e) {
            console.error(e);
            react(s, m.key, "❌");
            r(msg.error);
        }
    }
};