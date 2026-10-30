import fs from "fs";
import moment from "moment-timezone";
import os from "os";
import { buildReplyFunction as R, msg } from "../function/global.js";

const SF = "./db/settings.json";

function save(d) {
    if (!fs.existsSync("./db")) fs.mkdirSync("./db", { recursive: true });
    fs.writeFileSync(SF, JSON.stringify(d, null, 2));
}

function load() {
    try {
        if (fs.existsSync(SF)) {
            const data = JSON.parse(fs.readFileSync(SF, "utf8"));
            global.db.config.autoRead = data.autoread || false;
            global.db.config.autoTyping = data.autotyping || false;
            global.db.config.autoReadSW = data.autoreadsw || false;
            global.db.config.botStatus = data.botStatus !== false;
            global.db.config.isSelf = data.isSelf || false;
        }
    } catch (e) {}
}

function toggle(s, m, o, key, emoji, label) {
    const r = R(s, o.from, m);
    if (!o.isOwner) return r(msg.onlyOwner);
    if (!o.args[0]) return r(`*⚙️ ${label}*\n\nStatus: ${global.db.config[key] ? "✅ ON" : "❌ OFF"}\n\nGunakan: .${o.command} on / off`);
    const st = o.args[0].toLowerCase() === "on";
    global.db.config[key] = st;
    save(global.db.config);
    s.sendMessage(o.from, { react: { text: emoji, key: m.key } });
    r(`✅ *${label}:* ${st ? "ON" : "OFF"}`);
}

load();

export const commands = {
    "autoread": (s, m, o) => toggle(s, m, o, "autoRead", "📖", "AUTO READ"),
    "autotyping": (s, m, o) => toggle(s, m, o, "autoTyping", "✍️", "AUTO TYPING"),
    "autoreadsw": (s, m, o) => toggle(s, m, o, "autoReadSW", "📖", "AUTO READ SW"),
    "bot": (s, m, o) => toggle(s, m, o, "botStatus", "⚡", "BOT STATUS"),

    "self": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isOwner) return r(msg.onlyOwner);
        if (!o.args[0]) return r(`*🔒 SELF MODE*\nStatus: ${global.db.config.isSelf ? "✅ ON" : "❌ OFF"}\n\nGunakan: .self on / off`);
        const st = o.args[0].toLowerCase() === "on";
        if (global.db.config.isSelf === st) return r(`⚠️ Sudah ${st ? "ON" : "OFF"}!`);
        global.db.config.isSelf = st;
        save(global.db.config);
        s.sendMessage(o.from, { react: { text: st ? "🔒" : "🔓", key: m.key } });
        r(st ? "🔒 *SELF MODE ON*\nHanya Owner yang bisa pakai bot." : "🌐 *SELF MODE OFF*\nSemua orang bisa pakai bot.");
    },

    "stats": async (s, m, o) => {
        const r = R(s, o.from, m);
        const u = process.uptime(), d = Math.floor(u/86400), h = Math.floor((u%86400)/3600);
        const up = d > 0 ? `${d}h ${h}j` : `${(u/3600).toFixed(2)}j`;
        const c = global.db.config;
        r(`*📊 STATS*\n🤖 ${s.user.id.split(':')[0]}\n⏳ ${up}\n💾 ${(process.memoryUsage().rss/1048576).toFixed(0)}MB\n🖥️ ${os.platform()}\n\n*⚙️ CONFIG*\n🔒 Self: ${c.isSelf?"ON":"OFF"}\n📖 Read: ${c.autoRead?"ON":"OFF"}\n📖 SW: ${c.autoReadSW?"ON":"OFF"}\n✍️ Type: ${c.autoTyping?"ON":"OFF"}\n🤖 Bot: ${c.botStatus?"ON":"OFF"}`);
    }
};