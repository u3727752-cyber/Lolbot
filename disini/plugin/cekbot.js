import fs from "fs";
import settings from "../settings.js";

function buildReplyFunction(sock, from, m) {
    return async function reply(payload) {
        const logo = fs.existsSync('./logo.png') ? fs.readFileSync('./logo.png') : Buffer.alloc(0);
        let finalPayload = typeof payload === "string" ? { text: payload } : { ...payload };
        finalPayload.contextInfo = {
            ...(finalPayload.contextInfo || {}),
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: { newsletterJid: settings.chId, serverMessageId: 100, newsletterName: `BOT VERSION 2.1` },
            externalAdReply: { title: `⪨ YT ${settings.ownerName} ⪩`, body: `Powered by ${settings.ownerName}`, thumbnail: logo, mediaType: 1, renderLargerThumbnail: false }
        };
        return await sock.sendMessage(from, finalPayload, { quoted: m });
    };
}

function getNumber(jid) {
    if (!jid) return '';
    return jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
}

export const commands = {
    "cek": async (sock, m, options) => {
        const { from, isGroup } = options;
        const replyFn = buildReplyFunction(sock, from, m);

        if (!isGroup) return replyFn("❌ Perintah ini hanya untuk grup!");

        try {
            const metadata = await sock.groupMetadata(from);
            const participants = metadata.participants || [];

            const lidList = participants.filter(p => p.id.endsWith('@lid')).map(p => p.id);
            const jidList = participants.filter(p => p.id.endsWith('@s.whatsapp.net')).map(p => p.id);
            
            let lidToJid = {};
            let jidToLid = {};

            if (lidList.length > 0 && typeof sock.getLidToJidMap === 'function') {
                try {
                    lidToJid = await sock.getLidToJidMap(lidList) || {};
                } catch (e) {}
            }

            if (jidList.length > 0 && typeof sock.getJidToLidMap === 'function') {
                try {
                    jidToLid = await sock.getJidToLidMap(jidList) || {};
                } catch (e) {}
            }

            let txt = `📊 *STRUKTUR IDENTITAS & TRANSLASI JID*\n\n`;

            for (const p of participants) {
                const rawId = p.id;
                const status = (p.admin === 'admin' || p.admin === 'superadmin') ? 'ADMIN 👑' : 'MEMBER 👤';

                let finalLid = '';
                let finalJid = '';
                let finalNomor = '';

                if (rawId.endsWith('@lid')) {
                    finalLid = rawId;
                    finalJid = lidToJid[rawId] || '';
                    finalNomor = finalJid ? getNumber(finalJid) : '';
                } else if (rawId.endsWith('@s.whatsapp.net')) {
                    finalJid = rawId;
                    finalLid = jidToLid[rawId] || '';
                    finalNomor = getNumber(rawId);
                }

                txt += `🔹 *Raw ID dari Grup:* ${rawId}\n`;
                txt += `   ├── *LID (WhatsApp Baru):* ${finalLid || 'Gagal ditranslate'}\n`;
                txt += `   ├── *JID (WhatsApp Lama):* ${finalJid || 'Gagal ditranslate'}\n`;
                txt += `   ├── *Nomor HP Murni:* ${finalNomor ? '62' + finalNomor.replace(/^62/, '') : 'Gagal ditranslate'}\n`;
                txt += `   └── *Status:* ${status}\n\n`;
            }

            const allMentions = participants.map(p => p.id);
            await replyFn({ text: txt.trim(), contextInfo: { mentionedJid: allMentions } });

        } catch (e) {
            console.error("Cek error:", e);
            replyFn("❌ Gagal memetakan identitas grup!");
        }
    }
};
