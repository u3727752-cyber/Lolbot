import fs from "fs";
import * as yaml from "js-yaml";
import { buildReplyFunction as R, msg } from "../function/global.js";

const CFG = './db/yaml/respon.yaml';

function load() {
    if (!fs.existsSync(CFG)) {
        const d = { settings: { reply_in_group: true }, keywords: { exact: {}, partial: {}, prefix: {}, suffix: {}, regex: {} } };
        fs.mkdirSync("./db/yaml", { recursive: true });
        fs.writeFileSync(CFG, yaml.dump(d));
        return d;
    }
    try { return yaml.load(fs.readFileSync(CFG, 'utf8')) || {}; } catch { return { settings: {}, keywords: {} }; }
}

function save(c) { fs.mkdirSync("./db/yaml", { recursive: true }); fs.writeFileSync(CFG, yaml.dump(c)); }

const T = { sama: "exact", mengandung: "partial", diawali: "prefix", diakhiri: "suffix", regex: "regex" };
const L = { sama: "sᴀᴍᴀ ᴘᴇʀsɪs", mengandung: "ᴍᴇɴɢᴀɴᴅᴜɴɢ", diawali: "ᴅɪᴀᴡᴀʟɪ", diakhiri: "ᴅɪᴀᴋʜɪʀɪ", regex: "ʀᴇɢᴇx" };
const V = ["sama", "mengandung", "diawali", "diakhiri", "regex"];

export const commands = {
    "addrespon": async (s, m, o) => { 
        const r = R(s, o.from, m);
        if (!o.isOwner) return r(msg.onlyOwner);

        const a = o.args.join(" ");
        if (!a.includes("|")) {
            return r(
                `*📋 ꜰᴏʀᴍᴀᴛ ᴘᴇɴᴀᴍʙᴀʜᴀɴ ʀᴇsᴘᴏɴᴅᴇʀ*\n\n` +
                `*.addrespon <ᴛɪᴘᴇ> <ᴋᴇʏᴡᴏʀᴅ> | <ʀᴇsᴘᴏɴ>*\n\n` +
                `*🎯 ᴛɪᴘᴇ ᴛʀɪɢɢᴇʀ:*\n` +
                `┌ • \`sama\` - ᴛᴇᴋs ʜᴀʀᴜs ᴘᴇʀsɪs sᴀᴍᴀ\n` +
                `├ • \`mengandung\` - ᴛᴇᴋs ᴍᴇɴɢᴀɴᴅᴜɴɢ ᴋᴀᴛᴀ ᴋᴜɴᴄɪ\n` +
                `├ • \`diawali\` - ᴛᴇᴋs ᴅɪᴍᴜʟᴀɪ ᴅᴇɴɢᴀɴ ᴋᴀᴛᴀ ᴋᴜɴᴄɪ\n` +
                `├ • \`diakhiri\` - ᴛᴇᴋs ᴅɪᴀᴋʜɪʀɪ ᴅᴇɴɢᴀɴ ᴋᴀᴛᴀ ᴋᴜɴᴄɪ\n` +
                `└ • \`regex\` - ᴘᴏʟᴀ ʀᴇɢᴇx\n\n` +
                `*🏷️ ᴠᴀʀɪᴀʙᴇʟ:*\n` +
                `┌ • {username} - ɴᴀᴍᴀ ᴘᴇɴɢɪʀɪᴍ\n` +
                `├ • {nomor} - ɴᴏᴍᴏʀ ᴘᴇɴɢɪʀɪᴍ\n` +
                `├ • {time} - ᴊᴀᴍ sᴇᴋᴀʀᴀɴɢ\n` +
                `├ • {date} - ᴛᴀɴɢɢᴀʟ sᴇᴋᴀʀᴀɴɢ\n` +
                `├ • {group} - ɴᴀᴍᴀ ɢʀᴜᴘ\n` +
                `├ • {botname} - ɴᴀᴍᴀ ʙᴏᴛ\n` +
                `└ • {owner} - ɴᴀᴍᴀ ᴏᴡɴᴇʀ\n\n` +
                `*📝 ᴄᴏɴᴛᴏʜ:*\n` +
                `┌ .addrespon sama halo | ʜᴀʟᴏ ᴊᴜɢᴀ {username}!\n` +
                `├ .addrespon diawali assalamualaikum | ᴡᴀᴀʟᴀɪᴋᴜᴍsᴀʟᴀᴍ {username} 💕\n` +
                `├ .addrespon diakhiri malam | sᴇʟᴀᴍᴀᴛ ᴍᴀʟᴀᴍ {username} 🌙\n` +
                `├ .addrespon mengandung bot | _ɪʏᴀ ᴋᴀᴋ {username} ᴀᴅᴀ ʏᴀɴɢ ʙɪsᴀ sᴀʏᴀ ʙᴀɴᴛᴜ_\n` +
                `└ .addrespon regex \\\\bwoi\\\\b | ᴡᴏʏʏ {username}!`
            );
        }

        const parts = a.split("|");
        const fp = parts[0].trim().split(" ");
        const type = fp[0].toLowerCase();
        if (!V.includes(type)) return r(`❌ ᴛɪᴘᴇ *${type}* ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ!\n\nᴘɪʟɪʜ: ${V.join(", ")}`);

        const kw = fp.slice(1).join(" ");
        if (!kw) return r("❌ ᴍᴀsᴜᴋᴋᴀɴ ᴋᴇʏᴡᴏʀᴅ!");

        const resp = parts.slice(1).join("|").trim();
        if (!resp) return r("❌ ᴍᴀsᴜᴋᴋᴀɴ ʀᴇsᴘᴏɴ!");

        try {
            const c = load();
            if (!c.keywords[T[type]]) c.keywords[T[type]] = {};
            c.keywords[T[type]][kw] = resp;
            save(c);
            r(`✅ *ʀᴇsᴘᴏɴᴅᴇʀ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ!*\n\n🎯 *ᴛɪᴘᴇ:* ${L[type]}\n🔑 *ᴋᴇʏᴡᴏʀᴅ:* ${kw}\n💬 *ʀᴇsᴘᴏɴ:* ${resp}`);
        } catch (e) { console.error(e); r(msg.error); }
    },

    "delrespon": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isOwner) return r(msg.onlyOwner);

        const a = o.args.join(" ").trim();
        if (!a) return r(`*🗑️ ꜰᴏʀᴍᴀᴛ ᴘᴇɴɢʜᴀᴘᴜsᴀɴ*\n\n*.delrespon <ᴛɪᴘᴇ> <ᴋᴇʏᴡᴏʀᴅ>*\n\n🎯 ᴛɪᴘᴇ: ${V.join(" / ")}\n\n*ᴄᴏɴᴛᴏʜ:*\n.delrespon mengandung halo`);

        const parts = a.split(" ");
        const type = parts[0].toLowerCase();
        const kw = parts.slice(1).join(" ");
        if (!V.includes(type)) return r(`❌ ᴛɪᴘᴇ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ!`);
        if (!kw) return r("❌ ᴍᴀsᴜᴋᴋᴀɴ ᴋᴇʏᴡᴏʀᴅ!");

        try {
            const c = load();
            if (c.keywords[T[type]]?.[kw]) {
                delete c.keywords[T[type]][kw];
                save(c);
                r(`✅ ʀᴇsᴘᴏɴᴅᴇʀ *${kw}* (${type}) ʙᴇʀʜᴀsɪʟ ᴅɪʜᴀᴘᴜs.`);
            } else r(`❌ ᴋᴇʏᴡᴏʀᴅ *${kw}* ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ ᴅɪ ᴛɪᴘᴇ *${type}*.`);
        } catch (e) { console.error(e); r(msg.error); }
    },

    "listrespon": async (s, m, o) => {
        const r = R(s, o.from, m);
        try {
            const c = load();
            let t = 0, txt = `📋 *ᴅᴀꜰᴛᴀʀ sᴜᴘᴇʀ ʀᴇsᴘᴏɴᴅᴇʀ*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
            for (const [cat, label] of Object.entries({ exact: "🎯 sᴀᴍᴀ ᴘᴇʀsɪs", partial: "📝 ᴍᴇɴɢᴀɴᴅᴜɴɢ", prefix: "⬅️ ᴅɪᴀᴡᴀʟɪ", suffix: "➡️ ᴅɪᴀᴋʜɪʀɪ", regex: "🔍 ʀᴇɢᴇx" })) {
                const items = c.keywords?.[cat] || {};
                const keys = Object.keys(items);
                if (keys.length) {
                    t += keys.length;
                    txt += `*${label} (${keys.length})*\n`;
                    keys.forEach((k, i) => txt += `  ${i + 1}. ${k} → ${items[k].substring(0, 40)}...\n`);
                    txt += `\n`;
                }
            }
            txt += `━━━━━━━━━━━━━━━━━━━━\n*ᴛᴏᴛᴀʟ:* ${t} ʀᴇsᴘᴏɴᴅᴇʀ`;
            r(t ? txt : "📭 ʙᴇʟᴜᴍ ᴀᴅᴀ ʀᴇsᴘᴏɴᴅᴇʀ.");
        } catch (e) { console.error(e); r(msg.error); }
    },

    "exportrespon": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isOwner) return r(msg.onlyOwner);
        try {
            const c = load();
            const fp = './db/yaml/export_respon.json';
            fs.writeFileSync(fp, JSON.stringify(c.keywords, null, 2));
            await s.sendMessage(o.from, { document: fs.readFileSync(fp), fileName: "respon_backup.json", mimetype: "application/json", caption: "📤 *ᴇᴋsᴘᴏʀᴛ ʀᴇsᴘᴏɴᴅᴇʀ ʙᴇʀʜᴀsɪʟ!*" }, { quoted: m });
        } catch (e) { r(msg.error); }
    },

    "importrespon": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isOwner) return r(msg.onlyOwner);
        try {
            const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!q?.documentMessage) return r("❌ ʙᴀʟᴀs ꜰɪʟᴇ ᴊsᴏɴ ʜᴀsɪʟ ᴇᴋsᴘᴏʀᴛ!");
            const { downloadMediaMessage } = await import("@itsliaaa/baileys");
            const buf = await downloadMediaMessage({ message: q }, "buffer", {}, { logger: console, reuploadRequest: s.updateMediaMessage });
            const imp = JSON.parse(buf.toString('utf8'));
            const c = load();
            for (const [cat, items] of Object.entries(imp)) {
                if (!c.keywords[cat]) c.keywords[cat] = {};
                Object.assign(c.keywords[cat], items);
            }
            save(c);
            r(`✅ *ɪᴍᴘᴏʀᴛ ʙᴇʀʜᴀsɪʟ!*\n\n📥 *${Object.values(imp).reduce((sum, items) => sum + Object.keys(items).length, 0)}* ʀᴇsᴘᴏɴᴅᴇʀ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ.`);
        } catch (e) { r(msg.error); }
    }
};