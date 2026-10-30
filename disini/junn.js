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
import * as yaml from "js-yaml";
import util from "util";

const execPromise = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import * as admin from './main/admin.js';
import settings from "./settings.js";
import pluginManager from "./main.js";

const isAdmin = async (sock, from, senderJid) => {
    try {
        const groupMetadata = await sock.groupMetadata(from);
        const participant = groupMetadata.participants.find(p => p.id === senderJid);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (e) {
        return false;
    }
};

const downloadMediaAsBuffer = async (message, type) => {
    const stream = await downloadContentFromMessage(message, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    return buffer;
};

const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes) => (bytes / 1024 / 1024).toFixed(2);

const cleanupFile = (filePath) => {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

const getYouTubeInfo = (url) => {
    try {
        const output = execSync(`yt-dlp --quiet --print "%(title)s|%(duration)s|%(uploader)s|%(thumbnail)s|%(view_count)s" "${url}"`, { encoding: 'utf8' });
        const [title, duration, uploader, thumbUrl, views] = output.split('|');
        return { title, duration: parseInt(duration), uploader, thumbUrl, views: parseInt(views) };
    } catch (e) {
        return null;
    }
};

const downloadYouTubeVideo = (url, outputFile, quality = "best[height<=720][ext=mp4]") => {
    execSync(`yt-dlp --quiet -f "${quality}" --output "${outputFile}" "${url}"`);
};

const downloadAudio = (url, outputFile) => {
    execSync(`yt-dlp --quiet --extract-audio --audio-format mp3 --audio-quality 0 --output "${outputFile}" "${url}"`);
};

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

async function handleCommand(sock, m, { command, args, text, prefix, from, isOwner, isGroup, reply, config, realSender }) {
    console.log("COMMAND MASUK:", command);
    const sendMsg = reply;
    const q = text;
    try {
        switch (command) {

            case "welcome": {
                if (!isGroup) return reply("❌ Perintah ini hanya bisa digunakan di dalam grup!");
                if (!isOwner && !m._isSenderAdmin) return reply("❌ Hanya admin grup yang bisa menggunakan perintah ini!");

                if (!args[0]) {
                    const db = JSON.parse(fs.readFileSync('./database/welcome.json', 'utf8') || '{}');
                    const status = db[from] ? "✅ ON" : "❌ OFF";
                    return reply(`*── 「 WELCOME SETTINGS 」 ──*\n\nFormat: *.welcome on* atau *.setwelcome off*\n\n*Status saat ini:* ${status}`);
                }

                const action = args[0].toLowerCase();
                if (!fs.existsSync('./database')) fs.mkdirSync('./database');

                let db = {};
                try { db = JSON.parse(fs.readFileSync('./database/welcome.json', 'utf8')); } catch {}

                if (action === "on") {
                    db[from] = true;
                    fs.writeFileSync('./database/welcome.json', JSON.stringify(db, null, 2));
                    await sock.sendMessage(from, { react: { text: "✅", key: m.key } });
                    reply("✅ *WELCOME MESSAGE DIAKTIFKAN*\n\nBot akan otomatis menyapa member baru yang masuk grup.\n\n_Pengaturan tersimpan permanen._");
                } else if (action === "off") {
                    delete db[from];
                    fs.writeFileSync('./database/welcome.json', JSON.stringify(db, null, 2));
                    await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
                    reply("❌ *WELCOME MESSAGE DINONAKTIFKAN*\n\nBot tidak akan menyapa member baru.");
                } else {
                    reply("❌ Gunakan *on* atau *off*.");
                }
                break;
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

            case "infogc":
            case "infogroup": {
                try {
                    if (!isGroup) {
                        return await sock.sendMessage(from, {
                            text: "❌ Perintah ini hanya bisa digunakan di dalam grup!"
                        }, { quoted: m });
                    }

                    const metadata = await sock.groupMetadata(from);
                    const groupName = metadata.subject || "Tidak ada nama";
                    const groupDesc = metadata.desc || "Tidak ada deskripsi";
                    const groupId = metadata.id || from;
                    const memberCount = metadata.participants?.length || 0;
                    const adminCount = metadata.participants?.filter(p => p.admin === 'admin' || p.admin === 'superadmin').length || 0;
                    const createdDate = metadata.creation ? new Date(metadata.creation * 1000).toLocaleDateString('id-ID') : "Tidak diketahui";

                    let textInfo = `📋 *INFO GRUP*\n\n`;
                    textInfo += `📛 *Nama:* ${groupName}\n`;
                    textInfo += `🆔 *ID:* ${groupId}\n`;
                    textInfo += `👥 *Member:* ${memberCount} orang\n`;
                    textInfo += `👮 *Admin:* ${adminCount} orang\n`;
                    textInfo += `📅 *Dibuat:* ${createdDate}\n\n`;
                    textInfo += `━━━━━━━━━━━━━━━━━━━━\n`;
                    textInfo += `📝 *DESKRIPSI GRUP:*\n\n`;
                    textInfo += `${groupDesc}\n\n`;
                    textInfo += `━━━━━━━━━━━━━━━━━━━━`;

                    const msgInfo = generateWAMessageFromContent(from, {
                        viewOnceMessage: {
                            message: {
                                interactiveMessage: {
                                    header: {
                                        title: `📋 ${groupName}`,
                                        subtitle: `Info lengkap grup`,
                                        hasMediaAttachment: false
                                    },
                                    body: {
                                        text: textInfo
                                    },
                                    footer: {
                                        text: "⚡ JunMods - Group Info"
                                    },
                                    nativeFlowMessage: {
                                        buttons: [
                                            {
                                                name: "quick_reply",
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: "✅ OKE, SUDAH BACA",
                                                    id: ".oke_baca"
                                                })
                                            }
                                        ]
                                    },
                                    contextInfo: {
                                        forwardingScore: 999,
                                        isForwarded: true
                                    }
                                }
                            }
                        }
                    }, { userJid: from, quoted: m });

                    await sock.relayMessage(from, msgInfo.message, { messageId: msgInfo.key.id });

                } catch (error) {
                    console.error("Infogc error:", error);
                    await sock.sendMessage(from, {
                        text: "❌ Gagal mengambil info grup: " + error.message
                    }, { quoted: m });
                }
                break;
            }

            case "oke_baca": {
                try {
                    await sock.sendMessage(from, {
                        text: "✅ Terima kasih sudah membaca deskripsi grup!"
                    }, { quoted: m });
                } catch (error) {
                    console.error("Oke_baca error:", error);
                }
                break;
            }

            case "optes":
            case "openingtest": {
                try {
                    const groupMetadata = await sock.groupMetadata(from);
                    const adminList = groupMetadata.participants
                        .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                        .map(p => p.id);

                    const rulesText = `📋 *OPENING TEST (OPTES)*

Kalau mau optes, siapkan OPR (OPEN ROOM).

— RULES UTAMA —
• Char: Alok, Hayato, Kelly, Caroline (tidak boleh char cewe)
• Pet: Falco atau Panther (tidak boleh pet lain)
• Dilarang LT 2 / atap & bawah kolong CT
• Dilarang sepatu terbang / loncat
• Dilarang DMG USP (kecuali musuh AFK)
• Dilarang tinju / tonjok & end animasi
• Dilarang bundle bencong / balap
• Zona: 11/22 tidak boleh | 33/44 boleh ngurung zona
• Mental / RM: maksimal 3 kali, lebih dari itu = SURCIN DISS!
• Boleh RM hanya jika belum terkena damage sama sekali
• Allskin: atribut senjata ON, IN, dan SG skin wajib aktif

— DETAIL CONFIG ROOM —
• SG 2 Only | Ronde 13 | Coin 1500
• Airdrop & Cyber Airdrop: OFF
• Loadout: OFF | Ammo: TIDAK TERBATAS
• Damage Saat Jatuh: ON

📌 *Klik tombol di bawah untuk kebutuhan lainnya*`;

                    const buttons = [
                        {
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "📜 RULES LENGKAP",
                                url: "https://whatsapp.com/channel/0029VbBnIVuCMY0POm5gqO1P/127"
                            })
                        },
                        {
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "🌐 OFFICIAL WEBSITE",
                                url: "https://dissidentarea.biz.id"
                            })
                        },
                        {
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "💳 DONATE ASUPAN",
                                url: "https://sociabuzz.com/dissidentarea_id/support"
                            })
                        }
                    ];

                    const msgOptes = generateWAMessageFromContent(from, {
                        viewOnceMessage: {
                            message: {
                                interactiveMessage: {
                                    header: {
                                        title: "⚔️ OPENING TEST",
                                        subtitle: "Dissident Area",
                                        hasMediaAttachment: false
                                    },
                                    body: {
                                        text: rulesText
                                    },
                                    footer: {
                                        text: "⚡ Dissident Area - Official"
                                    },
                                    nativeFlowMessage: {
                                        buttons: buttons
                                    },
                                    contextInfo: {
                                        mentionedJid: adminList.length > 0 ? adminList : [],
                                        forwardingScore: 999,
                                        isForwarded: true
                                    }
                                }
                            }
                        }
                    }, { userJid: from, quoted: m });

                    await sock.relayMessage(from, msgOptes.message, { messageId: msgOptes.key.id });

                } catch (error) {
                    console.error("Optes error:", error);
                    await sock.sendMessage(from, {
                        text: "❌ Error: " + error.message
                    }, { quoted: m });
                }
                break;
            }

            case "settings": {
                try {
                    const userNumber = (m.key.remoteJid.endsWith("@g.us") ? (m.key.participant || m.participant) : m.key.remoteJid).split("@")[0].replace(/[^0-9]/g, "");
                    const isGroupChat = m.key.remoteJid.endsWith("@g.us");
                    const url = isGroupChat
                        ? "https://bot-api.junofficial.biz.id"
                        : `https://bot-api.junofficial.biz.id/${userNumber}`;

                    const msgSettings = generateWAMessageFromContent(from, {
                        viewOnceMessage: {
                            message: {
                                interactiveMessage: {
                                    header: { title: "⚙️ *SETTINGS*", hasMediaAttachment: false },
                                    body: {
                                        text: isGroupChat
                                            ? "🔧 *Pengaturan Akun*\n\nKlik tombol di bawah untuk buka halaman settings.\n\nMasukkan username & password masing-masing."
                                            : "🔧 *Pengaturan Akun*\n\nKlik tombol di bawah untuk buka halaman settings kamu."
                                    },
                                    footer: { text: "⚡ JunnMods" },
                                    nativeFlowMessage: {
                                        buttons: [
                                            {
                                                name: "cta_url",
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: "🌐 BUKA SETTINGS",
                                                    url: url,
                                                    merchant_url: url
                                                })
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }, { userJid: from, quoted: m });

                    await sock.relayMessage(from, msgSettings.message, { messageId: msgSettings.key.id });
                } catch (e) {
                    console.error("ERROR SETTINGS:", e);
                }
                break;
            }

        }
    } catch (err) {
        console.error("Bot handler error:", err);
    }
}

export default async function handler(sock, m) {
    try {

        const from = m.key.remoteJid;
        if (!m.message) return;

        let msg = m.message;
        let msgType = getContentType(msg);

        if (msgType === 'viewOnceMessage' || msgType === 'viewOnceMessageV2') {
            msg = msg[msgType].message;
            msgType = getContentType(msg);
        }

        if (msgType === 'messageContextInfo') {
            msg = msg.interactiveMessage || msg.buttonsMessage || msg.listMessage || msg;
            msgType = getContentType(msg);
        }

        let buttonId = "";

        if (msgType === "interactiveResponseMessage") {
            const nativeFlow = msg.interactiveResponseMessage?.nativeFlowResponseMessage;
            if (nativeFlow) {
                try {
                    const paramsJson = JSON.parse(nativeFlow.paramsJson || "{}");
                    buttonId = paramsJson.id || paramsJson.selected_text_file_id || "";
                } catch (e) {
                    buttonId = nativeFlow.paramsJson || "";
                }
            }
            if (!buttonId) {
                buttonId = msg.interactiveResponseMessage?.nativeFlowResponseMessage?.name || "";
            }
        } else if (msgType === "templateButtonReplyMessage") {
            buttonId = msg.templateButtonReplyMessage?.selectedId || "";
        } else if (msgType === "buttonsResponseMessage") {
            buttonId = msg.buttonsResponseMessage?.selectedButtonId || "";
        } else if (msgType === "listResponseMessage") {
            buttonId = msg.listResponseMessage?.singleSelectReply?.selectedRowId || "";
        }

        const body = buttonId || (
            msgType === "conversation" ? msg.conversation :
            msgType === "extendedTextMessage" ? msg.extendedTextMessage.text :
            msgType === "imageMessage" ? msg.imageMessage?.caption :
            msgType === "videoMessage" ? msg.videoMessage?.caption :
            ""
        ) || "";

        const prefix = ".";
        const isCmd = body.startsWith(prefix);
        const args = body.trim().split(/ +/).slice(1);
        const text = args.join(" ");

        let command = null;
        if (isCmd) {
            command = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase();
        } else if (buttonId) {
            command = body.startsWith(prefix) ? body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase() : body.trim().split(/ +/)[0].toLowerCase();
        }

        const botNumber = sock.user.id.split(':')[0].replace(/[^0-9]/g, "");
        const ownerUtama = settings.ownerNumber.replace(/[^0-9]/g, "");
        const realSender = m.key.fromMe ? botNumber : (m.key.participant || m.key.remoteJid || "").split('@')[0].replace(/[^0-9]/g, "");

        const config = global.db.config;
        const isOwnerMain = realSender === ownerUtama;
        const isOwnerSelf = realSender === botNumber || m.key.fromMe;
        const isOwnerAdd = (global.db.owners || []).includes(realSender);
        const isOwner = isOwnerMain || isOwnerSelf || isOwnerAdd;

        const isGroup = from.endsWith('@g.us');
        const isChannel = from.endsWith('@newsletter');
        const chatType = isGroup ? "GROUP" : (isChannel ? "CHANNEL" : "PRIVATE");

        if (body) {
            const timeLog = moment.tz('Asia/Jakarta').format('HH:mm:ss');
            const c = {
                reset: "\x1b[0m", bgBlu: "\x1b[44;37m", bgWht: "\x1b[47;30m", txtCyn: "\x1b[36m",
                txtGrn: "\x1b[32m", txtYel: "\x1b[33m", txtRed: "\x1b[31m", txtWht: "\x1b[37m", bgMag: "\x1b[45;37m"
            };

            console.log(`\n${c.bgBlu} BOT RUNNING ${c.reset} ${c.bgWht} ${timeLog} ${c.reset}`);
            console.log(`${c.txtCyn}NOMOR   :${c.reset} ${c.txtGrn}${realSender}${c.reset} ${isOwner ? c.bgMag + ' [OWNER] ' + c.reset : ''}`);
            console.log(`${c.txtCyn}CHAT    :${c.reset} ${command ? c.txtYel + prefix + command : c.txtWht + 'None'}`);
            console.log(`${c.txtCyn}TYPE    :${c.reset} ${chatType}`);
            console.log(`${c.txtCyn}CONTENT :${c.reset} ${body.substring(0, 50)}${body.length > 50 ? '...' : ''}`);
            console.log(`${c.txtCyn}STATUS  :${c.reset} SELF: ${config.isSelf ? c.txtGrn+'ON' : c.txtRed+'OFF'}${c.reset} | BOT: ${config.botStatus ? c.txtGrn+'ON' : c.txtRed+'OFF'}${c.reset}`);
            console.log(`${c.txtWht}──────────────────────────────────────────────────${c.reset}`);
        }

        if (config.botStatus === false && command !== "bot" && !isOwner) return;

        const isMe = m.key.fromMe || realSender === botNumber;
        if (config.isSelf && !isOwner && !isMe) return;

        if ((isCmd || buttonId) && config.autoTyping) {
            await sock.sendPresenceUpdate("composing", from);
        }

        const reply = async (payload, editKey = null) => {
            const logo = fs.existsSync('./logo.png') ? fs.readFileSync('./logo.png') : Buffer.alloc(0);
            let finalPayload = typeof payload === "string" ? { text: payload } : { ...payload };
            finalPayload.contextInfo = {
                ...(finalPayload.contextInfo || {}),
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: settings.chId,
                    serverMessageId: 100,
                    newsletterName: `BOT VERSION 2.1`
                },
                externalAdReply: {
                    title: `⪨ YT ${settings.ownerName} ⪩`,
                    body: `Powered by ${settings.ownerName}`,
                    thumbnail: logo,
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            };
            if (editKey) finalPayload.edit = editKey;
            return await sock.sendMessage(from, finalPayload, { quoted: m });
        };

        let isSenderAdmin = false;
        if (isGroup) {
            try {
                const meta = await sock.groupMetadata(from);
                const p = meta.participants.find(x => x.id === (m.key.participant || m.key.remoteJid));
                isSenderAdmin = p?.admin === "admin" || p?.admin === "superadmin";
            } catch {}
        }

        await pluginManager.runHandlers("message", {
            sock, m, from,
            sender: realSender,
            senderName: m.pushName || "Unknown",
            isGroup, isOwner, isSenderAdmin,
            text: body, args, prefix, reply, config, realSender, command
        });

        if (command) {
            await handleCommand(sock, m, {
                command, args, text, prefix, from, isOwner, isGroup, reply, config, realSender
            });
        }
    } catch (e) {
        console.error(e);
    }
}