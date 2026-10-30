import crypto from "crypto";
import fs from "fs";
import { downloadMediaMessage, generateWAMessageContent, generateWAMessageFromContent } from "@itsliaaa/baileys";
import { buildReplyFunction as R, msg } from "../function/global.js";
import settings from "../settings.js";

async function genMsg(s, c, cap) {
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
        return { buffer: buf, type: t.replace("Message",""), raw: q };
    } catch { return null; }
}

function logo() { return fs.existsSync('./logo.png') ? fs.readFileSync('./logo.png') : Buffer.alloc(0); }

async function fetchSubscribedNewsletters(s) {
    try {
        if (typeof s.newsletterSubscribed === 'function') {
            return await s.newsletterSubscribed();
        }
    } catch {}
    if (settings.chId) {
        return [{ id: settings.chId, name: "Channel Utama", subscribers: 0 }];
    }
    return [];
}

export const commands = {
    "upswch": async (s, m, o) => {
        const r = R(s, o.from, m);
        const qm = m.quoted ? m.quoted.message : m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const cap = (o.text||"").trim();
        let media = null, mc = "";

        if (qm) {
            const mt = Object.keys(qm)[0];
            if (["imageMessage","videoMessage","audioMessage","stickerMessage"].includes(mt)) {
                media = await getMedia(s, m);
                if (media) { if (qm[mt]?.caption) mc = qm[mt].caption; if (cap) mc = cap; }
            }
        }
        if (!media && !cap) return r(msg.invalidFormat(".upswch", ".upswch <ᴛᴇᴋs>\n.upswch [ʀᴇᴘʟʏ ᴍᴇᴅɪᴀ] <ᴛᴇᴋs>"));

        if (!o.isOwner) return r("❌ *AKSES DITOLAK*\nHanya Owner yang dapat mengirim status ke Channel.");

        const id = "SWCH"+Date.now();
        if (!global.db.upswQueue) global.db.upswQueue = {};
        global.db.upswQueue[id] = { media, caption: mc||cap, time: Date.now(), from: o.from };
        
        let all = [];
        try {
            const chs = await fetchSubscribedNewsletters(s);
            for (const ch of chs) {
                if (ch?.id) all.push({ title: (ch.name || "Channel").substring(0,30), id: ch.id, mc: ch.subscribers || 0 });
            }
            if (!all.length) return r("❌ Tidak ditemukan Channel/Newsletter yang dikelola!");

            const rows = all.map(ch=>({ title: ch.title, description: `📢 Saluran Status`, id: `.swch_send ${id} ${ch.id}` }));
            if (all.length > 1) rows.unshift({ title: "📢 SEMUA CHANNEL STATUS", description: `Kirim status ke ${all.length} saluran`, id: `.swch_send_all ${id}` });
            
            const sec = [{ title: "📋 PILIH CHANNEL STATUS", highlight_label: `${all.length} Channel`, rows }];
            const prev = media ? `📎 Media + ${mc||'tanpa caption'}` : `📝 ${cap}`;
            
            const msgContent = generateWAMessageFromContent(o.from, {
                viewOnceMessage: { message: { interactiveMessage: {
                    header: { title: "📤 UPLOAD STATUS SALURAN (CHANNEL STORY)", hasMediaAttachment: false },
                    body: { text: `*📤 KIRIM STATUS SALURAN*\n📋 ${prev}\n⏰ Exp: 5 menit` },
                    footer: { text: `⚡ ${all.length} saluran` },
                    nativeFlowMessage: { buttons: [{ name: "single_select", buttonParamsJson: JSON.stringify({ title: "📋 PILIH CHANNEL", sections: sec }) }] },
                    contextInfo: { mentionedJid: [o.realSender+"@s.whatsapp.net"], forwardingScore: 999, isForwarded: true }
                }}}
            }, { userJid: o.from, quoted: m });

            await s.relayMessage(o.from, msgContent.message, { messageId: msgContent.key.id });
        } catch (err) { 
            console.error("UPSWCH Error:", err);
            return r("❌ Gagal memproses daftar Channel."); 
        }
    },

    "swch_send": async (s, m, o) => {
        const r = R(s, o.from, m);
        const [qid, chid] = o.args;
        if (!qid||!chid) return r("❌ Invalid!");
        const d = global.db.upswQueue?.[qid];
        if (!d) return r("⚠️ Expired!");
        if (Date.now()-d.time>300000) { delete global.db.upswQueue[qid]; return r("⏰ Expired!"); }
        try {
            let c = { type: "text", buffer: null }, cap = d.caption||"";
            if (d.media) c = { type: d.media.type, buffer: d.media.buffer };
            const mct = await genMsg(s, c, cap);
            const secret = crypto.randomBytes(32);
            
            const ms = generateWAMessageFromContent("status@broadcast", {
                newsletterMessage: {
                    ...mct,
                    messageContextInfo: { messageSecret: secret }
                }
            }, { userJid: chid });

            await s.relayMessage("status@broadcast", ms.message, { 
                messageId: ms.key.id,
                additionalNodes: [{
                    tag: "newsletter",
                    attrs: { jid: chid, type: "publisher" }
                }]
            });

            delete global.db.upswQueue[qid];
            r("✅ Status Saluran Terkirim!");
        } catch (err) { 
            console.error("SWCH_SEND Error:", err);
            r(msg.error); 
        }
    },

    "swch_send_all": async (s, m, o) => {
        const r = R(s, o.from, m);
        const qid = o.args[0];
        if (!qid) return r("❌ Invalid!");
        const d = global.db.upswQueue?.[qid];
        if (!d) return r("⚠️ Expired!");
        if (Date.now()-d.time>300000) { delete global.db.upswQueue[qid]; return r("⏰ Expired!"); }
        
        let all = [];
        try { 
            const chs = await fetchSubscribedNewsletters(s); 
            for (const ch of chs) if (ch?.id) all.push(ch.id); 
        } catch { return r(msg.error); }
        
        if (!all.length) return r("❌ Tidak ada channel yang diikuti/dikelola.");
        
        let ok=0, f=0;
        for (const chid of all) {
            try {
                let c = { type: "text", buffer: null }, cap = d.caption||"";
                if (d.media) c = { type: d.media.type, buffer: d.media.buffer };
                const mct = await genMsg(s, c, cap);
                const secret = crypto.randomBytes(32);
                
                const ms = generateWAMessageFromContent("status@broadcast", {
                    newsletterMessage: {
                        ...mct,
                        messageContextInfo: { messageSecret: secret }
                    }
                }, { userJid: chid });

                await s.relayMessage("status@broadcast", ms.message, { 
                    messageId: ms.key.id, 
                    additionalNodes: [{
                        tag: "newsletter",
                        attrs: { jid: chid, type: "publisher" }
                    }]
                });
                ok++;
            } catch { f++; }
        }
        delete global.db.upswQueue[qid];
        r(`✅ *Selesai Broadcast Status Saluran!*\n📤 ${ok} | ❌ ${f}`);
    }
};