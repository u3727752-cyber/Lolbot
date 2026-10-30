import crypto from "crypto";
import fs from "fs";
import { downloadMediaMessage, generateWAMessageContent, generateWAMessageFromContent } from "@itsliaaa/baileys";
import { buildReplyFunction as R, msg } from "../function/global.js";
import settings from "../settings.js";

async function genMsg(s, c, cap, isChannel = false) {
    let m = {};
    if (c.type === "image") m = await generateWAMessageContent({ image: c.buffer, caption: cap }, { upload: s.waUploadToServer });
    else if (c.type === "video") m = await generateWAMessageContent({ video: c.buffer, caption: cap }, { upload: s.waUploadToServer });
    else if (c.type === "audio") m = await generateWAMessageContent({ audio: c.buffer, mimetype: "audio/mp4", ptt: true }, { upload: s.waUploadToServer });
    else m = await generateWAMessageContent({ text: cap }, { upload: s.waUploadToServer });
    return m;
}

async function getMedia(s, m) {
    const q = m.quoted ? m.quoted.message : m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!q) return null;
    const t = Object.keys(q)[0];
    if (!["imageMessage","videoMessage","audioMessage","stickerMessage"].includes(t)) return null;
    try {
        const buf = await downloadMediaMessage({ message: q }, "buffer", {}, {});
        return { buffer: buf, type: t.replace("Message",""), raw: q, isChannel: false };
    } catch { 
        try {
            const ctx = m.message?.extendedTextMessage?.contextInfo;
            if (ctx?.quotedMessage) {
                const q2 = ctx.quotedMessage;
                const t2 = Object.keys(q2)[0];
                if (!["imageMessage","videoMessage","audioMessage","stickerMessage"].includes(t2)) return null;
                const buf = await downloadMediaMessage({ message: q2 }, "buffer", {}, {});
                return { buffer: buf, type: t2.replace("Message",""), raw: q2, isChannel: true };
            }
        } catch {}
        return null;
    }
}

function checkAdmin(meta, sender, realSender, m) {
    const p = meta.participants || [];
    const clean = (jid) => (jid||'').split('@')[0].split(':')[0].replace(/[^0-9]/g,'');
    const cs = clean(sender);
    const cr = clean(realSender);
    let ok = p.some(p => {
        if (p.admin !== 'admin' && p.admin !== 'superadmin') return false;
        const cp = clean(p.id);
        return cp === cs || cp === cr || p.id === sender;
    });
    if (!ok) {
        const ctxP = m.message?.extendedTextMessage?.contextInfo?.participant;
        if (ctxP) {
            const cc = clean(ctxP);
            ok = p.some(p => {
                if (p.admin !== 'admin' && p.admin !== 'superadmin') return false;
                return clean(p.id) === cc || p.id === ctxP;
            });
        }
    }
    return ok;
}

function logo() { return fs.existsSync('./logo.png') ? fs.readFileSync('./logo.png') : Buffer.alloc(0); }

export const commands = {
    "upswgc": async (s, m, o) => {
        const r = R(s, o.from, m);
        const qm = m.quoted ? m.quoted.message : m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const cap = (o.text||"").trim();
        let media = null, mc = "";
        let isChannel = false;

        if (qm) {
            const mt = Object.keys(qm)[0];
            if (["imageMessage","videoMessage","audioMessage","stickerMessage"].includes(mt)) {
                media = await getMedia(s, m);
                if (media) {
                    if (qm[mt]?.caption) mc = qm[mt].caption;
                    if (cap) mc = cap;
                    isChannel = media.isChannel || false;
                }
            }
        }
        if (!media && !cap) return r(msg.invalidFormat(".upswgc", ".upswgc <ᴛᴇᴋs>\n.upswgc [ʀᴇᴘʟʏ ᴍᴇᴅɪᴀ] <ᴛᴇᴋs>"));

        let isAdm = o.isSenderAdmin;
        if (o.isGroup && !isAdm) {
            try { isAdm = checkAdmin(await s.groupMetadata(o.from), o.sender||m.key.participant||'', o.realSender, m); } catch {}
        }

        if (o.isOwner && !o.isGroup) {
            const id = "SW"+Date.now();
            if (!global.db.upswQueue) global.db.upswQueue = {};
            global.db.upswQueue[id] = { media, caption: mc||cap, time: Date.now(), from: o.from, isChannel };
            let all = [];
            try {
                const gcs = await s.groupFetchAllParticipating();
                for (const gid of Object.keys(gcs)) {
                    try { const meta = await s.groupMetadata(gid); all.push({ title: meta.subject.substring(0,30), id: gid, mc: meta.participants?.length||0 }); } catch {}
                }
                all.sort((a,b)=>b.mc-a.mc);
                const rows = all.map(g=>({ title: g.title, description: `👥 ${g.mc}`, id: `.swgc_send ${id} ${g.id}` }));
                if (all.length) rows.unshift({ title: "📢 SEMUA GROUP", description: `Kirim ke ${all.length} grup`, id: `.swgc_send_all ${id}` });
                const sec = [{ title: "📋 PILIH GROUP", highlight_label: `${all.length} Grup`, rows }];
                const prev = media ? `📎 Media + ${mc||'tanpa caption'}` : `📝 ${cap}`;
                const msg = generateWAMessageFromContent(o.from, {
                    viewOnceMessage: { message: { interactiveMessage: {
                        header: { title: "📤 UPLOAD STATUS", hasMediaAttachment: false },
                        body: { text: `*📤 KIRIM STATUS*\n📋 ${prev}\n⏰ Exp: 5 menit` },
                        footer: { text: `⚡ ${all.length} grup` },
                        nativeFlowMessage: { buttons: [{ name: "single_select", buttonParamsJson: JSON.stringify({ title: "📋 PILIH", sections: sec }) }] },
                        contextInfo: { mentionedJid: [o.realSender+"@s.whatsapp.net"], forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: settings.chId, serverMessageId: 100, newsletterName: `BOT V2.1` }, externalAdReply: { title: `⪨ YT ${settings.ownerName} ⪩`, body: `Powered by ${settings.ownerName}`, thumbnail: logo(), mediaType: 1, renderLargerThumbnail: false } }
                    }}}
                }, { userJid: o.from, quoted: m });
                await s.relayMessage(o.from, msg.message, { messageId: msg.key.id });
                return;
            } catch { return r(msg.error); }
        }

        if (o.isGroup && (isAdm || o.isOwner)) {
            try {
                let c = { type: "text", buffer: null }, fc = cap||mc||"";
                if (media) c = { type: media.type, buffer: media.buffer };
                const mct = await genMsg(s, c, fc, isChannel);
                const sec = crypto.randomBytes(32);
                const ms = await generateWAMessageFromContent(o.from, { groupStatusMessageV2: { message: { ...mct, messageContextInfo: { messageSecret: sec } } } }, { userJid: o.from });
                await s.relayMessage(o.from, ms.message, { messageId: ms.key.id });
                return r(`✅ *Status terkirim!*\n${media?"📎 Media":"📝 Teks"}: "${fc||'Tanpa caption'}"${isChannel ? ' (dari Channel)' : ''}`);
            } catch (e) { return r(msg.error); }
        }

        return r("❌ *AKSES DITOLAK*\nOwner (PC) / Admin grup");
    },

    "swgc_send": async (s, m, o) => {
        const r = R(s, o.from, m);
        const [qid, gid] = o.args;
        if (!qid||!gid) return r("❌ Invalid!");
        const d = global.db.upswQueue?.[qid];
        if (!d) return r("⚠️ Expired!");
        if (Date.now()-d.time>300000) { delete global.db.upswQueue[qid]; return r("⏰ Expired!"); }
        try {
            let c = { type: "text", buffer: null }, cap = d.caption||"";
            if (d.media) c = { type: d.media.type, buffer: d.media.buffer };
            const mct = await genMsg(s, c, cap, d.isChannel || false);
            const sec = crypto.randomBytes(32);
            const ms = await generateWAMessageFromContent(gid, { groupStatusMessageV2: { message: { ...mct, messageContextInfo: { messageSecret: sec } } } }, { userJid: gid });
            await s.relayMessage(gid, ms.message, { messageId: ms.key.id });
            delete global.db.upswQueue[qid];
            r("✅ Terkirim!");
        } catch { r(msg.error); }
    },

    "swgc_send_all": async (s, m, o) => {
        const r = R(s, o.from, m);
        const qid = o.args[0];
        if (!qid) return r("❌ Invalid!");
        const d = global.db.upswQueue?.[qid];
        if (!d) return r("⚠️ Expired!");
        if (Date.now()-d.time>300000) { delete global.db.upswQueue[qid]; return r("⏰ Expired!"); }
        let all = [];
        try { const gcs = await s.groupFetchAllParticipating(); for (const g of Object.keys(gcs)) all.push(g); } catch { return r(msg.error); }
        if (!all.length) return r("❌ Tidak ada grup.");
        let ok=0, f=0;
        for (const g of all) {
            try {
                let c = { type: "text", buffer: null }, cap = d.caption||"";
                if (d.media) c = { type: d.media.type, buffer: d.media.buffer };
                const mct = await genMsg(s, c, cap, d.isChannel || false);
                const sec = crypto.randomBytes(32);
                const ms = await generateWAMessageFromContent(g, { groupStatusMessageV2: { message: { ...mct, messageContextInfo: { messageSecret: sec } } } }, { userJid: g });
                await s.relayMessage(g, ms.message, { messageId: ms.key.id });
                ok++;
            } catch { f++; }
        }
        delete global.db.upswQueue[qid];
        r(`✅ *Selesai!*\n📤 ${ok} | ❌ ${f}`);
    }
};