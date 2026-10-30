import fs from "fs";
import { generateWAMessageFromContent } from "@itsliaaa/baileys";
import { buildReplyFunction as R, msg } from "../function/global.js";

function resolveTarget(s, m, o) {
    const ctx = m.message?.extendedTextMessage?.contextInfo;
    if (ctx?.mentionedJid?.length) return ctx.mentionedJid[0];
    if (ctx?.participant) return ctx.participant;
    if (o.args[0]) {
        const n = o.args[0].replace(/[^0-9]/g, '');
        if (n) return n + (o.args[0].includes('@lid') ? '@lid' : '@s.whatsapp.net');
    }
    return null;
}

async function getMeta(s, from) {
    try { return await s.groupMetadata(from); } catch { return null; }
}

function isUserAdmin(meta, jid) {
    if (!meta) return false;
    const p = meta.participants.find(x => x.id === jid);
    return p?.admin === 'admin' || p?.admin === 'superadmin';
}

function isBotAdminInGroup(meta, botJid) {
    if (!meta) return false;
    const p = meta.participants.find(x => x.id === botJid);
    return p?.admin === 'admin' || p?.admin === 'superadmin';
}

export const commands = {
    "kick": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);

        const meta = await getMeta(s, o.from);
        const botJid = s.user.id.split(':')[0] + '@s.whatsapp.net';
        if (!isBotAdminInGroup(meta, botJid)) return r(msg.botNotAdmin);

        const users = resolveTarget(s, m, o);
        if (!users) return r(msg.invalidFormat(".kick", ".kick @ᴛᴀɢ / .kick ɴᴏᴍᴏʀ"));

        try {
            await s.groupParticipantsUpdate(o.from, [users], 'remove');
            r(`✅ *ʙᴇʀʜᴀsɪʟ ᴍᴇɴɢᴇʟᴜᴀʀᴋᴀɴ* @${users.split('@')[0]}`, { contextInfo: { mentionedJid: [users] } });
        } catch (e) { console.error(e); r(msg.error); }
    },

    "promote": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);

        const meta = await getMeta(s, o.from);
        const botJid = s.user.id.split(':')[0] + '@s.whatsapp.net';
        if (!isBotAdminInGroup(meta, botJid)) return r(msg.botNotAdmin);

        const users = resolveTarget(s, m, o);
        if (!users) return r(msg.invalidFormat(".promote", ".promote @ᴛᴀɢ / .promote ɴᴏᴍᴏʀ"));

        try {
            await s.groupParticipantsUpdate(o.from, [users], 'promote');
            r(`✅ *ʙᴇʀʜᴀsɪʟ ᴍᴇɴᴊᴀᴅɪᴋᴀɴ ᴀᴅᴍɪɴ* @${users.split('@')[0]}`, { contextInfo: { mentionedJid: [users] } });
        } catch (e) { console.error(e); r(msg.error); }
    },

    "demote": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);

        const meta = await getMeta(s, o.from);
        const botJid = s.user.id.split(':')[0] + '@s.whatsapp.net';
        if (!isBotAdminInGroup(meta, botJid)) return r(msg.botNotAdmin);

        const users = resolveTarget(s, m, o);
        if (!users) return r(msg.invalidFormat(".demote", ".demote @ᴛᴀɢ / .demote ɴᴏᴍᴏʀ"));

        try {
            await s.groupParticipantsUpdate(o.from, [users], 'demote');
            r(`✅ *ʙᴇʀʜᴀsɪʟ ᴍᴇɴᴜʀᴜɴᴋᴀɴ ᴊᴀʙᴀᴛᴀɴ* @${users.split('@')[0]}`, { contextInfo: { mentionedJid: [users] } });
        } catch (e) { console.error(e); r(msg.error); }
    },

    "tagall": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);

        const meta = await getMeta(s, o.from);
        if (!meta) return r(msg.error);

        const mentions = meta.participants.map(p => p.id);
        const pesan = o.args.join(" ") || "📢 ᴘᴇɴɢᴜᴍᴜᴍᴀɴ";

        const teks = `📢 *${pesan}*\n\n` + mentions.map(j => `@${j.split("@")[0]}`).join(" ");
        await s.sendMessage(o.from, { text: teks, mentions }, { quoted: m });
    },

    "hidetag": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);

        const meta = await getMeta(s, o.from);
        if (!meta) return r(msg.error);

        const mentions = meta.participants.map(p => p.id);
        const pesan = o.args.join(" ") || "p";
        const inv = mentions.map(j => `@${j.split("@")[0]}\u2063`).join("");

        await s.sendMessage(o.from, { text: `${pesan}\n\n${inv}`, mentions }, { quoted: m });
    },

    "linkgc": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);

        try {
            const code = await s.groupInviteCode(o.from);
            r(`🔗 *ʟɪɴᴋ ɢʀᴜᴘ*\n\nhttps://chat.whatsapp.com/${code}`);
        } catch (e) { console.error(e); r(msg.error); }
    },

    "revoke": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);

        const meta = await getMeta(s, o.from);
        const botJid = s.user.id.split(':')[0] + '@s.whatsapp.net';
        if (!isBotAdminInGroup(meta, botJid)) return r(msg.botNotAdmin);

        try {
            await s.groupRevokeInvite(o.from);
            const code = await s.groupInviteCode(o.from);
            r(`✅ *ʟɪɴᴋ ʙᴀʀᴜ*\n\nhttps://chat.whatsapp.com/${code}`);
        } catch (e) { console.error(e); r(msg.error); }
    },

    "setname": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);

        const meta = await getMeta(s, o.from);
        const botJid = s.user.id.split(':')[0] + '@s.whatsapp.net';
        if (!isBotAdminInGroup(meta, botJid)) return r(msg.botNotAdmin);

        const nama = o.args.join(" ");
        if (!nama) return r(msg.invalidFormat(".setname", ".setname <ɴᴀᴍᴀ ʙᴀʀᴜ>"));

        try {
            await s.groupUpdateSubject(o.from, nama);
            r(`✅ *ɴᴀᴍᴀ ɢʀᴜᴘ ᴅɪᴜʙᴀʜ*\n\n📝 ${nama}`);
        } catch (e) { console.error(e); r(msg.error); }
    },

    "setdesc": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);

        const meta = await getMeta(s, o.from);
        const botJid = s.user.id.split(':')[0] + '@s.whatsapp.net';
        if (!isBotAdminInGroup(meta, botJid)) return r(msg.botNotAdmin);

        const desc = o.args.join(" ");
        if (!desc) return r(msg.invalidFormat(".setdesc", ".setdesc <ᴅᴇsᴋʀɪᴘsɪ ʙᴀʀᴜ>"));

        try {
            await s.groupUpdateDescription(o.from, desc);
            r(`✅ *ᴅᴇsᴋʀɪᴘsɪ ɢʀᴜᴘ ᴅɪᴜʙᴀʜ*`);
        } catch (e) { console.error(e); r(msg.error); }
    },

    "open": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);

        const meta = await getMeta(s, o.from);
        const botJid = s.user.id.split(':')[0] + '@s.whatsapp.net';
        if (!isBotAdminInGroup(meta, botJid)) return r(msg.botNotAdmin);

        try {
            await s.groupSettingUpdate(o.from, 'not_announcement');
            r(`✅ *ɢʀᴜᴘ ᴅɪʙᴜᴋᴀ*\n\nSemua member bisa chat.`);
        } catch (e) { console.error(e); r(msg.error); }
    },

    "close": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);
        if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);

        const meta = await getMeta(s, o.from);
        const botJid = s.user.id.split(':')[0] + '@s.whatsapp.net';
        if (!isBotAdminInGroup(meta, botJid)) return r(msg.botNotAdmin);

        try {
            await s.groupSettingUpdate(o.from, 'announcement');
            r(`✅ *ɢʀᴜᴘ ᴅɪᴛᴜᴛᴜᴘ*\n\nCuma admin yang bisa chat.`);
        } catch (e) { console.error(e); r(msg.error); }
    },

    "listadmin": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);

        const meta = await getMeta(s, o.from);
        if (!meta) return r(msg.error);

        const admins = meta.participants.filter(p => p.admin);
        if (!admins.length) return r("📭 Gak ada admin.");

        let teks = `👑 *ᴅᴀꜰᴛᴀʀ ᴀᴅᴍɪɴ* (${admins.length})\n\n`;
        for (let i = 0; i < admins.length; i++) {
            const a = admins[i];
            let nomor = a.id.split('@')[0];
            if (a.id.endsWith('@lid') && s.findUserId) {
                try {
                    const res = await s.findUserId(a.id);
                    if (res?.phoneNumber) nomor = res.phoneNumber.split('@')[0];
                } catch {}
            }
            teks += `${i + 1}. ${nomor} ${a.admin === 'superadmin' ? '(Super Admin)' : ''}\n`;
        }

        r(teks);
    },

    "listmember": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);

        const meta = await getMeta(s, o.from);
        if (!meta) return r(msg.error);

        const members = meta.participants.filter(p => !p.admin);
        if (!members.length) return r("📭 Gak ada member biasa.");

        let teks = `👤 *ᴅᴀꜰᴛᴀʀ ᴍᴇᴍʙᴇʀ* (${members.length})\n\n`;
        const list = members.slice(0, 50);
        for (let i = 0; i < list.length; i++) {
            const mmb = list[i];
            let nomor = mmb.id.split('@')[0];
            if (mmb.id.endsWith('@lid') && s.findUserId) {
                try {
                    const res = await s.findUserId(mmb.id);
                    if (res?.phoneNumber) nomor = res.phoneNumber.split('@')[0];
                } catch {}
            }
            teks += `${i + 1}. ${nomor}\n`;
        }
        if (members.length > 50) teks += `\n... dan ${members.length - 50} lainnya`;

        r(teks);
    },

"del": async (s, m, o) => {
    if (!o.isGroup) return;
    if (!o.isSenderAdmin && !o.isOwner) return;

    const ctx = m.message?.extendedTextMessage?.contextInfo;
    const quoted = ctx?.quotedMessage;
    if (!quoted) return;

    const botJid = s.user.id.split(':')[0] + '@s.whatsapp.net';
    const isFromBot = ctx.participant === botJid || ctx.participant === s.user.id;

    try {
        if (isFromBot) {
            await s.sendMessage(o.from, { delete: {
                remoteJid: o.from,
                fromMe: true,
                id: ctx.stanzaId,
                participant: ctx.participant
            }});
        } else {
            await s.sendMessage(o.from, { delete: {
                remoteJid: o.from,
                fromMe: false,
                id: ctx.stanzaId,
                participant: ctx.participant
            }});
        }
        await s.sendMessage(o.from, { react: { text: "✅", key: m.key } });
    } catch (e) {
        console.error(e);
        await s.sendMessage(o.from, { react: { text: "❌", key: m.key } });
    }
},
"open": async (s, m, o) => {
    const r = R(s, o.from, m);
    if (!o.isGroup) return r(msg.onlyGroup);
    if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);

    const meta = await s.groupMetadata(o.from).catch(() => null);
    if (!meta) return r("❌ Gagal ambil info grup");

    const botNumber = s.user.id.split(':')[0].replace(/[^0-9]/g, '');
    const botJid = botNumber + '@s.whatsapp.net';
    const botLid = s.user.lid || '';

    const botP = meta.participants.find(p =>
        p.id === botJid ||
        p.id === botLid ||
        p.id.split('@')[0].replace(/[^0-9]/g, '') === botNumber
    );

    if (!botP || (botP.admin !== 'admin' && botP.admin !== 'superadmin')) {
        return r(`❌ *Bot bukan admin!*\n\nBot ID: ${botJid}\nBot LID: ${botLid || 'gak ada'}\n\nJadikan bot admin dulu.`);
    }

    try {
        await s.groupSettingUpdate(o.from, 'not_announcement');
        await s.sendMessage(o.from, { react: { text: "✅", key: m.key } });
    } catch (e) {
        console.error(e);
        await s.sendMessage(o.from, { react: { text: "❌", key: m.key } });
    }
},

"close": async (s, m, o) => {
    const r = R(s, o.from, m);
    if (!o.isGroup) return r(msg.onlyGroup);
    if (!o.isSenderAdmin && !o.isOwner) return r(msg.onlyAdmin);

    const meta = await s.groupMetadata(o.from).catch(() => null);
    if (!meta) return r("❌ Gagal ambil info grup");

    const botNumber = s.user.id.split(':')[0].replace(/[^0-9]/g, '');
    const botJid = botNumber + '@s.whatsapp.net';
    const botLid = s.user.lid || '';

    const botP = meta.participants.find(p =>
        p.id === botJid ||
        p.id === botLid ||
        p.id.split('@')[0].replace(/[^0-9]/g, '') === botNumber
    );

    if (!botP || (botP.admin !== 'admin' && botP.admin !== 'superadmin')) {
        return r(`❌ *Bot bukan admin!*\n\nBot ID: ${botJid}\nBot LID: ${botLid || 'gak ada'}\n\nJadikan bot admin dulu.`);
    }

    try {
        await s.groupSettingUpdate(o.from, 'announcement');
        await s.sendMessage(o.from, { react: { text: "✅", key: m.key } });
    } catch (e) {
        console.error(e);
        await s.sendMessage(o.from, { react: { text: "❌", key: m.key } });
    }
},
    "groupmenu": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isGroup) return r(msg.onlyGroup);

        const sections = [{
            title: "👥 ᴀɴɢɢᴏᴛᴀ",
            rows: [
                { title: "👢 ᴋɪᴄᴋ", description: "Keluarkan member", id: ".kick" },
                { title: "⬆️ ᴘʀᴏᴍᴏᴛᴇ", description: "Jadikan admin", id: ".promote" },
                { title: "⬇️ ᴅᴇᴍᴏᴛᴇ", description: "Turunkan admin", id: ".demote" },
                { title: "👑 ʟɪsᴛ ᴀᴅᴍɪɴ", description: "Daftar admin grup", id: ".listadmin" },
                { title: "👤 ʟɪsᴛ ᴍᴇᴍʙᴇʀ", description: "Daftar member grup", id: ".listmember" }
            ]
        }, {
            title: "⚙️ ᴘᴇɴɢᴀᴛᴜʀᴀɴ",
            rows: [
                { title: "📝 sᴇᴛ ɴᴀᴍᴀ", description: "Ganti nama grup", id: ".setname" },
                { title: "📄 sᴇᴛ ᴅᴇsᴋʀɪᴘsɪ", description: "Ganti deskripsi grup", id: ".setdesc" },
                { title: "🔓 ᴏᴘᴇɴ", description: "Buka grup", id: ".open" },
                { title: "🔒 ᴄʟᴏsᴇ", description: "Tutup grup", id: ".close" },
                { title: "🔗 ʟɪɴᴋ ɢᴄ", description: "Ambil link invite", id: ".linkgc" },
                { title: "🔄 ʀᴇᴠᴏᴋᴇ", description: "Reset link invite", id: ".revoke" }
            ]
        }, {
            title: "📢 ᴛᴀɢ & ᴍᴏᴅᴇʀᴀsɪ",
            rows: [
                { title: "📣 ᴛᴀɢ ᴀʟʟ", description: "Tag semua member", id: ".tagall" },
                { title: "👻 ʜɪᴅᴇ ᴛᴀɢ", description: "Tag invisible", id: ".hidetag" },
                { title: "🗑️ ᴅᴇʟ", description: "Hapus pesan (reply)", id: ".del" }
            ]
        }];

        const msgInteractive = generateWAMessageFromContent(o.from, {
            viewOnceMessage: { message: { interactiveMessage: {
                header: { title: "👥 ɢʀᴏᴜᴘ ᴍᴇɴᴜ", hasMediaAttachment: false },
                body: { text: "🔧 *Pengelolaan Grup*\n\nPilih menu di bawah untuk mengelola grup ini." },
                footer: { text: "⚡ ᴊᴜɴᴍᴏᴅs" },
                nativeFlowMessage: { buttons: [{ name: "single_select", buttonParamsJson: JSON.stringify({ title: "📋 ᴘɪʟɪʜ ᴍᴇɴᴜ", sections }) }] }
            }}}
        }, { userJid: o.from, quoted: m });

        await s.relayMessage(o.from, msgInteractive.message, { messageId: msgInteractive.key.id });
    }
};