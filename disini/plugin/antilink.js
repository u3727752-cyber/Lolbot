import fs from "fs";
import { generateWAMessageFromContent } from "@itsliaaa/baileys";
import { buildReplyFunction as R, msg } from "../function/global.js";

if (!fs.existsSync("./db/antilink/template.json")) {
    fs.mkdirSync("./db/antilink", { recursive: true });
    fs.writeFileSync("./db/antilink/template.json", JSON.stringify({
        gc: "chat.whatsapp.com", ch: "whatsapp.com/channel"
    }, null, 2));
}

function toggleAntilink(key, from, args) {
    const dbFile = `./db/antilink/${from}.json`;
    if (!fs.existsSync("./db/antilink")) fs.mkdirSync("./db/antilink", { recursive: true });
    let db = {};
    try { db = JSON.parse(fs.readFileSync(dbFile, "utf8")); } catch {}
    if (args[0] === "on") { db[key] = true; fs.writeFileSync(dbFile, JSON.stringify(db)); return true; }
    if (args[0] === "off") { db[key] = false; fs.writeFileSync(dbFile, JSON.stringify(db)); return false; }
    return db[key];
}

async function checkAntiLink(m, sock, from, isAdmin = false, isOwner = false) {
    if (!fs.existsSync(`./db/antilink/${from}.json`)) return;
    if (m.key.fromMe || isAdmin || isOwner) return;
    const db = JSON.parse(fs.readFileSync(`./db/antilink/${from}.json`, "utf8"));
    const tpl = JSON.parse(fs.readFileSync("./db/antilink/template.json", "utf8"));
    const text = m.text || m.conversation || m.caption || "";
    if (!text) return;
    const sender = m.key.participant || m.key.remoteJid;

    for (let k in db) {
        if (k === "custom") continue;
        if (db[k] && tpl[k] && new RegExp(tpl[k], "i").test(text)) {
            await sock.sendMessage(from, { delete: m.key });
            await sock.sendMessage(from, { text: `⚠️ *ANTILINK ${k.toUpperCase()}*\n\n📌 Link terdeteksi!\n🗑️ Pesan @${sender.split("@")[0]} dihapus.`, mentions: [sender] });
            return;
        }
    }
    if (db.custom?.length) {
        for (let c of db.custom) {
            if (text.toLowerCase().includes(c.url.toLowerCase())) {
                await sock.sendMessage(from, { delete: m.key });
                await sock.sendMessage(from, { text: `⚠️ *CUSTOM URL*\n\n📌 ${c.url} terdeteksi!\n🗑️ Pesan @${sender.split("@")[0]} dihapus.`, mentions: [sender] });
                return;
            }
        }
    }
}

function gen(from, header, body, buttons) {
    return generateWAMessageFromContent(from, {
        viewOnceMessage: { message: { interactiveMessage: { header, body, footer: { text: "🛡️ JunMods" }, nativeFlowMessage: { buttons } } } }
    }, { userJid: from });
}

export const commands = {
"antilink": async (s, m, o) => {
    const r = R(s, o.from, m);
    if (!o.isGroup) return r(msg.onlyGroup);
    if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);
    const sections = [
        { title: "🛡️ ANTILINK", rows: [
            { title: "ANTILINK GROUP", description: "Deteksi link grup WA", id: ".antilinkgc" },
            { title: "ANTILINK CHANNEL", description: "Deteksi link channel WA", id: ".antilinkch" },
            { title: "CUSTOM URL", description: "Filter URL custom", id: ".antilinkcustom" },
            { title: "STATUS ANTILINK", description: "Lihat semua status", id: ".statusantilink" },
            { title: "STATUS CUSTOM", description: "Lihat custom URL", id: ".statuscustom" }
        ]},
        { title: "⚡ CEPAT", rows: [
            { title: "AKTIFKAN SEMUA", description: "Nyalakan semua", id: ".antilinkallon" },
            { title: "NONAKTIFKAN SEMUA", description: "Matikan semua", id: ".antilinkalloff" }
        ]}
    ];
    const msg = gen(o.from, { title: "🛡️ ANTILINK SYSTEM" }, { text: "🛡️ *ANTILINK PROTECTION*\n\n• 🔗 GROUP\n• 📢 CHANNEL\n• 🔧 CUSTOM URL\n\n*⚡ Fast:*\n• ✅ AKTIFKAN SEMUA\n• ❌ NONAKTIFKAN SEMUA" }, [{ name: "single_select", buttonParamsJson: JSON.stringify({ title: "🛡️ PILIH", sections }) }]);
    await s.relayMessage(o.from, msg.message, { messageId: msg.key.id });
},

    "antilinkgc": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);
        const st = toggleAntilink("gc", o.from, o.args);
        const msg = gen(o.from, { title: "🛡️ ANTILINK GROUP" }, { text: `*Status:* ${st?"✅ AKTIF":"❌ NONAKTIF"}` }, [
            { name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "ON", copy_code: ".antilinkgc on" }) },
            { name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "OFF", copy_code: ".antilinkgc off" }) }
        ]);
        await s.relayMessage(o.from, msg.message, { messageId: msg.key.id });
    },

    "antilinkch": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);
        const st = toggleAntilink("ch", o.from, o.args);
        const msg = gen(o.from, { title: "📢 ANTILINK CHANNEL" }, { text: `*Status:* ${st?"✅ AKTIF":"❌ NONAKTIF"}` }, [
            { name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "ON", copy_code: ".antilinkch on" }) },
            { name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "OFF", copy_code: ".antilinkch off" }) }
        ]);
        await s.relayMessage(o.from, msg.message, { messageId: msg.key.id });
    },

    "statusantilink": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);
        if (!fs.existsSync(`./db/antilink/${o.from}.json`)) return r("📭 Belum ada pengaturan.");
        const db = JSON.parse(fs.readFileSync(`./db/antilink/${o.from}.json`, "utf8"));
        r(`*📊 STATUS ANTILINK*\n\n✅ GROUP: ${db.gc?"AKTIF":"NONAKTIF"}\n❌ CHANNEL: ${db.ch?"AKTIF":"NONAKTIF"}\n🔧 Custom: ${db.custom?.length||0}`);
    },

    "antilinkallon": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);
        const dbFile = `./db/antilink/${o.from}.json`;
        fs.writeFileSync(dbFile, JSON.stringify({ gc: true, ch: true }));
        r("✅ *Semua fitur antilink DIAKTIFKAN!*");
    },

    "antilinkalloff": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);
        const dbFile = `./db/antilink/${o.from}.json`;
        fs.writeFileSync(dbFile, JSON.stringify({ gc: false, ch: false }));
        r("❌ *Semua fitur antilink DINONAKTIFKAN!*");
    },

    "antilinkcustom": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);
        const a = o.args, dbFile = `./db/antilink/${o.from}.json`;
        let db = {};
        try { db = JSON.parse(fs.readFileSync(dbFile, "utf8")); } catch {}
        if (!db.custom) db.custom = [];

        if (!a[0]) return r("📋 *Custom URL*\n\n.antilinkcustom list\n.antilinkcustom add <url>\n.antilinkcustom del <url>");
        if (a[0] === "list") return r(db.custom.length ? `📋 *CUSTOM URL:*\n${db.custom.map((l,i)=>`${i+1}. ${l.url}`).join("\n")}` : "📭 Kosong.");
        if (a[0] === "add") {
            const url = a.slice(1).join(" ");
            if (!url) return r(msg.invalidFormat(".antilinkcustom add", ".antilinkcustom add google.com"));
            if (db.custom.some(l=>l.url===url)) return r("❌ URL sudah ada!");
            db.custom.push({ url });
            fs.writeFileSync(dbFile, JSON.stringify(db));
            r(`✅ *Ditambahkan!*\n🌐 ${url}`);
        } else if (a[0] === "del") {
            const url = a.slice(1).join(" ");
            if (!url) return r(msg.invalidFormat(".antilinkcustom del", ".antilinkcustom del google.com"));
            const i = db.custom.findIndex(l=>l.url===url);
            if (i===-1) return r("❌ URL tidak ditemukan!");
            db.custom.splice(i,1);
            fs.writeFileSync(dbFile, JSON.stringify(db));
            r(`✅ *Dihapus!*\n🌐 ${url}`);
        }
    },

    "statuscustom": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);
        if (!fs.existsSync(`./db/antilink/${o.from}.json`)) return r("📭 Belum ada pengaturan.");
        const db = JSON.parse(fs.readFileSync(`./db/antilink/${o.from}.json`, "utf8"));
        r(db.custom?.length ? `📋 *CUSTOM URL:*\n${db.custom.map((l,i)=>`🌐 ${i+1}. ${l.url}`).join("\n")}` : "📭 Kosong.");
    }
};

export { checkAntiLink, toggleAntilink };