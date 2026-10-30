import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { buildReplyFunction as R, msg } from "../function/global.js";

const execPromise = promisify(exec);
const STATE_FILE = "./db/terminal_state.json";

let currentDir = "/root/botwa/usr/home";

if (!fs.existsSync(currentDir)) fs.mkdirSync(currentDir, { recursive: true });

if (fs.existsSync(STATE_FILE)) {
    try {
        const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
        if (state.currentDir && fs.existsSync(state.currentDir)) currentDir = state.currentDir;
    } catch {}
}

function saveState() {
    if (!fs.existsSync("./db")) fs.mkdirSync("./db", { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify({ currentDir }));
} 

const BLOCKED = ["rm -rf /", "rm -rf /*", "rm -rf ~", "mkfs", "dd if=", ":(){ :|:& };:", "fork bomb", "shutdown", "reboot", "halt", "poweroff", "chmod -R 777 /", "chmod 777 /"];

function isBlocked(cmd) {
    const lower = cmd.toLowerCase().replace(/\s+/g, " ");
    return BLOCKED.some(b => lower.includes(b));
}

function isSafe(dir) {
    const resolved = `${dir}/`.replace(/\/+/g, "/");
    return resolved.startsWith("/root/botwa/") || resolved === "/root/botwa/";
}

async function sendMedia(s, from, filePath, mime, fileName, quoted) {
    const type = mime.split("/")[0];
    const payload = { [type]: fs.readFileSync(filePath), mimetype: mime };
    if (type === "audio") { payload.ptt = false; payload.fileName = fileName; }
    if (type === "image" || type === "video") payload.caption = `🖥️ *Terminal Output*\n📁 \`${currentDir}\``;
    await s.sendMessage(from, payload, { quoted });
}

export const commands = {
    "help": async (s, m, o) => {
        const r = R(s, o.from, m);
        r(`🖥️ *TERMINAL HELP*

*.cmd* - Jalankan command shell (owner only)
Format: .<perintah> [argumen]

*📁 Navigasi:*
.cd <folder> - Pindah direktori
.pwd - Lihat direktori saat ini
.resetdir - Reset ke /root/botwa/usr/home

*📤 Output ke File:*
.cmd > file.ext - Simpan output ke file

*📥 Download & Kirim:*
.get <url> - Download & kirim langsung ke WA

*🎵 Audio:*
.get https://example.com/lagu.mp3
.wget <url> -O lagu.mp3

*🖼️ Gambar:*
.get https://example.com/foto.jpg

*🎬 Video:*
.get https://example.com/video.mp4

*🎞️ GIF/WebP:*
.get https://example.com/animasi.gif

*📄 Dokumen:*
.get https://example.com/file.pdf

*🔒 Hanya Owner!*`);
    },

    "$": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isOwner) return r(msg.onlyOwner);

        const cmd = o.args.join(" ") || o.text || "";
        const sendAsFile = o.sendAsFile || false;
        const fileName = o.fileName || `output_${Date.now()}.txt`;

        if (!cmd) return r("🖥️ *Terminal Ready*\n📁 `" + currentDir + "`\n\nKetik .help untuk panduan terminal.");

        if (isBlocked(cmd)) return r("❌ *Dangerous command blocked!*");

        try {
            if (cmd.trim().startsWith("cd ")) {
                const target = cmd.trim().substring(3).trim();
                let newDir = target.startsWith("/") ? target : `${currentDir}/${target}`.replace(/\/+/g, "/");
                newDir = newDir.replace(/\/$/, "") || "/";

                if (!isSafe(newDir) && newDir !== "/root/botwa") return r("❌ *Access denied!*");
                if (!fs.existsSync(newDir)) return r("❌ Directory not found: " + newDir);
                if (!fs.statSync(newDir).isDirectory()) return r("❌ Not a directory: " + newDir);

                currentDir = newDir;
                saveState();
                return r("📁 `" + currentDir + "`");
            }

            const { stdout, stderr } = await execPromise(cmd, { cwd: currentDir, timeout: 60000, maxBuffer: 50 * 1024 * 1024 });
            let output = (stdout || "") + (stderr || "");
            if (!output.trim()) output = "(no output)";

            if (sendAsFile) {
                const ext = path.extname(fileName) || ".txt";
                const tmp = path.join("/tmp", `term_${Date.now()}${ext}`);
                fs.writeFileSync(tmp, output);

                const stat = fs.statSync(tmp);
                const mimeMap = {
                    ".txt": "text/plain", ".html": "text/html", ".css": "text/css", ".js": "application/javascript",
                    ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                    ".gif": "image/gif", ".webp": "image/webp", ".mp4": "video/mp4", ".mp3": "audio/mpeg",
                    ".m4a": "audio/mp4", ".ogg": "audio/ogg", ".opus": "audio/ogg", ".svg": "image/svg+xml",
                    ".pdf": "application/pdf", ".zip": "application/zip"
                };
                const mime = mimeMap[ext.toLowerCase()] || "application/octet-stream";

                if (mime.startsWith("image/") || mime.startsWith("video/") || mime.startsWith("audio/")) {
                    await sendMedia(s, o.from, tmp, mime, fileName, m);
                } else {
                    await s.sendMessage(o.from, { document: fs.readFileSync(tmp), fileName, mimetype: mime, caption: `🖥️ *Output*\n📁 \`${currentDir}\`\n📦 ${(stat.size/1024).toFixed(1)} KB` }, { quoted: m });
                }

                try { fs.unlinkSync(tmp); } catch {}
                return;
            }

            if (output.length > 10000) {
                output = output.substring(0, 10000) + "\n\n... (dipotong, gunakan > file.txt untuk full output)";
            }

            r("🖥️ *Terminal*\n📁 `" + currentDir + "`\n```" + output + "```");

        } catch (e) {
            const err = (e.stderr || e.stdout || e.message || "Unknown error").substring(0, 2000);
            r("❌ *Error*\n📁 `" + currentDir + "`\n```" + err + "```");
        }
    },

    "get": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isOwner) return r(msg.onlyOwner);

        const url = o.args[0];
        if (!url) return r(msg.invalidFormat(".get", ".get <ᴜʀʟ>\n\nᴄᴏɴᴛᴏʜ:\n.get https://example.com/lagu.mp3"));

        const ext = path.extname(url.split("?")[0]) || ".bin";
        const name = url.split("/").pop().split("?")[0] || `download_${Date.now()}${ext}`;
        const tmp = path.join("/tmp", `get_${Date.now()}${ext}`);

        try {
            await execPromise(`wget -q --no-check-certificate "${url}" -O "${tmp}"`, { timeout: 60000 });

            if (!fs.existsSync(tmp) || fs.statSync(tmp).size === 0) {
                try { fs.unlinkSync(tmp); } catch {}
                return r("❌ Download gagal atau file kosong.");
            }

            const mimeMap = {
                ".txt": "text/plain", ".html": "text/html", ".css": "text/css", ".js": "application/javascript",
                ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                ".gif": "image/gif", ".webp": "image/webp", ".mp4": "video/mp4", ".mp3": "audio/mpeg",
                ".m4a": "audio/mp4", ".ogg": "audio/ogg", ".opus": "audio/ogg", ".svg": "image/svg+xml",
                ".pdf": "application/pdf", ".zip": "application/zip"
            };
            const mime = mimeMap[ext.toLowerCase()] || "application/octet-stream";
            const stat = fs.statSync(tmp);

            if (mime.startsWith("image/") || mime.startsWith("video/") || mime.startsWith("audio/")) {
                await sendMedia(s, o.from, tmp, mime, name, m);
            } else {
                await s.sendMessage(o.from, { document: fs.readFileSync(tmp), fileName: name, mimetype: mime, caption: `📥 *Download*\n📦 ${(stat.size/1024).toFixed(1)} KB` }, { quoted: m });
            }

            try { fs.unlinkSync(tmp); } catch {}

        } catch (e) {
            r("❌ Download error: " + (e.stderr || e.message || "Unknown"));
            try { fs.unlinkSync(tmp); } catch {}
        }
    },

    "pwd": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isOwner) return r(msg.onlyOwner);
        r("📁 `" + currentDir + "`");
    },

    "resetdir": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isOwner) return r(msg.onlyOwner);
        currentDir = "/root/botwa/usr/home";
        if (!fs.existsSync(currentDir)) fs.mkdirSync(currentDir, { recursive: true });
        saveState();
        r("✅ Directory reset to /root/botwa/usr/home");
    },

    "shell": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isOwner) return r(msg.onlyOwner);
        r("Ketik perintah dengan prefix titik.\nContoh: .ls, .cat file.txt, .pwd");
    },

    "ls": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isOwner) return r(msg.onlyOwner);

        const target = o.args[0] || ".";
        const dir = target.startsWith("/") ? target : path.join(currentDir, target);

        try {
            if (!fs.existsSync(dir)) return r("❌ Path not found: " + dir);
            if (!fs.statSync(dir).isDirectory()) return r("❌ Not a directory: " + dir);

            const items = fs.readdirSync(dir, { withFileTypes: true });
            const output = items.map(it => {
                const icon = it.isDirectory() ? "📁" : "📄";
                const full = path.join(dir, it.name);
                let size = "";
                try {
                    if (it.isFile()) size = ` (${(fs.statSync(full).size / 1024).toFixed(1)} KB)`;
                } catch {}
                return `${icon} ${it.name}${size}`;
            }).join("\n") || "(kosong)";

            r("📁 `" + dir + "`\n\n" + output);
        } catch (e) {
            r("❌ Error: " + e.message);
        }
    },

    "cat": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isOwner) return r(msg.onlyOwner);

        const target = o.args[0];
        if (!target) return r(msg.invalidFormat(".cat", ".cat <ꜰɪʟᴇ>"));

        const file = target.startsWith("/") ? target : path.join(currentDir, target);

        try {
            if (!fs.existsSync(file)) return r("❌ File not found: " + file);
            if (fs.statSync(file).isDirectory()) return r("❌ It's a directory, use .ls");

            let content = fs.readFileSync(file, "utf-8");
            if (content.length > 10000) content = content.substring(0, 10000) + "\n\n... (dipotong)";

            r("📄 `" + file + "`\n```" + content + "```");
        } catch (e) {
            r("❌ Error: " + e.message);
        }
    }
};