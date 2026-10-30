import fs from "fs";
import { buildReplyFunction as R, msg } from "../function/global.js";

const API_TOKEN = "499a80a49f776dd30bb9f3a8083aee539ea26a73";
const SAFELINK_API = "https://safelinku.com/api/v1/links";
const SAFELINK_FILE_API = "https://safelinku.com/api/v1/files";

function cleanupFile(path) {
    try { if (fs.existsSync(path)) fs.unlinkSync(path); } catch {}
}

async function downloadMedia(msg) {
    const { downloadMediaMessage } = await import("@itsliaaa/baileys");
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return null;

    const type = Object.keys(quoted)[0];
    if (!["imageMessage", "videoMessage", "documentMessage", "audioMessage", "stickerMessage"].includes(type)) return null;

    const tmp = `/tmp/media_${Date.now()}.bin`;
    try {
        const buf = await downloadMediaMessage({ message: quoted }, "buffer", {}, {});
        fs.writeFileSync(tmp, buf);
        return tmp;
    } catch { return null; }
}

async function createShortLink(url, alias, passcode) {
    const payload = { url };
    if (alias) payload.alias = alias;
    if (passcode) payload.passcode = passcode;

    const res = await fetch(SAFELINK_API, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
}

async function uploadFileToSafelinku(filePath) {
    const fileData = fs.readFileSync(filePath);
    const fileName = filePath.split("/").pop();

    const form = new FormData();
    form.append("file", new Blob([fileData]), fileName);

    const res = await fetch(SAFELINK_FILE_API, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${API_TOKEN}`
        },
        body: form
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
}

export const commands = {
    "upsfl": async (s, m, o) => {
        const r = R(s, o.from, m);
        const args = o.args;
        let targetUrl = args[0] || "";
        let alias = args[1] || null;
        let passcode = args[2] || null;

        if (!targetUrl) return r(msg.invalidFormat(".upsfl", ".upsfl <url>\n.upsfl <url> <alias>\n.upsfl <url> <alias> <pass>"));

        try {
            r("⏳ Membuat short link...");
            const result = await createShortLink(targetUrl, alias, passcode);

            let teks = `✅ *Short Link Berhasil Dibuat!*\n\n`;
            teks += `🔗 *Short:* ${result.short_url || result.url || "Tidak tersedia"}\n`;
            teks += `📎 *Original:* ${targetUrl}\n`;
            if (alias) teks += `🏷️ *Alias:* ${alias}\n`;
            if (passcode) teks += `🔒 *Passcode:* ${passcode}\n`;

            r(teks);
        } catch (e) {
            r("❌ Gagal: " + e.message);
        }
    },
    "upsfl2": async (s, m, o) => {
        const r = R(s, o.from, m);
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted) return r(msg.invalidFormat(".upsfl2", "Reply file/media dengan caption .upsfl2"));

        const tmp = await downloadMedia(m);
        if (!tmp) return r("❌ Gagal mendownload media.");

        r("⏳ Upload file ke Safelinku...");
        try {
            const result = await uploadFileToSafelinku(tmp);
            cleanupFile(tmp);

            let teks = `✅ *File Berhasil Diupload!*\n\n`;
            teks += `🔗 *Link:* ${result.short_url || result.url || result.file_url || "Tidak tersedia"}\n`;

            r(teks);
        } catch (e) {
            cleanupFile(tmp);
            r("❌ Gagal upload: " + e.message);
        }
    }
};
