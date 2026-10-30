import pkg from "@itsliaaa/baileys";
const { 
    makeWASocket, 
    fetchLatestBaileysVersion, 
    makeInMemoryStore, 
    useMultiFileAuthState, 
    DisconnectReason, 
    Browsers, 
    makeCacheableSignalKeyStore,
    downloadMediaMessage, 
    downloadContentFromMessage, 
    generateWAMessageContent, 
    generateWAMessageFromContent, 
    prepareWAMessageMedia, 
    generateWAMessage, 
    generateForwardMessageContent,
    getAggregateVotesInPollMessage,
    decodeJid, 
    jidDecode, 
    jidNormalizedUser, 
    areJidsSameUser, 
    extractMessageContent, 
    getContentType, 
    getDevice, 
    isJidGroup, 
    isJidStatusBroadcast, 
    isJidUser,
    proto, 
    WA_DEFAULT_EPHEMERAL, 
    delay, 
    WA_PROTO_VERSION, 
    S_WHATSAPP_NET, 
    WAMessageStatus, 
    WAMessageStubType,
    updateMessageWithReceipt,
    updateMessageWithReaction,
    parseInternalMessage,
    encryptSignalProto,
    decryptSignalProto,
    computeMessageYourself,
    generateMessageID,
    WA_MESSAGE_STUB_TYPES,
    readMessageHistory,
    historyReceipt,
    onUnexpectedError,
    unixTimestampSeconds,
    getHistoryMsg,
    transformCiphertext,
    useSingleFileAuthState
} = pkg;

const createWAMsg = generateWAMessageFromContent;
const getDeviceType = getDevice;

import sharp from "sharp";
import fs from "fs";
import os from "os";
import axios from "axios";
import FormData from "form-data";
import crypto from "crypto";
import { execSync, exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import moment from "moment-timezone";

import yaml from "js-yaml";

async function saveToDb(newData) {
    const dbPath = "./database/db_info.yaml";
    if (!fs.existsSync("./database")) fs.mkdirSync("./database");

    let currentDb = { logs: [] };

    if (fs.existsSync(dbPath)) {
        try {
            const fileContent = fs.readFileSync(dbPath, "utf8");
            currentDb = yaml.load(fileContent) || { logs: [] };
        } catch (e) {
            console.log("Error baca DB, reset database.");
        }
    }

    currentDb.logs.push(newData);
    fs.writeFileSync(dbPath, yaml.dump(currentDb, { lineWidth: -1, noRefs: true }));
}

export async function handleCommand(sock, m, { command, args, text, prefix, from, isOwner, isGroup, reply, config, realSender }) {
    console.log("COMMAND MASUK:", command);
    const sendMsg = reply;
    const q = text;
    try {
        switch (command) {
        
                    case "menu": {
                try {
                    const uptime = (process.uptime() / 3600).toFixed(2);
                    const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
                    const time = moment.tz('Asia/Jakarta').format('HH:mm:ss');
                    const date = moment.tz('Asia/Jakarta').format('DD MMMM YYYY');
                    const logoBuffer = fs.existsSync('./logo.png') ? fs.readFileSync('./logo.png') : Buffer.alloc(0);
                    const media = await prepareWAMessageMedia({ image: logoBuffer }, { upload: sock.waUploadToServer });

                    let greetText = `*Hi @${realSender} 👋 Selamat Datang!*

\`»  I N F O  «\`
┌  👤 *User* : @${realSender}
├  🕐 *Time* : ${time} WIB
├  📅 *Date* : ${date}
├  🚀 *Live* : ${uptime} Hours
└  💾 *RAM*  : ${ram} MB

Klik tombol *MENU UTAMA* di bawah untuk menjelajahi seluruh fitur bot, atau gunakan tombol salin untuk menyimpan ID milikmu.

Jika mengalami kendala atau kegagalan sistem, segera hubungi developer dengan mengetik \`.owner\`.`;

                    const msg = generateWAMessageFromContent(from, {
                        viewOnceMessage: {
                            message: {
                                interactiveMessage: {
                                    header: {
                                        title: "⚡ *JUN OFFICIAL ID DASHBOARD* ⚡",
                                        hasMediaAttachment: true,
                                        ...media
                                    },
                                    body: { text: greetText },
                                    footer: { text: "⚡ Powered by JunnMods" },
                                    nativeFlowMessage: {
                                        buttons: [
                                            {
                                                name: "quick_reply",
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: "🚀 MENU UTAMA",
                                                    id: ".ytta"
                                                })
                                            },
                                            {
                                                name: "cta_copy",
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: "📋 SALIN ID USER",
                                                    copy_code: `${realSender}@s.whatsapp.net`
                                                })
                                            }
                                        ]
                                    },
                                    contextInfo: {
                                        mentionedJid: [realSender + "@s.whatsapp.net"],
                                        forwardingScore: 999,
                                        isForwarded: true
                                    }
                                }
                            }
                        }
                    }, { userJid: from, quoted: m });

                    await sock.relayMessage(from, msg.message, { messageId: msg.key.id });
                } catch (e) {
                    console.error(e);
                }
                break;
            }

            case "ytta": {
                const uptime = (process.uptime() / 3600).toFixed(2);
                const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
                const platform = os.platform();
                const arch = os.arch();
                const time = moment.tz('Asia/Jakarta').format('HH:mm:ss');
                const date = moment.tz('Asia/Jakarta').format('DD MMMM YYYY');

                let menuText = `*Terimakasih telah menggunakan bot ini...*

\`»  P R O F I L E  «\`
└───────────────────
├ 👤 User   : @${realSender}
├ 🕐 Waktu  : ${time} WIB
├ 📅 Tgl    : ${date}
└───────────────────

\`»  S Y S T E M  «\`
└───────────────────
├ 🚀 Uptime : ${uptime} Jam
├ 💾 RAM    : ${ram} MB
├ 🖥️ Server : ${platform} (${arch})
└───────────────────

\`»  D O W N L O A D E R  «\`
└───────────────────
├ .tt / .ttmp3     • Video/MP3
├ .yt / .ytmp3     • Video/MP3  
├ .ig / .igmp3     • Reel/Video
├ .song / .play    • Cari Lagu
└───────────────────

\`»  U T I L I T Y  «\`
└───────────────────
├ .s               • Sticker Maker
├ .ai              • AI Assistant
├ .rvo             • Read View Once
├ .ekhm            • View Once Senyap
├ .rbg             • Remove Background
├ .gtts            • Text to Voice
├ .brat            • Sticker Brat Viral
└───────────────────

\`»  A D M I N   B O T  «\`
└───────────────────
├ .autoread on/off • Auto Centang
├ .self on/off     • Private Mode
├ .listowner       • Daftar Owner
├ .status          • Cek status bot
└───────────────────

━━━━━━━━━━━━━━━━━━━━

📄 *YT : JUN OFFICIAL*`;

                const logoPath = './logo.png';
                const mediaDoc = await prepareWAMessageMedia({ 
                    image: fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : { url: 'https://telegra.ph/file/default.jpg' } 
                }, { upload: sock.waUploadToServer });

                let msg = generateWAMessageFromContent(from, {
                    viewOnceMessage: {
                        message: {
                            interactiveMessage: {
                                header: {
                                    title: "⚡ *WELCOME TO BOT MENU* ⚡",
                                    hasMediaAttachment: true,
                                    ...mediaDoc
                                },
                                body: { text: menuText },
                                footer: { text: "Bot Wangsaf - JunnMods" },
                                nativeFlowMessage: {
                                    buttons: [
                                        {
                                            name: "single_select",
                                            buttonParamsJson: JSON.stringify({
                                                title: "KLIK DISINI",
                                                sections: [
                                                    {
                                                        title: "MAIN MENU",
                                                        rows: [
                                                            { title: "Downloader", id: ".dlmenu", description: "Menu unduh video & musik" },
                                                            { title: "Sticker Menu", id: ".stikermenu", description: "Menu pembuat sticker" },
                                                            { title: "AI Assistant", id: ".aimenu", description: "Tanya jawab dengan AI" },
                                                            { title: "Tools Utility", id: ".tolsmenu", description: "Alat bantu fungsional" },
                                                            { title: "Group Menu", id: ".groupmenu", description: "Perintah khusus grup" },
                                                            { title: "Owner Menu", id: ".ownermenu", description: "Khusus pengembang bot" },
                                                            { title: "Bot Status", id: ".status", description: "Cek performa bot" }
                                                        ]
                                                    }
                                                ]
                                            })
                                        },
                                        {
                                            name: "cta_url",
                                            buttonParamsJson: JSON.stringify({
                                                display_text: "STORE",
                                                url: "https://junofficial354.my.id"
                                            })
                                        },
                                        {
                                            name: "cta_url",
                                            buttonParamsJson: JSON.stringify({
                                                display_text: "OWNER",
                                                url: "https://wa.me/6285808630057"
                                            })
                                        }
                                    ]
                                },
                                contextInfo: {
                                    mentionedJid: [realSender + "@s.whatsapp.net"],
                                    forwardingScore: 999,
                                    isForwarded: true
                                }
                            }
                        }
                    }
                }, { userJid: from, quoted: m });

                await sock.relayMessage(from, msg.message, { messageId: msg.key.id });
                break;
            }

            case "dlmenu": {
                await reply("respon ok untuk tombol: Downloader");
                break;
            }

            case "stikermenu": {
                await reply("respon ok untuk tombol: Sticker Menu");
                break;
            }

            case "aimenu": {
                await reply("respon ok untuk tombol: AI Assistant");
                break;
            }

            case "tolsmenu": {
                await reply("respon ok untuk tombol: Tools Utility");
                break;
            }

            case "groupmenu": {
                await reply("respon ok untuk tombol: Group Menu");
                break;
            }

            case "ownermenu": {
                await reply("respon ok untuk tombol: Owner Menu");
                break;
            }



case "cekid": {
    const q = text;
    try {
        let link = (q || "").trim();
        
        if (!link || !link.includes("whatsapp.com")) {
            return reply(`*⚠️ LINK TIDAK DITEMUKAN*\n\nSilahkan masukkan link valid!\n\n*Contoh:*\nGroup: chat.whatsapp.com/xxx\nChannel: whatsapp.com/channel/xxx`);
        }

        let isNewsletter = link.includes("channel") || link.includes("newsletter");
        let typeLabel = isNewsletter ? "CHANNEL / NEWSLETTER" : "GROUP CHAT";
        
        let id, name, desc, pfpUrl, memberCount;

        try {
            if (isNewsletter) {
                let code = link.split("/").pop();
                let metadata = await sock.newsletterMetadata("invite", code);
                id = metadata.id;
                name = metadata.name;
                desc = metadata.description || "Tidak ada deskripsi.";
            } else {
                let code = link.split("chat.whatsapp.com/")[1]?.split("/")[0];
                let metadata = await sock.groupGetInviteInfo(code);
                id = metadata.id;
                name = metadata.subject;
                desc = metadata.desc || "Tidak ada deskripsi.";
                memberCount = metadata.size;
            }
            
            try { 
                pfpUrl = await sock.profilePictureUrl(id, 'image'); 
            } catch { 
                pfpUrl = null; 
            }
        } catch (err) {
            return reply("❌ *GAGAL:* Data tidak ditemukan. Pastikan link bener atau bot tidak kena limit.");
        }

        let infoText = `\`「 ID DETECTOR SYSTEM 」\`\n\n`;
        infoText += `┌  ◦  *Name:* ${name}\n`;
        infoText += `│  ◦  *Type:* ${typeLabel}\n`;
        if (memberCount) infoText += `│  ◦  *Members:* ${memberCount}\n`;
        infoText += `└  ◦  *ID:* \`${id}\`\n\n`;
        infoText += `*📝 DESCRIPTION:*\n${desc}\n\n`;
        infoText += `📄 *YT : JUN OFFICIAL*`;

        const logoPath = './logo.png';
        const imageBuffer = pfpUrl ? { url: pfpUrl } : (fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : { url: 'https://telegra.ph/file/default.jpg' });

        const media = await prepareWAMessageMedia({ image: imageBuffer }, { upload: sock.waUploadToServer });

        const msg = generateWAMessageFromContent(from, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            title: "⚡ *ID METADATA FOUND* ⚡",
                            hasMediaAttachment: true,
                            ...media
                        },
                        body: { 
                            text: infoText 
                        },
                        footer: { text: "JunMods - WhatsApp Automation" },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "cta_copy",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "📋 COPY ID",
                                        copy_code: id
                                    })
                                },
                                {
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "🔗 BUKA TAUTAN",
                                        url: link
                                    })
                                }
                            ]
                        },
                        contextInfo: {
                            mentionedJid: [realSender + "@s.whatsapp.net"],
                            forwardingScore: 999,
                            isForwarded: true
                        }
                    }
                }
            }
        }, { userJid: from, quoted: m });

        await sock.relayMessage(from, msg.message, { messageId: msg.key.id });

    } catch (e) {
        console.error("CEKID ERROR:", e);
        reply("❌ Terjadi kesalahan sistem.");
    }
    break;
}



            case "sysinfo": {
                const used = process.memoryUsage();
                await sendMsg(`*SYSTEM STATUS* 💻\n\n- RAM: ${(used.rss / 1024 / 1024).toFixed(2)} MB / ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB\n- Platform: ${os.platform()} (${os.arch()})\n- Uptime: ${(os.uptime() / 3600).toFixed(2)} Jam`);
                break;
            }

            case "owner": {
                const vcard = 'BEGIN:VCARD\nVERSION:3.0\nFN:Jun Official\nTEL;type=CELL;type=VOICE;waid=6285808630057:+62 815-5646-0844\nEND:VCARD';
                await sendMsg({ contacts: { displayName: 'Jun Official', contacts: [{ vcard }] } });
                break;
            }

            case "s":
            case "sticker": {
                const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
                const isImg = m.message.imageMessage || quoted?.imageMessage;
                const isVid = m.message.videoMessage || quoted?.videoMessage;
                
                if (isImg || isVid) {
                    const media = quoted ? (quoted.imageMessage ? { imageMessage: quoted.imageMessage } : { videoMessage: quoted.videoMessage }) : m.message;
                    const buffer = await downloadMediaMessage({ message: media }, "buffer", {}, { logger: console });
                    const tempIn = `./temp/in_${Date.now()}.${isVid ? "mp4" : "png"}`;
                    const tempOut = `./temp/out_${Date.now()}.webp`;
                    
                    if (!fs.existsSync("./temp")) fs.mkdirSync("./temp");
                    fs.writeFileSync(tempIn, buffer);
                    await sharp(tempIn, { animated: !!isVid })
                        .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
                        .webp({ quality: 50 })
                        .toFile(tempOut);
                    await sendMsg({ sticker: fs.readFileSync(tempOut) });
                    cleanupFile(tempIn);
                    cleanupFile(tempOut);
                } else {
                    await sendMsg("Balas gambar/video dengan caption .s");
                }
                break;
            }

            case "ai":
            case "tanya": {
                if (!args[0]) return await sendMsg("Mau nanya apa?");
                const query = args.join(" ");
                const key = "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";
                
                try {
                    await sock.sendPresenceUpdate("composing", from);
                    const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
                        model: "google/gemini-2.0-flash:free",
                        messages: [{ role: "user", content: query }]
                    }, {
                        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" }
                    });
                    await sock.sendPresenceUpdate("paused", from);
                    await sendMsg(response.data.choices[0].message.content);
                } catch (e) {
                    await sock.sendPresenceUpdate("paused", from);
                    await sendMsg("❌ Maaf, AI sedang sibuk. Coba lagi nanti ya!");
                }
                break;
            }

            case "rvo": {
                try {
                    const quotedM = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                    if (!quotedM) return await sendMsg("Balas pesan View Once!");
                    
                    let vType = Object.keys(quotedM)[0];
                    let mediaM = quotedM;
                    
                    if (vType === "viewOnceMessage" || vType === "viewOnceMessageV2") {
                        mediaM = quotedM[vType].message;
                        vType = Object.keys(mediaM)[0];
                    }
                    
                    if (!["imageMessage", "videoMessage", "audioMessage"].includes(vType)) return await sendMsg("Bukan View Once!");
                    
                    const buffer = await downloadMediaAsBuffer(mediaM[vType], vType.replace("Message", ""));
                    const typeMedia = vType.replace("Message", "");
                    
                    if (typeMedia === "audio") {
                        await sendMsg({ audio: buffer, mimetype: "audio/mp4", ptt: true });
                    } else {
                        await sendMsg({ [typeMedia]: buffer, caption: "✅ *Berhasil Dibuka*", mimetype: mediaM[vType].mimetype });
                    }
                } catch (e) {
                    await sendMsg("Gagal membuka View Once.");
                }
                break;
            }

            case "rbg":
            case "removebg": {
                const quotedM = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
                const isImg = m.message.imageMessage || quotedM?.imageMessage;
                if (!isImg) return await sendMsg("Balas gambar!");
                
                try {
                    await sendMsg("⏳ Sedang memproses...");
                    const media = quotedM ? { imageMessage: quotedM.imageMessage } : m.message;
                    const buffer = await downloadMediaMessage({ message: media }, "buffer", {}, { logger: console });
                    const form = new FormData();
                    form.append("image", buffer, { filename: "image.png" });
                    
                    const response = await axios.post("https://api.vreden.my.id/api/removebg", form, {
                        headers: { ...form.getHeaders() },
                        responseType: "arraybuffer"
                    });
                    
                    await sendMsg({ image: Buffer.from(response.data), caption: "✅ Background berhasil dihapus!" });
                } catch (e) {
                    await sendMsg("❌ Gagal hapus background.");
                }
                break;
            }

            case "ads": {
                await sendMsg(`📢 *INFO JUN OFFICIAL ID*\nTop Up Game Murah & Legal hanya di:\n🌐 https://junofficial354.my.id\n\n_Proses Kilat, Harga Bersahabat!_\n\nBaca Blog Kami Agar terhindar dari kesalahpahaman\n> junofficial354.my.id/blog`);
                break;
            }



case "upswgc": {
    const quotedMsg = m.quoted ? m.quoted.message : m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const caption = text || "";

    let content = {};
    if (quotedMsg) {
        const mediaKey = Object.keys(quotedMsg).find(k => ["imageMessage", "videoMessage", "audioMessage"].includes(k));
        if (!mediaKey) {
            content = { text: caption || "📢 *PENGUMUMAN*" };
        } else {
            const buf = await downloadMediaMessage(m.quoted ? m.quoted : { message: quotedMsg }, "buffer", {}, { logger: console });
            if (mediaKey === "imageMessage") content = { image: buf, caption: caption };
            else if (mediaKey === "videoMessage") content = { video: buf, caption: caption };
            else if (mediaKey === "audioMessage") content = { audio: buf, mimetype: quotedMsg[mediaKey].mimetype, ptt: true };
        }
    } else if (caption) {
        content = { text: caption };
    } else {
        return sock.sendMessage(from, { text: "📝 *Masukkan teks atau reply media!*\nContoh: .upswgc Halo semua" }, { quoted: m });
    }

    const inside = await generateWAMessageContent(content, { upload: sock.waUploadToServer });
    const id = "SW-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    const msgId = "JUNN" + Date.now();

    const allGcs = await sock.groupFetchAllParticipating();
    const sortedGcs = Object.values(allGcs)
        .sort((a, b) => (b.size || b.participants?.length || 0) - (a.size || a.participants?.length || 0))
        .slice(0, 10);

    const buttons = sortedGcs.map(gc => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
            display_text: gc.subject.slice(0, 25),
            id: `upsw_action|${id}|${gc.id}`
        })
    }));

    buttons.push({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
            display_text: "📢 SEMUA GRUP",
            id: `upsw_action|${id}|all`
        })
    });

    const buttonMessage = {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    header: { title: "📤 *GROUP STORY MANAGER*", hasMediaAttachment: false },
                    body: { text: `Pilih target grup untuk mengirim:\n\n${content.image ? "🖼️ Gambar" : content.video ? "🎥 Video" : content.audio ? "🎵 Audio" : "📝 Teks"}\n${caption ? `\n💬 *Caption:* ${caption.substring(0, 50)}` : ""}` },
                    footer: { text: "Pilih salah satu grup di bawah" },
                    nativeFlowMessage: { buttons: buttons }
                }
            }
        }
    };

    const sentMsg = await sock.relayMessage(from, buttonMessage.viewOnceMessage.message, { quoted: m, messageId: msgId });

    if (!global.db.upswQueue) global.db.upswQueue = {};
    global.db.upswQueue[id] = { 
        content: inside, 
        time: Date.now(),
        from: from,
        msgKey: { remoteJid: from, fromMe: true, id: msgId }
    };

    setTimeout(async () => {
        if (global.db.upswQueue[id] && (Date.now() - global.db.upswQueue[id].time) > 120000) {
            delete global.db.upswQueue[id];
            try {
                await sock.sendMessage(from, { delete: { remoteJid: from, fromMe: true, id: msgId } });
            } catch(e) {}
        }
    }, 120000);
    break;
}

case "upsw_action": {
    const targetId = args[0];
    const targetJid = args[1];

    if (!global.db.upswQueue || !global.db.upswQueue[targetId]) {
        return sock.sendMessage(from, { text: "⚠️ *SESI EXPIRED*\nSilahkan buat ulang dengan .upswgc" }, { quoted: m });
    }

    const data = global.db.upswQueue[targetId];
    
    if (data.msgKey) {
        try {
            await sock.sendMessage(data.from, { delete: data.msgKey });
        } catch(e) {}
    }

    let groups = [];
    if (targetJid === "all") {
        const allGcs = await sock.groupFetchAllParticipating();
        groups = Object.keys(allGcs);
    } else {
        groups = [targetJid];
    }

    const waitMsg = await sock.sendMessage(from, { text: `⏳ *MENGIRIM KE ${groups.length} GRUP...*` });

    let success = 0;
    for (const jid of groups) {
        try {
            const messageSecret = crypto.randomBytes(32);
            const msgToSend = await generateWAMessageFromContent(jid, {
                groupStatusMessageV2: {
                    message: {
                        ...data.content,
                        messageContextInfo: { messageSecret }
                    }
                }
            }, {});
            await sock.relayMessage(jid, msgToSend.message, { messageId: msgToSend.key.id });
            success++;
            await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
            console.error("Gagal kirim ke", jid, e.message);
        }
    }

    delete global.db.upswQueue[targetId];
    try {
        await sock.sendMessage(from, { delete: waitMsg.key });
    } catch(e) {}
    
    return sock.sendMessage(from, { text: `✅ *BERHASIL*\nTerkirim ke ${success} dari ${groups.length} grup` });
}

case "delswgc":
case "hapusswgc": {
    if (!from.endsWith('@g.us')) return sendMsg("❌ Perintah hanya untuk grup!");

    const groupMetadata = await sock.groupMetadata(from);
    const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const isBotAdmin = groupMetadata.participants.find(p => p.id === botJid)?.admin;
    if (!isBotAdmin) return sendMsg("❌ Bot harus menjadi admin!");

    const isSenderAdmin = groupMetadata.participants.find(p => p.id === realSender)?.admin || isOwner;
    if (!isSenderAdmin) return sendMsg("❌ Hanya admin grup!");

    if (!args[0]) return sendMsg("📝 *Contoh:* .delswgc 1 2 3\n.hapusswgc 1");

    if (!global.db.data.groupStatus?.[from]?.length) {
        return sendMsg("📭 Tidak ada riwayat status.");
    }

    const numbers = [...new Set(args.map(Number).filter(n => !isNaN(n) && n > 0))].sort((a,b) => b - a);
    const messages = global.db.data.groupStatus[from];
    let successCount = 0;

    for (const num of numbers) {
        const index = num - 1;
        if (messages[index]) {
            try {
                await sock.sendMessage(from, { delete: messages[index].key });
                messages.splice(index, 1);
                successCount++;
            } catch (e) {}
        }
    }

    if (messages.length === 0) delete global.db.data.groupStatus[from];
    await sendMsg(`✅ *Berhasil menghapus ${successCount} status.*`);
    break;
}

case "listswgc":
case "liststory": {
    if (!from.endsWith('@g.us')) return sendMsg("❌ Perintah hanya untuk grup!");
    
    const statusList = global.db.data.groupStatus?.[from]?.filter(msg => msg && msg.key);
    if (!statusList?.length) return sendMsg("📭 Belum ada status yang dikirim.");

    let listText = `📋 *DAFTAR STATUS GRUP*\n━━━━━━━━━━━━━━━━━━\n\n`;
    
    statusList.forEach((msg, i) => {
        const typeIcon = {
            imageMessage: "🖼️", videoMessage: "🎥", audioMessage: "🎵", text: "💬"
        };
        const icon = typeIcon[msg.type] || "📄";
        const typeName = {
            imageMessage: "Gambar", videoMessage: "Video", audioMessage: "Audio", text: "Teks"
        };
        const type = typeName[msg.type] || "Lainnya";
        const preview = msg.caption ? `\n   📝 ${msg.caption.substring(0, 30)}${msg.caption.length > 30 ? '...' : ''}` : "";
        const date = msg.timestamp ? new Date(msg.timestamp).toLocaleString('id-ID') : "";
        listText += `${i+1}. ${icon} *${type}*${preview}\n   🆔 ID: \`${msg.key.id}\`\n   📅 ${date}\n\n`;
    });
    
    listText += `━━━━━━━━━━━━━━━━━━\n💡 *Hapus:* .delswgc <nomor>`;
    await sendMsg(listText);
    break;
}

            case "song":
            case "play": {
                if (!args[0]) return sendMsg("🎵 *Judul lagunya apa?*\nContoh: .song aku cah kerjo");
                
                const query = args.join(" ");
                const audioFile = path.join(__dirname, `${Date.now()}.mp3`);

                try {
                    await sock.sendMessage(from, { react: { text: "⏰", key: m.key } });

                    exec(`yt-dlp --default-search "ytsearch" --extract-audio --audio-format mp3 --audio-quality 128K --max-filesize 10M --output "${audioFile}" "${query}"`, async (error) => {
                        if (error || !fs.existsSync(audioFile)) {
                            if (fs.existsSync(audioFile)) fs.unlinkSync(audioFile);
                            await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
                            return;
                        }

                        const stats = fs.statSync(audioFile);
                        if (stats.size > 15000000) { 
                            if (fs.existsSync(audioFile)) fs.unlinkSync(audioFile);
                            await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
                            return await sendMsg("❌ File terlalu besar (maks 15MB).");
                        }

                        await sendMsg({
                            audio: fs.readFileSync(audioFile),
                            mimetype: "audio/mpeg",
                            fileName: `${query}.mp3`
                        });

                        await sock.sendMessage(from, { react: { text: "✅", key: m.key } });
                        if (fs.existsSync(audioFile)) fs.unlinkSync(audioFile);
                    });
                } catch (e) {
                    if (fs.existsSync(audioFile)) fs.unlinkSync(audioFile);
                    await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
                }
                break;
            }

            case "tt":
            case "tiktok": {
                if (!args[0]) return sendMsg(`🔗 *Masukkan link TikTok!*\n\nContoh: .tt https://vt.tiktok.com/xxxxx`);
                
                const url = args[0];
                const videoFile = path.join(__dirname, `tt_${Date.now()}.mp4`);

                try {
                    const processMsg = await sendMsg(`🎬 *Processing TikTok video...*\n\n_⚡ Tanpa watermark | HD Quality_`);
                    const info = getYouTubeInfo(url);
                    downloadYouTubeVideo(url, videoFile, "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best");

                    await sendMsg({
                        video: fs.readFileSync(videoFile),
                        caption: `🎥 *TIKTOK VIDEO*\n━━━━━━━━━━━━━━━━━━━━\n📌 *Judul:* ${info?.title || "Video"}\n👤 *Creator:* ${info?.uploader || "Unknown"}\n⏱️ *Durasi:* ${formatDuration(info?.duration || 0)}\n📦 *Size:* ${formatFileSize(fs.statSync(videoFile).size)} MB\n🔰 *Quality:* HD No Watermark\n━━━━━━━━━━━━━━━━━━━━\n⚡ *Powered by Jun Official*`,
                        mimetype: "video/mp4",
                        contextInfo: { externalAdReply: { title: String(info?.title).substring(0, 50), body: "🎬 TikTok Video", thumbnailUrl: info?.thumbUrl, sourceUrl: url, mediaType: 1, renderLargerThumbnail: true, showAdAttribution: true } }
                    });
                    await sendMsg(`✅ *Video berhasil dikirim!*\n\n✨ Tanpa watermark | Kualitas HD`, processMsg.key);
                    cleanupFile(videoFile);
                } catch (e) {
                    await sendMsg(`❌ *Gagal download TikTok!*\n\nPastikan link valid dan tidak private.`);
                }
                break;
            }

            case "yt":
            case "youtube": {
                if (!args[0]) return sendMsg(`🔗 *Masukkan link YouTube!*\n\nContoh: .yt https://youtu.be/xxxxx`);
                
                const url = args[0];
                const videoFile = path.join(__dirname, `yt_${Date.now()}.mp4`);

                try {
                    const processMsg = await sendMsg(`🎬 *Processing YouTube video...*\n\n_⚡ HD Quality | Fast Download_`);
                    const info = getYouTubeInfo(url);
                    downloadYouTubeVideo(url, videoFile, "best[height<=720][ext=mp4]/best[height<=720]/best");

                    await sendMsg({
                        video: fs.readFileSync(videoFile),
                        caption: `📺 *YOUTUBE VIDEO*\n━━━━━━━━━━━━━━━━━━━━\n📌 *Judul:* ${info?.title || "Video"}\n👤 *Channel:* ${info?.uploader || "Unknown"}\n⏱️ *Durasi:* ${formatDuration(info?.duration || 0)}\n📦 *Size:* ${formatFileSize(fs.statSync(videoFile).size)} MB\n🎨 *Quality:* 720p HD\n━━━━━━━━━━━━━━━━━━━━\n⚡ *Powered by Jun Official*`,
                        mimetype: "video/mp4",
                        contextInfo: { externalAdReply: { title: String(info?.title).substring(0, 50), body: "📺 YouTube Video", thumbnailUrl: info?.thumbUrl, sourceUrl: url, mediaType: 1, renderLargerThumbnail: true, showAdAttribution: true } }
                    });
                    await sendMsg(`✅ *Video berhasil dikirim!*\n\n🎬 Kualitas 720p HD`, processMsg.key);
                    cleanupFile(videoFile);
                } catch (e) {
                    await sendMsg(`❌ *Gagal download YouTube!*\n\nPastikan link valid dan video tidak private.`);
                }
                break;
            }

            case "gtts":
            case "tts": {
                if (!args[0]) return await sendMsg(`🎤 Mau suarain teks apa?\n\nContoh: .gtts Halo semua!`);
                
                const text = args.join(" ");
                if (text.length > 200) return await sendMsg("❌ Teks terlalu panjang! Maksimal 200 karakter.");
                
                try {
                    await sock.sendPresenceUpdate("recording", from);
                    const response = await axios.get(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=id&client=tw-ob`, {
                        responseType: 'arraybuffer',
                        headers: { 'Referer': 'http://translate.google.com/', 'User-Agent': 'Mozilla/5.0' }
                    });

                    const tmpFile = path.join(__dirname, `tmp_${Date.now()}.mp3`);
                    const outFile = path.join(__dirname, `tmp_${Date.now()}.opus`);
                    fs.writeFileSync(tmpFile, Buffer.from(response.data));

                    exec(`ffmpeg -i ${tmpFile} -c:a libopus -b:a 32k -vbr on -compression_level 10 ${outFile}`, async (err) => {
                        if (err) {
                            cleanupFile(tmpFile);
                            return sendMsg("❌ Gagal konversi audio.");
                        }
                        await sendMsg({ audio: fs.readFileSync(outFile), mimetype: "audio/ogg; codecs=opus", ptt: true });
                        cleanupFile(tmpFile);
                        cleanupFile(outFile);
                        await sock.sendPresenceUpdate("paused", from);
                    });
                } catch (e) {
                    await sock.sendPresenceUpdate("paused", from);
                    await sendMsg("❌ Gagal memproses permintaan.");
                }
                break;
            }

            case "addowner":
            case "delowner":
            case "listowner": {
                if (!admin || typeof admin.handleCommand !== 'function') {
                    await sendMsg("❌ Sistem admin tidak tersedia.");
                    break;
                }
                const result = await admin.handleCommand(command, sock, from, m, args, realSender);
                if (result) await sendMsg(result);
                break;
            }

            case "ekhm": {
                try {
                    const quotedM = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                    
                    if (!quotedM) {
                        await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
                        return;
                    }
                    
                    await sock.sendMessage(from, { react: { text: "⏰", key: m.key } });
                    
                    let vType = Object.keys(quotedM)[0];
                    let mediaM = quotedM;
                    
                    if (vType === "viewOnceMessage" || vType === "viewOnceMessageV2") {
                        mediaM = quotedM[vType].message;
                        vType = Object.keys(mediaM)[0];
                    }
                    
                    if (!["imageMessage", "videoMessage", "audioMessage"].includes(vType)) {
                        await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
                        return;
                    }
                    
                    const typeMedia = vType.replace("Message", "");
                    const buffer = await downloadMediaAsBuffer(mediaM[vType], typeMedia);
                    
                    const senderJid = (m.key.participant || m.key.remoteJid || m.sender).split("@")[0];
                    const botJid = sock.user.id.split(":")[0] + "@s.whatsapp.net";
                    
                    await sock.sendMessage(botJid, {
                        [typeMedia]: buffer,
                        caption: `📩 *LOG BYPASS*\n👤 Dari: ${senderJid}\n📂 Tipe: ${typeMedia.toUpperCase()}\n⏰ ${moment.tz('Asia/Jakarta').format('HH:mm:ss')}`,
                        mimetype: mediaM[vType].mimetype
                    });
                    
                    await sock.sendMessage(from, { react: { text: "✅", key: m.key } });
                    
                } catch (e) {
                    console.error(e);
                    const botJid = sock.user.id.split(":")[0] + "@s.whatsapp.net";
                    await sock.sendMessage(botJid, { text: `❌ *ERROR EKHM*\n${e.message}` });
                    await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
                }
                break;
            }

case "autoread": {
    if (!isOwner) return;
    if (!args[0]) return await sendMsg(`*── 「 AUTO READ SYSTEM 」 ──*\n\nFormat salah!\nContoh: *${prefix}autoread on* atau *${prefix}autoread off*`);

    const status = args[0].toLowerCase() === "on";
    config.autoRead = status;
    
    await sock.sendMessage(from, { react: { text: "📖", key: m.key } });
    let teks = `*─── 「 CONFIGURATION UPDATE 」 ───*\n\n`;
    teks += `*Feature:* AUTO READ MESSAGES\n`;
    teks += `*Status:* ${status ? "✅ ENABLED" : "❌ DISABLED"}\n`;
    teks += `*Update:* ${moment().format('DD/MM/YY HH:mm:ss')}\n\n`;
    teks += `_Sistem akan ${status ? "otomatis menandai pesan masuk sebagai terbaca." : "berhenti membaca pesan secara otomatis."}_`;

    await sendMsg(teks);
    break;
}

case "autotyping": {
    if (!isOwner) return;
    if (!args[0]) return await sendMsg(`*── 「 AUTO TYPING SYSTEM 」 ──*\n\nFormat salah!\nContoh: *${prefix}autotyping on* atau *${prefix}autotyping off*`);

    const status = args[0].toLowerCase() === "on";
    config.autoTyping = status;
    
    await sock.sendMessage(from, { react: { text: "✍️", key: m.key } });
    let teks = `*─── 「 CONFIGURATION UPDATE 」 ───*\n\n`;
    teks += `*Feature:* AUTO TYPING\n`;
    teks += `*Status:* ${status ? "✅ ENABLED" : "❌ DISABLED"}\n`;
    teks += `*Update:* ${moment().format('DD/MM/YY HH:mm:ss')}\n\n`;
    teks += `_Sistem akan ${status ? "menampilkan status mengetik saat memproses pesan." : "menyembunyikan status mengetik."}_`;

    await sendMsg(teks);
    break;
}

case "bot": {
    if (!isOwner) return;
    if (!args[0]) return sendMsg(`*── 「 BOT COMMAND CENTER 」 ──*\n\nFormat salah!\nContoh: *${prefix}bot on* atau *${prefix}bot off*`);

    const status = args[0].toLowerCase() === "on";
    config.botStatus = status;

    await sock.sendMessage(from, { react: { text: status ? "⚡" : "💤", key: m.key } });
    let teks = `*─── 「 SISTEM OPERASIONAL 」 ───*\n\n`;
    teks += `*Status:* ${status ? "✅ ACTIVE (RUNNING)" : "❌ DISABLED (LOCKED)"}\n`;
    teks += `*Update:* ${moment().format('DD/MM/YY HH:mm:ss')}\n\n`;

    if (status) {
        teks += `*INFORMASI SISTEM:*\n`;
        teks += `Seluruh modul fitur bot telah diaktifkan kembali. Bot kini dapat merespon perintah sesuai hak akses pengguna.\n\n`;
        teks += `_Sistem berjalan normal._`;
    } else {
        teks += `*PERINGATAN SISTEM:*\n`;
        teks += `Mode penguncian aktif. Seluruh fitur fungsional telah diblokir secara total untuk pengguna publik.\n\n`;
        teks += `_Gunakan perintah yang sama untuk membuka kunci._`;
    }

    await sendMsg(teks);
    break;
}

case "stats":
case "status": {
    const used = process.memoryUsage();
    const uptime = process.uptime();
    const uptimeHours = (uptime / 3600).toFixed(2);
    const uptimeDays = Math.floor(uptime / 86400);
    const uptimeRemain = uptime % 86400;
    const uptimeStr = uptimeDays > 0 ? `${uptimeDays} hari ${Math.floor(uptimeRemain / 3600)} jam` : `${uptimeHours} jam`;

    let teks = `*─── 「 BOT STATUS 」 ───*\n\n`;
    teks += `*📱 Bot Number:* ${sock.user.id.split(':')[0]}\n`;
    teks += `*⏳ Uptime:* ${uptimeStr}\n`;
    teks += `*📟 RAM:* ${(used.rss / 1024 / 1024).toFixed(2)} MB\n`;
    teks += `*🖥️ Platform:* ${os.platform()} (${os.arch()})\n\n`;
    
    teks += `*─── 「 KONFIGURASI 」 ───*\n`;
    teks += `*🛡️ Self Mode:* ${config.isSelf ? "🔒 PRIVATE" : "🔓 PUBLIC"}\n`;
    teks += `*📖 Auto Read:* ${config.autoRead ? "✅ ON" : "❌ OFF"}\n`;
    teks += `*✍️ Auto Typing:* ${config.autoTyping ? "✅ ON" : "❌ OFF"}\n`;
    teks += `*🤖 Bot Status:* ${config.botStatus !== false ? "✅ RUNNING" : "❌ LOCKED"}\n`;

    await sendMsg(teks);
    break;
}

case "botstatus": {
    if (!isOwner) return;
    if (!args[0]) return await sendMsg(`*── 「 PRESENCE SYSTEM 」 ──*\n\nContoh: *${prefix}botstatus on* (Selalu Online)\nContoh: *${prefix}botstatus off* (Ikut Owner)`);

    const status = args[0].toLowerCase() === "on";

    if (status) {
        await sock.sendPresenceUpdate("available");
        await sendMsg("🌐 *ALWAYS ONLINE DIAKTIFKAN*\nBot akan selalu tampil online.");
    } else {
        await sock.sendPresenceUpdate("unavailable");
        await sendMsg("💤 *ALWAYS ONLINE DINONAKTIFKAN*\nBot akan mengikuti status owner.");
    }
    break;
}

case "self": {
    if (!isOwner) return;
    
    if (!args[0]) {
        let statusSelf = config.isSelf ? "PRIVATE (ON)" : "PUBLIC (OFF)";
        let colorStatus = config.isSelf ? "🔴" : "🟢";
        
        let msg = `*── 「 SELF MODE SYSTEM 」 ──*\n\n`;
        msg += `┌  ◦  *Status:* ${colorStatus} ${statusSelf}\n`;
        msg += `└  ◦  *Mode:* ${config.isSelf ? "Hanya Owner yang bisa menggunakan bot" : "Semua orang bisa menggunakan bot"}\n\n`;
        msg += `*💡 FORMAT:* \`.self on\` atau \`.self off\``;
        
        return await sendMsg(msg);
    }

    const action = args[0].toLowerCase();
    if (action === "on") {
        if (config.isSelf) return await sendMsg("⚠️ *STATUS:* Sudah ON.");
        config.isSelf = true;
        await sendMsg("🔒 *SELF MODE DIAKTIFKAN*\nHanya owner yang bisa menggunakan bot.");
    } else if (action === "off") {
        if (!config.isSelf) return await sendMsg("⚠️ *STATUS:* Sudah OFF.");
        config.isSelf = false;
        await sendMsg("🌐 *SELF MODE DINONAKTIFKAN*\nSemua orang bisa menggunakan bot.");
    } else {
        await sendMsg("❌ Gunakan *on* atau *off*.");
    }
    break;
}

case "addrespon": {
    if (!isOwner) return;
    if (!text.includes("|")) return reply(`*Format Salah!*\n\nContoh:\n${prefix}addrespon halo | Halo juga kak!\n\n_Gunakan | sebagai pemisah antara kata kunci dan jawaban._`);

    const [key, ...res] = text.split("|");
    const keyword = key.trim().toLowerCase();
    const response = res.join("|").trim();

    try {
        const configPath = './respon.yaml';
        let config = { 
            settings: { react_to_keywords: true, reply_in_group: false, welcome_message: true },
            keywords: { exact: {}, partial: {} }
        };

        if (fs.existsSync(configPath)) {
            config = yaml.load(fs.readFileSync(configPath, 'utf8'));
        }

        config.keywords.partial[keyword] = response;

        fs.writeFileSync(configPath, yaml.dump(config, { lineWidth: -1 }));

        await sock.sendMessage(from, { 
            text: `✅ *BERHASIL MENAMBAH TEMPLATE*\n\n*Keyword:* ${keyword}\n*Respon:* ${response}\n\n_Bot akan merespon jika pesan mengandung kata kunci tersebut._`
        }, { quoted: m });
    } catch (e) {
        reply("❌ Gagal menyimpan template baru.");
    }
    break;
}

case "delrespon": {
    if (!isOwner) return;
    if (!text) return reply(`*Format Salah!*\n\nContoh: ${prefix}delrespon halo`);

    try {
        const configPath = './respon.yaml';
        if (!fs.existsSync(configPath)) return reply("❌ Database template tidak ditemukan.");

        let config = yaml.load(fs.readFileSync(configPath, 'utf8'));
        const keyword = text.trim().toLowerCase();

        if (config.keywords.partial[keyword]) {
            delete config.keywords.partial[keyword];
            fs.writeFileSync(configPath, yaml.dump(config, { lineWidth: -1 }));
            reply(`✅ Template untuk keyword *${keyword}* berhasil dihapus.`);
        } else {
            reply(`❌ Keyword *${keyword}* tidak ditemukan di database.`);
        }
    } catch (e) {
        reply("❌ Gagal menghapus template.");
    }
    break;
}

case "listrespon": {
    try {
        const configPath = './respon.yaml';
        if (!fs.existsSync(configPath)) return reply("📭 Belum ada template respons.");

        const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
        const partials = config.keywords.partial;
        const keys = Object.keys(partials);

        if (keys.length === 0) return reply("📭 Daftar respons masih kosong.");

        let txt = `📋 *DAFTAR TEMPLATE RESPONS*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        keys.forEach((k, i) => {
            txt += `${i + 1}. *Key:* ${k}\n   *Res:* ${partials[k]}\n\n`;
        });

        reply(txt);
    } catch (e) {
        reply("❌ Gagal mengambil daftar respons.");
    }
    break;
}








case "p": {
    try {
        const logoBuffer = fs.readFileSync('./logo.png');
        const media = await prepareWAMessageMedia(
            { image: logoBuffer },
            { upload: sock.waUploadToServer }
        );

        const cards = [
            {
                header: {
                    hasMediaAttachment: true,
                    ...media
                },
                body: {
                    text: "*PRODUK DIGITAL*"
                },
                footer: {
                    text: "JunnMods Store"
                },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "CEK STORE",
                                url: "https://junofficial354.my.id"
                            })
                        }
                    ]
                }
            },
            {
                header: {
                    hasMediaAttachment: true,
                    ...media
                },
                body: {
                    text: "*KONTAK OWNER*"
                },
                footer: {
                    text: "Fast Response"
                },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "CHAT WA",
                                url: "https://wa.me/6285808630057"
                            })
                        }
                    ]
                }
            }
        ];

        const msg = generateWAMessageFromContent(m.key.remoteJid, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: {
                            text: "*⚡ CAROUSEL MENU ⚡*"
                        },
                        footer: {
                            text: "Scroll ke samping untuk lihat kartu lainnya"
                        },
                        header: {
                            hasMediaAttachment: false
                        },
                        carouselMessage: {
                            cards: cards
                        },
                        contextInfo: {
                            mentionedJid: [m.sender],
                            forwardingScore: 999,
                            isForwarded: true
                        }
                    }
                }
            }
        }, { userJid: m.key.remoteJid, quoted: m });

        await sock.relayMessage(m.key.remoteJid, msg.message, { messageId: msg.key.id });

    } catch (e) {
        console.error(e);
        await sock.sendMessage(m.key.remoteJid, { text: "Error: " + e.message });
    }
    break;
}

case "p": {
    try {
        const logoBuffer = fs.readFileSync('./logo.png');
        const media = await prepareWAMessageMedia({ image: logoBuffer }, { upload: sock.waUploadToServer });

        const cards = [
            {
                header: { hasMediaAttachment: true, ...media },
                body: { text: "*CTA CALL & URL*" },
                footer: { text: "Card 1: External Link & Call" },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: "cta_call",
                            buttonParamsJson: JSON.stringify({
                                display_text: "TELPON OWNER",
                                phoneNumber: "6285808630057"
                            })
                        },
                        {
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "WEB STORE",
                                url: "https://junofficial354.my.id"
                            })
                        }
                    ]
                }
            }
        ];

        const msg = generateWAMessageFromContent(m.key.remoteJid, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text: "*⚡ CAROUSEL CALL & WEB ⚡*" },
                        header: { hasMediaAttachment: false },
                        carouselMessage: { cards: cards }
                    }
                }
            }
        }, { userJid: m.key.remoteJid, quoted: m });

        await sock.relayMessage(m.key.remoteJid, msg.message, { messageId: msg.key.id });
    } catch (e) {
        console.error(e);
    }
    break;
}


case "p2": {
    try {
        const logoBuffer = fs.readFileSync('./logo.png');
        const media = await prepareWAMessageMedia({ image: logoBuffer }, { upload: sock.waUploadToServer });

        const msg = generateWAMessageFromContent(m.key.remoteJid, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            title: "SINGLE SELECT LIST",
                            hasMediaAttachment: true,
                            ...media
                        },
                        body: { text: "*⚡ INTERACTIVE SELECTION ⚡*" },
                        footer: { text: "Selection Menu" },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "single_select_reply",
                                    buttonParamsJson: JSON.stringify({
                                        title: "PILIH LAYANAN",
                                        sections: [
                                            {
                                                title: "GAME TOPUP",
                                                rows: [
                                                    { title: "Mobile Legends", id: ".ml", description: "Topup ML Murah" },
                                                    { title: "Free Fire", id: ".ff", description: "Topup FF Murah" }
                                                ]
                                            }
                                        ]
                                    })
                                }
                            ]
                        }
                    }
                }
            }
        }, { userJid: m.key.remoteJid, quoted: m });

        await sock.relayMessage(m.key.remoteJid, msg.message, { messageId: msg.key.id });
    } catch (e) {
        console.error(e);
    }
    break;
}

case "p3": {
    try {
        const logoBuffer = fs.readFileSync('./logo.png');
        const media = await prepareWAMessageMedia({ image: logoBuffer }, { upload: sock.waUploadToServer });

        const msg = generateWAMessageFromContent(m.key.remoteJid, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            title: "REMINDER & LOCATION",
                            hasMediaAttachment: true,
                            ...media
                        },
                        body: { text: "*⚡ INTERACTIVE REMINDER & LOC ⚡*" },
                        footer: { text: "Utility Tools" },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "cta_reminder",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "INGATKAN PROMO",
                                        id: "pro",
                                        timestamp: Math.floor(Date.now() / 1000) + 3600
                                    })
                                },
                                {
                                    name: "send_location",
                                    buttonParamsJson: JSON.stringify({})
                                }
                            ]
                        }
                    }
                }
            }
        }, { userJid: m.key.remoteJid, quoted: m });

        await sock.relayMessage(m.key.remoteJid, msg.message, { messageId: msg.key.id });
    } catch (e) {
        console.error(e);
    }
    break;
}

case "p4": {
    try {
        const logoBuffer = fs.readFileSync('./logo.png');
        const media = await prepareWAMessageMedia({ image: logoBuffer }, { upload: sock.waUploadToServer });

        const msg = generateWAMessageFromContent(m.key.remoteJid, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            title: "ADDRESS & REMINDER",
                            hasMediaAttachment: true,
                            ...media
                        },
                        body: { text: "*⚡ INTERACTIVE ADDRESS & REMINDER ⚡*" },
                        footer: { text: "Utility" },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "address_message",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "KIRIM ALAMAT",
                                        id: "addr-01"
                                    })
                                },
                                {
                                    name: "cta_reminder",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "SET PENGINGAT",
                                        id: "remind-store",
                                        timestamp: Math.floor(Date.now() / 1000) + 3600
                                    })
                                }
                            ]
                        }
                    }
                }
            }
        }, { userJid: m.key.remoteJid, quoted: m });

        await sock.relayMessage(m.key.remoteJid, msg.message, { messageId: msg.key.id });
    } catch (e) {
        console.error(e);
    }
    break;
}
case "1": {
    try {
        const logoBuffer = fs.readFileSync('./logo.png');
        const media = await prepareWAMessageMedia({ image: logoBuffer }, { upload: sock.waUploadToServer });

        const msg = generateWAMessageFromContent(m.key.remoteJid, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            title: "SECURITY VERIFICATION",
                            hasMediaAttachment: true,
                            ...media
                        },
                        body: { text: "*⚡ KEAMANAN BOT ⚡*\n\nKlik tombol di bawah untuk verifikasi bahwa Anda bukan bot." },
                        footer: { text: "JUNNMODS ANTI-SPAM" },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "quick_reply",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "SAYA BUKAN BOT",
                                        id: ".verify"
                                    })
                                }
                            ]
                        }
                    }
                }
            }
        }, { userJid: m.key.remoteJid, quoted: m });

        await sock.relayMessage(m.key.remoteJid, msg.message, { messageId: msg.key.id });
    } catch (e) {
        console.error(e);
    }
    break;
}

case "2": {
    try {
        const logoBuffer = fs.readFileSync('./logo.png');
        const media = await prepareWAMessageMedia({ image: logoBuffer }, { upload: sock.waUploadToServer });

        const msg = generateWAMessageFromContent(m.key.remoteJid, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            title: "CUSTOMER REVIEW",
                            hasMediaAttachment: true,
                            ...media
                        },
                        body: { text: "*⚡ TESTIMONI STORE ⚡*\n\nBerikan rating untuk layanan JUN OFFICIAL ID." },
                        footer: { text: "Pilih salah satu bintang" },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "single_select_reply",
                                    buttonParamsJson: JSON.stringify({
                                        title: "KASIH RATING",
                                        sections: [
                                            {
                                                title: "RATING BINTANG",
                                                rows: [
                                                    { title: "⭐⭐⭐⭐⭐", id: ".review 5", description: "Sangat Puas" },
                                                    { title: "⭐⭐⭐⭐", id: ".review 4", description: "Puas" },
                                                    { title: "⭐⭐⭐", id: ".review 3", description: "Cukup" }
                                                ]
                                            }
                                        ]
                                    })
                                }
                            ]
                        }
                    }
                }
            }
        }, { userJid: m.key.remoteJid, quoted: m });

        await sock.relayMessage(m.key.remoteJid, msg.message, { messageId: msg.key.id });
    } catch (e) {
        console.error(e);
    }
    break;
}

case "3": {
    try {
        const logoBuffer = fs.readFileSync('./logo.png');
        const media = await prepareWAMessageMedia({ image: logoBuffer }, { upload: sock.waUploadToServer });

        const msg = generateWAMessageFromContent(m.key.remoteJid, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            title: "JUNNMODS CATALOG",
                            hasMediaAttachment: true,
                            ...media
                        },
                        body: { text: "*⚡ PRODUCT EXPLORER ⚡*\n\nKlik tombol di bawah untuk melihat semua produk kami." },
                        footer: { text: "Direct Link to Catalog" },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "BUKA KATALOG",
                                        url: "https://junofficial354.my.id"
                                    })
                                }
                            ]
                        }
                    }
                }
            }
        }, { userJid: m.key.remoteJid, quoted: m });

        await sock.relayMessage(m.key.remoteJid, msg.message, { messageId: msg.key.id });
    } catch (e) {
        console.error(e);
    }
    break;
}

case "4": {
    try {
        const logoBuffer = fs.readFileSync('./logo.png');
        const media = await prepareWAMessageMedia({ image: logoBuffer }, { upload: sock.waUploadToServer });

        const msg = generateWAMessageFromContent(m.key.remoteJid, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            title: "SHOPPING CART",
                            hasMediaAttachment: true,
                            ...media
                        },
                        body: { text: "*⚡ MULTI-ORDER ⚡*\n\nSalin kode order atau klik link untuk borong diamond." },
                        footer: { text: "Copy-Paste System" },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "cta_copy",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "SALIN FORMAT ORDER",
                                        copy_code: "ORDER#ML#86#ID"
                                    })
                                },
                                {
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "CEK KERANJANG",
                                        url: "https://junofficial354.my.id/cart"
                                    })
                                }
                            ]
                        }
                    }
                }
            }
        }, { userJid: m.key.remoteJid, quoted: m });

        await sock.relayMessage(m.key.remoteJid, msg.message, { messageId: msg.key.id });
    } catch (e) {
        console.error(e);
    }
    break;
}
case "tai": {
    try {
        const logoBuffer = fs.readFileSync('./logo.png');
        const media = await prepareWAMessageMedia({ image: logoBuffer }, { upload: sock.waUploadToServer });

        const msg = generateWAMessageFromContent(m.key.remoteJid, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            title: "THE DARKGHOST SYSTEM",
                            hasMediaAttachment: true,
                            ...media
                        },
                        body: { 
                            text: "*User:* 𐔌𐔌𐔌\n*Bot:* The DarkGhost\n*Prefix:* [ / ]\n*Status:* Online\n\n_Invisible but Deadly_" 
                        },
                        footer: { text: "Telegram: @Shannyiee" },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    // Ini tombol utamanya yang kalau di-tap munculin list lagi
                                    name: "single_select_reply",
                                    buttonParamsJson: JSON.stringify({
                                        title: "📋 PILIHAN MENU",
                                        sections: [
                                            {
                                                title: "LABEL UTAMA",
                                                rows: [
                                                    {
                                                        title: "SALIN ID USER",
                                                        description: "Klik untuk menyalin ID",
                                                        id: "copy_id_action" // Di handler nanti deteksi ID ini buat trigger cta_copy
                                                    },
                                                    {
                                                        title: "OPEN CATALOG",
                                                        description: "Lanjut ke daftar produk",
                                                        id: "go_catalog"
                                                    }
                                                ]
                                            }
                                        ]
                                    })
                                },
                                {
                                    // Tombol pendamping di bawahnya
                                    name: "cta_copy",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "COPY INFO",
                                        copy_code: "User: 𐔌𐔌𐔌 | Status: Online"
                                    })
                                }
                            ]
                        }
                    }
                }
            }
        }, { userJid: m.key.remoteJid, quoted: m });

        await sock.relayMessage(m.key.remoteJid, msg.message, { messageId: msg.key.id });
    } catch (e) {
        console.error(e);
    }
    break;
}

case "btn": {
    try {
        const logoBuffer = fs.readFileSync('./logo.png');
        const media = await prepareWAMessageMedia({ image: logoBuffer }, { upload: sock.waUploadToServer });

        const msg = generateWAMessageFromContent(from, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            title: 'Hiii',
                            subtitle: 'There is a subtitle',
                            hasMediaAttachment: true,
                            ...media
                        },
                        body: {
                            text: 'This is an Interactive message!'
                        },
                        footer: {
                            text: 'Hello World!'
                        },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Click Me!',
                                        id: 'your_id'
                                    })
                                },
                                {
                                    name: 'cta_url',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Follow Me',
                                        url: 'https://whatsapp.com/channel/0029Vag9VSI2ZjCocqa2lB1y',
                                        merchant_url: 'https://whatsapp.com/channel/0029Vag9VSI2ZjCocqa2lB1y'
                                    })
                                },
                                {
                                    name: 'cta_copy',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Click Me!',
                                        copy_code: 'https://whatsapp.com/channel/0029Vag9VSI2ZjCocqa2lB1y'
                                    })
                                },
                                {
                                    name: 'cta_call',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Call Me!',
                                        phone_number: '628xxx'
                                    })
                                },
                                {
                                    name: 'cta_catalog',
                                    buttonParamsJson: JSON.stringify({
                                        business_phone_number: '628xxx'
                                    })
                                },
                                {
                                    name: 'cta_reminder',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '...'
                                    })
                                },
                                {
                                    name: 'cta_cancel_reminder',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '...'
                                    })
                                },
                                {
                                    name: 'address_message',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '...'
                                    })
                                },
                                {
                                    name: 'send_location',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '...'
                                    })
                                },
                                {
                                    name: 'open_webview',
                                    buttonParamsJson: JSON.stringify({
                                        title: 'Follow Me!',
                                        link: {
                                            in_app_webview: true,
                                            url: 'https://junofficial354.my.id'
                                        }
                                    })
                                },
                                {
                                   name: 'mpm',
                                   buttonParamsJson: JSON.stringify({
                                      product_id: '8816262248471474'
                                   })
                                },
                                {
                                   name: 'wa_payment_transaction_details',
                                   buttonParamsJson: JSON.stringify({
                                      transaction_id: '12345848'
                                   })
                                },
                                {
                                   name: 'automated_greeting_message_view_catalog',
                                   buttonParamsJson: JSON.stringify({
                                       business_phone_number: '628xxx', 
                                       catalog_product_id: '12345'
                                   })
                                },
                                {
                                    name: 'galaxy_message', 
                                    buttonParamsJson: JSON.stringify({
                                        mode: 'published', 
                                        flow_message_version: '3', 
                                        flow_token: '1:1307913409923914:293680f87029f5a13d1ec5e35e718af3',
                                        flow_id: '1307913409923914',
                                        flow_cta: 'Itsukichann kawaii >\\<', 
                                        flow_action: 'navigate', 
                                        flow_action_payload: {
                                            screen: 'QUESTION_ONE',
                                            params: {
                                                user_id: '123456789', 
                                                referral: 'campaign_xyz'
                                            }
                                        }, 
                                        flow_metadata: {
                                            flow_json_version: '201', 
                                            data_api_protocol: 'v2', 
                                            flow_name: 'Lead Qualification [en]',
                                            data_api_version: 'v2', 
                                            categories: ['Lead Generation', 'Sales']
                                       }
                                    }) 
                                }, 
                                {
                                    name: 'single_select',
                                    buttonParamsJson: JSON.stringify({
                                        title: 'Click Me!',
                                        sections: [
                                            {
                                                title: 'Title 1',
                                                highlight_label: 'Highlight label 1',
                                                rows: [
                                                    {
                                                        header: 'Header 1',
                                                        title: 'Title 1',
                                                        description: 'Description 1',
                                                        id: 'Id 1'
                                                    },
                                                    {
                                                        header: 'Header 2',
                                                        title: 'Title 2',
                                                        description: 'Description 2',
                                                        id: 'Id 2'
                                                    }
                                                ]
                                            }
                                        ]
                                    })
                                }
                            ]
                        }
                    }
                }
            }
        }, { userJid: from, quoted: m });

        await sock.relayMessage(from, msg.message, { messageId: msg.key.id });

    } catch (e) {
        console.error("ERROR BTN:", e);
    }
    break;
}
case 'b1': {
    if (!m.chat) return

    let sections = [{
        title: "DAFTAR LAYANAN",
        highlight_label: "Terlaris",
        rows: [
            { header: "Menu 01", title: "Mobile Legends", description: "Top up Diamond MLBB murah", id: ".order ml" },
            { header: "Menu 02", title: "Free Fire", description: "Top up Diamond FF instan", id: ".order ff" },
            { header: "Menu 03", title: "PUBG Mobile", description: "UC PUBG termurah", id: ".order pubg" },
            { header: "Menu 04", title: "Genshin Impact", description: "Genesis Crystal via UID", id: ".order genshin" },
            { header: "Menu 05", title: "Valorant", description: "Valorant Points via Riot ID", id: ".order valo" },
            { header: "Menu 06", title: "Call of Duty", description: "CP CODM garena", id: ".order codm" },
            { header: "Menu 07", title: "Honor of Kings", description: "Tokens HOK terbaru", id: ".order hok" },
            { header: "Menu 08", title: "Roblox", description: "Robux via login/id", id: ".order robux" },
            { header: "Menu 09", title: "Steam Wallet", description: "Isi saldo steam murah", id: ".order steam" },
            { header: "Menu 10", title: "Spotify Premium", description: "Akun spotify murah", id: ".order spotify" },
            { header: "Menu 11", title: "Netflix Premium", description: "Sharing/Private profile", id: ".order netflix" },
            { header: "Menu 12", title: "YouTube Premium", description: "Via invite keluarga", id: ".order youtube" },
            { header: "Menu 13", title: "Canva Pro", description: "Akses premium canva", id: ".order canva" },
            { header: "Menu 14", title: "Cek Saldo", description: "Lihat saldo user anda", id: ".balance" },
            { header: "Menu 15", title: "Kontak Owner", description: "Hubungi admin bot", id: ".owner" }
        ]
    }]

    let listMessage = {
        title: "NEXUS STORE MENU",
        body: "Halo, silakan pilih salah satu menu di bawah ini untuk memulai transaksi atau melihat layanan kami.",
        footer: "Nexus Auto-System • 2026",
    }

    let msg = {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: { text: listMessage.body },
                    footer: { text: listMessage.footer },
                    header: {
                        title: listMessage.title,
                        subtitle: "Pilih Layanan",
                        hasSubtitle: true
                    },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "single_select",
                                buttonParamsJson: JSON.stringify({
                                    title: "KLIK UNTUK MEMILIH",
                                    sections: sections
                                })
                            }
                        ],
                        messageParamsVersion: 1
                    }
                }
            }
        }
    }

    await sock.relayMessage(m.chat, msg, { messageId: m.key.id })
    break
}
case "info": {
    const target = m.quoted ? m.quoted.sender : (m.mentionByTag?.[0] || (text ? text.replace(/[^0-9]/g, "") + "@s.whatsapp.net" : from));
    const qMsg = m.quoted ? m.quoted : m;
    
    try {
        await sock.sendPresenceUpdate("composing", from);
        
        const isNewsletter = from.endsWith('@newsletter');
        const contact = await sock.onWhatsApp(target);
        const bioData = await sock.fetchStatus(target).catch(() => ({ status: "No Bio" }));
        const bizProfile = await sock.getBusinessProfile(target).catch(() => null);
        
        const isBusiness = !!bizProfile;
        const name = (m.quoted ? (m.pushName || "User") : m.pushName) || "Stranger";
        const content = qMsg.text || (getContentType(qMsg.message) || "Media Message");
        
        const tgl = moment.tz('Asia/Jakarta').format('DD-MM-YYYY');
        const waktu = moment.tz('Asia/Jakarta').format('HH:mm:ss');
        const jidParsed = jidDecode(target);
        const lid = jidParsed?.user || target.split('@')[0];

        const fullData = {
            title: "ENTRY_LOG_" + Date.now(),
            header: {
                tgl: tgl,
                waktu: waktu,
                wa_type: isBusiness ? "BUSINESS" : "NON-BUSINESS"
            },
            kategori: {
                nama: name,
                nomor: target.split('@')[0],
                bio: bioData.status || "Hidden",
                content: content
            },
            other_save: {
                jid: target,
                lid: `${lid}@lid`,
                is_group: isJidGroup(from),
                group_jid: isJidGroup(from) ? from : "Private Chat",
                newsletter_jid: isNewsletter ? from : "None",
                device: getDeviceType(m.key.id),
                platform: os.platform(),
                push_name: m.pushName || "N/A"
            }
        };

        await saveToDb(fullData);

        let cap = `*── 「 USER METADATA DETECTOR 」 ──*\n\n`;
        cap += `📅 *TGL :* ${tgl}\n`;
        cap += `⌚ *WAKTU :* ${waktu}\n`;
        cap += `🏢 *WA TYPE :* ${fullData.header.wa_type}\n\n`;
        cap += `*📂 KATEGORI*\n`;
        cap += `├ 👤 *NAMA :* ${name}\n`;
        cap += `├ 📱 *NOMOR :* ${fullData.kategori.nomor}\n`;
        cap += `├ 📝 *BIO :* ${fullData.kategori.bio}\n`;
        cap += `└ 💬 *CONTENT :* ${content}\n\n`;
        cap += `*🔍 SERVER RAW DATA*\n`;
        cap += `├ 🆔 *JID :* ${fullData.other_save.jid}\n`;
        cap += `├ 🔑 *LID :* ${fullData.other_save.lid}\n`;
        cap += `├ 🖥️ *DEVICE :* ${fullData.other_save.device}\n`;
        cap += `└ 🏢 *GRUP ID :* ${fullData.other_save.group_jid}\n\n`;
        cap += `✅ _Data telah di-push ke database/db_info.yaml_`;

        await reply(cap);

    } catch (e) {
        console.error("INFO ERROR:", e);
        reply("❌ Gagal menambang data.");
    }
    break;
}





// FITUR GROUP AJG

case "closegc": {
    if (!isGroup) return reply("❌ Perintah ini hanya bisa digunakan di dalam grup!");

    const groupMetadata = await sock.groupMetadata(from);
    const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const senderJid = m.key.participant || m.key.remoteJid;

    const isBotAdmin = groupMetadata.participants.find(p => p.id === botJid)?.admin === 'admin' || 
                       groupMetadata.participants.find(p => p.id === botJid)?.admin === 'superadmin';
    const isSenderAdmin = groupMetadata.participants.find(p => p.id === senderJid)?.admin === 'admin' || 
                          groupMetadata.participants.find(p => p.id === senderJid)?.admin === 'superadmin';

    if (!isBotAdmin) return reply("❌ Bot harus menjadi admin grup terlebih dahulu!");
    if (!isSenderAdmin) return reply("❌ Hanya admin grup yang bisa menggunakan perintah ini!");

    await sock.groupSettingUpdate(from, 'announcement');

    const msg = generateWAMessageFromContent(from, {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    header: {
                        title: "🔒 GRUP DITUTUP",
                        subtitle: "Hanya admin yang dapat mengirim pesan",
                        hasMediaAttachment: false
                    },
                    body: {
                        text: `*── 「 GROUP CLOSED 」 ──*\n\n✅ Grup berhasil ditutup!\nHanya admin yang bisa mengirim pesan sekarang.\n\nKlik tombol di bawah untuk membuka kembali grup.`
                    },
                    footer: {
                        text: "JunMods - Group Management"
                    },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "🔓 OPEN GROUP",
                                    id: ".opengc"
                                })
                            }
                        ]
                    }
                }
            }
        }
    }, { userJid: from, quoted: m });

    await sock.relayMessage(from, msg.message, { messageId: msg.key.id });
    break;
}

case "opengc": {
    if (!isGroup) return reply("❌ Perintah ini hanya bisa digunakan di dalam grup!");

    const groupMetadata = await sock.groupMetadata(from);
    const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const senderJid = m.key.participant || m.key.remoteJid;

    const isBotAdmin = groupMetadata.participants.find(p => p.id === botJid)?.admin === 'admin' || 
                       groupMetadata.participants.find(p => p.id === botJid)?.admin === 'superadmin';
    const isSenderAdmin = groupMetadata.participants.find(p => p.id === senderJid)?.admin === 'admin' || 
                          groupMetadata.participants.find(p => p.id === senderJid)?.admin === 'superadmin';

    if (!isBotAdmin) return reply("❌ Bot harus menjadi admin grup terlebih dahulu!");
    if (!isSenderAdmin) return reply("❌ Hanya admin grup yang bisa menggunakan perintah ini!");

    await sock.groupSettingUpdate(from, 'not_announcement');

    const msg = generateWAMessageFromContent(from, {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    header: {
                        title: "🔓 GRUP DIBUKA",
                        subtitle: "Semua anggota dapat mengirim pesan",
                        hasMediaAttachment: false
                    },
                    body: {
                        text: `*── 「 GROUP OPENED 」 ──*\n\n✅ Grup berhasil dibuka!\nSemua anggota bisa mengirim pesan kembali.\n\nKlik tombol di bawah untuk menutup grup.`
                    },
                    footer: {
                        text: "JunMods - Group Management"
                    },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "🔒 CLOSE GROUP",
                                    id: ".closegc"
                                })
                            }
                        ]
                    }
                }
            }
        }
    }, { userJid: from, quoted: m });

    await sock.relayMessage(from, msg.message, { messageId: msg.key.id });
    break;
}
        }
    } catch (err) {
        console.error("Bot handler error:", err);
    }
}
