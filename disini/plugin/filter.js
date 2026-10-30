import fs from "fs";
import * as yaml from "js-yaml";
import { buildReplyFunction as R, msg } from "../function/global.js";

function load(from) {
    const dir = './db/filter', fp = `${dir}/${from}.yaml`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(fp)) {
        const d = { settings: { enabled: true }, filters: {} };
        fs.writeFileSync(fp, yaml.dump(d));
        return d;
    }
    try { return yaml.load(fs.readFileSync(fp, 'utf8')) || { settings: { enabled: true }, filters: {} }; } catch { return { settings: { enabled: true }, filters: {} }; }
}

function save(from, c) { const dir = './db/filter'; if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(`${dir}/${from}.yaml`, yaml.dump(c)); }

export const commands = {
    "filter": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);

        const a = o.args.join(" ");
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (a.toLowerCase() === "help") return r(`📝 *ᴘᴀɴᴅᴜᴀɴ ꜰɪʟᴛᴇʀ*\n\n1️⃣ .filter ᴋᴀᴛᴀ | ʀᴇsᴘᴏɴ\n2️⃣ .filter ᴇxᴀᴄᴛ:ᴋᴀᴛᴀ | ʀᴇsᴘᴏɴ\n3️⃣ .filter ᴋᴀᴛᴀ | ᴊᴀᴡᴀʙ1%%%ᴊᴀᴡᴀʙ2\n4️⃣ .filter (ᴋᴀᴛᴀ1,ᴋᴀᴛᴀ2) | ʀᴇsᴘᴏɴ\n5️⃣ ʀᴇᴘʟʏ ᴍᴇᴅɪᴀ .filter ᴋᴀᴛᴀ\n\n*ʜᴀᴘᴜs:* .delfilter ᴋᴀᴛᴀ\n*ʟɪsᴛ:* .listfilter\n*ᴏɴ/ᴏꜰꜰ:* .filteron / .filteroff`);

        if (q && (q.imageMessage || q.videoMessage || q.audioMessage || q.stickerMessage || q.documentMessage)) {
            if (!a) return r("❌ ᴍᴀsᴜᴋᴋᴀɴ ᴋᴇʏᴡᴏʀᴅ!");
            const c = load(o.from);
            c.filters[a.trim()] = { type: "mengandung", response: `[MEDIA:${Object.keys(q)[0]}]`, permission: "all", protect: false, media: true };
            save(o.from, c);
            return r(`✅ ꜰɪʟᴛᴇʀ ᴍᴇᴅɪᴀ *${a.trim()}* ᴅɪsɪᴍᴘᴀɴ!`);
        }

        if (!a) {
            const c = load(o.from);
            const keys = Object.keys(c.filters);
            if (!keys.length) return r("📭 ʙᴇʟᴜᴍ ᴀᴅᴀ ꜰɪʟᴛᴇʀ.\n\nKetik *.filter help*");
            let txt = `📋 *ᴅᴀꜰᴛᴀʀ ꜰɪʟᴛᴇʀ*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
            keys.forEach((k, i) => {
                const f = c.filters[k];
                txt += `${i+1}. *${k}* (${f.type||"mengandung"}, ${f.permission||"all"})\n`;
            });
            txt += `━━━━━━━━━━━━━━━━━━━━\n*ᴛᴏᴛᴀʟ:* ${keys.length} ꜰɪʟᴛᴇʀ`;
            return r(txt);
        }

        if (a.startsWith("(") && a.includes(")") && a.includes("|")) {
            const m = a.match(/^\((.*?)\)\s*\|\s*(.+)$/s);
            if (!m) return r(msg.invalidFormat(".filter (kata1,kata2)", ".filter (ʜᴀʟᴏ,ʜᴀɪ) | ᴊᴀᴡᴀʙᴀɴ"));
            const kws = m[1].split(",").map(k=>k.trim().replace(/"/g,""));
            const resp = m[2].trim();
            const c = load(o.from);
            for (const kw of kws) c.filters[kw] = { type: "mengandung", response: resp, permission: "all", protect: false };
            save(o.from, c);
            return r(`✅ *${kws.length}* ꜰɪʟᴛᴇʀ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ!\n🔑 ${kws.join(", ")}`);
        }

        if (a.includes(":")) {
            const parts = a.split("|");
            const fp = parts[0].trim();
            const tm = fp.match(/^"?(\w+):(.+?)"?$/);
            if (tm && ["exact","prefix","suffix","mengandung","regex"].includes(tm[1])) {
                const type = tm[1], kw = tm[2].replace(/"/g,"").trim(), resp = parts.slice(1).join("|").trim();
                if (!resp) return r("❌ ᴍᴀsᴜᴋᴋᴀɴ ʀᴇsᴘᴏɴ!");
                const c = load(o.from);
                c.filters[kw] = { type, response: resp, permission: "all", protect: false };
                save(o.from, c);
                return r(`✅ ꜰɪʟᴛᴇʀ *${type}:${kw}* ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ!`);
            }
        }

        if (a.includes("|") && a.split("|")[1].trim().includes("%%%")) {
            const parts = a.split("|"), kw = parts[0].trim(), resps = parts.slice(1).join("|").split("%%%").map(r=>r.trim()).filter(Boolean);
            if (resps.length<2) return r("❌ ᴍɪɴɪᴍᴀʟ 2 ᴊᴀᴡᴀʙᴀɴ!");
            const c = load(o.from);
            c.filters[kw] = { type: "mengandung", response: resps, permission: "all", protect: false };
            save(o.from, c);
            return r(`✅ ꜰɪʟᴛᴇʀ ʀᴀɴᴅᴏᴍ *${kw}* (${resps.length} ᴊᴀᴡᴀʙᴀɴ) ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ!`);
        }

        if (!a.includes("|")) return r(msg.invalidFormat(".filter", ".filter ᴋᴀᴛᴀ | ʀᴇsᴘᴏɴ"));

        const parts = a.split("|"), kw = parts[0].trim(), resp = parts.slice(1).join("|").trim();
        if (!kw || !resp) return r("❌ ᴍᴀsᴜᴋᴋᴀɴ ᴋᴇʏᴡᴏʀᴅ ᴅᴀɴ ʀᴇsᴘᴏɴ!");

        let perm = "all";
        if (resp.includes("{admin}") && !resp.includes("{user}")) perm = "admin";
        else if (resp.includes("{user}") && !resp.includes("{admin}")) perm = "user";

        if (resp === "noformat") {
            const c = load(o.from);
            const f = c.filters[kw];
            if (!f) return r(`❌ ꜰɪʟᴛᴇʀ *${kw}* ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ!`);
            return r(`📋 *RAW*\n\`\`\`${JSON.stringify(f,null,2)}\`\`\``);
        }

        const c = load(o.from);
        c.filters[kw] = { type: "mengandung", response: resp, permission: perm, protect: resp.includes("{protect}") };
        save(o.from, c);
        return r(`✅ ꜰɪʟᴛᴇʀ *${kw}* (${perm}) ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ!\n💬 ${resp}`);
    },

    "delfilter": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);
        const kw = o.args.join(" ").trim();
        if (!kw) return r("❌ ᴍᴀsᴜᴋᴋᴀɴ ᴋᴇʏᴡᴏʀᴅ!");
        const c = load(o.from);
        if (c.filters[kw]) { delete c.filters[kw]; save(o.from, c); return r(`✅ *${kw}* ᴅɪʜᴀᴘᴜs!`); }
        r(`❌ *${kw}* ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ!`);
    },

    "listfilter": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        const c = load(o.from);
        const keys = Object.keys(c.filters);
        if (!keys.length) return r("📭 ʙᴇʟᴜᴍ ᴀᴅᴀ ꜰɪʟᴛᴇʀ.");
        let txt = `📋 *ᴅᴀꜰᴛᴀʀ ꜰɪʟᴛᴇʀ*\n⚙️ ${c.settings?.enabled?"✅ ᴀᴋᴛɪꜰ":"❌ ɴᴏɴᴀᴋᴛɪꜰ"}\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        keys.forEach((k,i) => {
            const f = c.filters[k];
            txt += `*${i+1}. ${k}*\n   🎯 ${f.type||"mengandung"} | 👤 ${f.permission||"all"} | 🔒 ${f.protect?"YA":"TIDAK"}\n   💬 ${(Array.isArray(f.response)?f.response[0]:f.response).substring(0,50)}...\n\n`;
        });
        txt += `━━━━━━━━━━━━━━━━━━━━\n*ᴛᴏᴛᴀʟ:* ${keys.length} ꜰɪʟᴛᴇʀ`;
        r(txt);
    },

    "filteron": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);
        const c = load(o.from); c.settings.enabled = true; save(o.from, c);
        r("✅ ꜰɪʟᴛᴇʀ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ!");
    },

    "filteroff": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);
        const c = load(o.from); c.settings.enabled = false; save(o.from, c);
        r("❌ ꜰɪʟᴛᴇʀ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ!");
    }
};