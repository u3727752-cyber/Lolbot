import fs from "fs";
import os from "os";
import moment from "moment-timezone";
import settings from "../settings.js";
import { generateWAMessageFromContent, prepareWAMessageMedia } from "@itsliaaa/baileys";

const parseJidNumber = (jid) => {
    if (!jid) return "";
    const match = jid.match(/^(\d+)/);
    return match ? match[1] : "";
};

const getCorrectSenderJid = async (sock, m, realSender) => {
    let rawJid = m.key.participant || m.participant || m.key.remoteJid || "";
    if (rawJid.endsWith("@lid") && sock.findUserId) {
        try {
            const result = await sock.findUserId(rawJid);
            if (result && result.phoneNumber) {
                return result.phoneNumber;
            }
        } catch (e) {
            console.error("Gagal resolve LID:", e);
        }
    }
    return realSender;
};

export const commands = {
"menu": async (sock, m, options) => {
    const { from, realSender } = options;

    try {
        const senderNumber = await getCorrectSenderJid(sock, m, realSender);
        const mentionJid = senderNumber + "@s.whatsapp.net";

        const uptime = (process.uptime() / 3600).toFixed(2);
        const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
        const time = moment.tz('Asia/Jakarta').format('HH:mm:ss');
        const date = moment.tz('Asia/Jakarta').format('DD MMMM YYYY');
        const logoBuffer = fs.existsSync('./logo.png') ? fs.readFileSync('./logo.png') : Buffer.alloc(0);
        const media = await prepareWAMessageMedia({ image: logoBuffer }, { upload: sock.waUploadToServer });

        let greetText = `*ʜɪ @${senderNumber} 👋 sᴇʟᴀᴍᴀᴛ ᴅᴀᴛᴀɴɢ!*

\`»  ɪ ɴ ꜰ ᴏ  «\`
┌  👤 *ᴜsᴇʀ* : @${senderNumber}
├  🕐 *ᴛɪᴍᴇ* : ${time} ᴡɪʙ
├  📅 *ᴅᴀᴛᴇ* : ${date}
├  🚀 *ʟɪᴠᴇ* : ${uptime} ᴊᴀᴍ
└  💾 *ʀᴀᴍ*  : ${ram} ᴍʙ

ᴋʟɪᴋ ᴛᴏᴍʙᴏʟ *ᴍᴇɴᴜ ᴜᴛᴀᴍᴀ* ᴅɪ ʙᴀᴡᴀʜ.`;

        const msg = generateWAMessageFromContent(from, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            title: "⚡ *ᴊᴜɴ ᴏꜰꜰɪᴄɪᴀʟ ɪᴅ ᴅᴀsʜʙᴏᴀʀᴅ* ⚡",
                            hasMediaAttachment: true,
                            ...media
                        },
                        body: { text: greetText },
                        footer: { text: "⚡ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴊᴜɴɴᴍᴏᴅs" },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "quick_reply",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "🚀 ᴍᴇɴᴜ ᴜᴛᴀᴍᴀ",
                                        id: ".ytta"
                                    })
                                },
                                {
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "▶️ ʏᴏᴜᴛᴜʙᴇ",
                                        url: "https://youtube.com/@junnofficial354"
                                    })
                                },
                                {
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "👤 ᴏᴡɴᴇʀ",
                                        url: "https://wa.me/6285808630057"
                                    })
                                }
                            ]
                        },
                        contextInfo: {
                            mentionedJid: [mentionJid],
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
        await sock.sendMessage(from, { text: "❌ ᴛᴇʀᴊᴀᴅɪ ᴋᴇsᴀʟᴀʜᴀɴ sᴀᴀᴛ ᴍᴇɴᴀᴍᴘɪʟᴋᴀɴ ᴍᴇɴᴜ." });
    }
},

"ytta": async (sock, m, options) => {
        const { from, realSender } = options;

        try {
            const senderNumber = await getCorrectSenderJid(sock, m, realSender);
            const mentionJid = senderNumber + "@s.whatsapp.net";

            const uptime = (process.uptime() / 3600).toFixed(2);
            const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
            const platform = os.platform();
            const arch = os.arch();
            const time = moment.tz('Asia/Jakarta').format('HH:mm:ss');
            const date = moment.tz('Asia/Jakarta').format('DD MMMM YYYY');

            let menuText = `ᴛᴇʀɪᴍᴀᴋᴀsɪʜ ᴛᴇʟᴀʜ ᴍᴇɴɢɢᴜɴᴀᴋᴀɴ ʙᴏᴛ ɪɴɪ...

» ᴘʀᴏꜰɪʟᴇ «
└───────────────────
├ 👤 ᴜsᴇʀ   : @${senderNumber}
├ 🕐 ᴡᴀᴋᴛᴜ  : ${time} ᴡɪʙ
├ 📅 ᴛɢʟ    : ${date}
└───────────────────

» sʏsᴛᴇᴍ «
└───────────────────
├ 🚀 ᴜᴘᴛɪᴍᴇ : ${uptime} ᴊᴀᴍ
├ 💾 ʀᴀᴍ    : ${ram} ᴍʙ
├ 🖥️ sᴇʀᴠᴇʀ : ${platform} (${arch})
└───────────────────

━━━━━━━━━━━━━━━━━━━━

📄 ʏᴛ : ᴊᴜɴ ᴏꜰꜰɪᴄɪᴀʟ`;

            const logoPath = './logo.png';
            const mediaDoc = await prepareWAMessageMedia({
                image: fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : { url: 'https://telegra.ph/file/default.jpg' }
            }, { upload: sock.waUploadToServer });

            const sections = [
                {
                    title: "📥 ᴅᴏᴡɴʟᴏᴀᴅᴇʀ",
                    rows: [
                        { title: "ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ", description: "ᴅᴏᴡɴʟᴏᴀᴅ ᴠɪᴅᴇᴏ ᴛɪᴋᴛᴏᴋ", id: ".tt" },
                        { title: "ʏᴏᴜᴛᴜʙᴇ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ", description: "ᴅᴏᴡɴʟᴏᴀᴅ ᴠɪᴅᴇᴏ ʏᴏᴜᴛᴜʙᴇ", id: ".yt" },
                        { title: "ᴄᴀʀɪ ʟᴀɢᴜ", description: "ᴄᴀʀɪ & ᴅᴏᴡɴʟᴏᴀᴅ ʟᴀɢᴜ", id: ".song" },
                        { title: "ᴛᴇxᴛ ᴛᴏ ᴠᴏɪᴄᴇ", description: "ᴜʙᴀʜ ᴛᴇᴋs ᴊᴀᴅɪ sᴜᴀʀᴀ", id: ".gtts" }
                    ]
                },
                {
                    title: "🛡️ ᴀɴᴛɪʟɪɴᴋ sʏsᴛᴇᴍ",
                    rows: [
                        { title: "ᴀɴᴛɪʟɪɴᴋ ᴍᴇɴᴜ", description: "ᴍᴇɴᴜ ᴜᴛᴀᴍᴀ ᴀɴᴛɪʟɪɴᴋ", id: ".antilink" },
                        { title: "ᴀɴᴛɪʟɪɴᴋ ɢʀᴏᴜᴘ", description: "ꜰɪʟᴛᴇʀ ʟɪɴᴋ ɢʀᴜᴘ ᴡᴀ", id: ".antilinkgc" },
                        { title: "ᴀɴᴛɪʟɪɴᴋ ᴍᴇɴᴜ", description: "ꜰɪʟᴛᴇʀ ʟɪɴᴋ ᴄʜᴀɴɴᴇʟ ᴡᴀ", id: ".antilinkch" },
                        { title: "sᴛᴀᴛᴜs ᴀɴᴛɪʟɪɴᴋ", description: "ᴄᴇᴋ sᴇᴍᴜᴀ sᴛᴀᴛᴜs ᴀɴᴛɪʟɪɴᴋ", id: ".statusantilink" }
                    ]
                },
                {
                    title: "🤖 ᴀɪ & ᴛᴏᴏʟs",
                    rows: [
                        { title: "ᴀɪ ᴀssɪsᴛᴀɴᴛ", description: "ᴄʜᴀᴛ ᴅᴇɴɢᴀɴ ᴀɪ", id: ".ai" },
                        { title: "sᴛɪᴄᴋᴇʀ ᴍᴀᴋᴇʀ", description: "ʙᴜᴀᴛ sᴛɪᴄᴋᴇʀ", id: ".s" },
                        { title: "ʀᴇᴀᴅ ᴠɪᴇᴡ ᴏɴᴄᴇ", description: "ʙᴜᴋᴀ ᴘᴇsᴀɴ ᴠɪᴇᴡ ᴏɴᴄᴇ", id: ".rvo" },
                        { title: "ᴠɪᴇᴡ ᴏɴᴄᴇ sᴇɴʏᴀᴘ", description: "sɪᴍᴘᴀɴ ᴠɪᴇᴡ ᴏɴᴄᴇ", id: ".ekhm" },
                        { title: "ʀᴇᴍᴏᴠᴇ ʙᴀᴄᴋɢʀᴏᴜɴᴅ", description: "ʜᴀᴘᴜs ʙᴀᴄᴋɢʀᴏᴜɴᴅ", id: ".rbg" }
                    ]
                },
                {
                    title: "🔧 ɢʀᴏᴜᴘ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ",
                    rows: [
                        { title: "ᴋɪᴄᴋ ᴍᴇᴍʙᴇʀ", description: "ᴛᴇɴᴅᴀɴɢ ᴀɴɢɢᴏᴛᴀ", id: ".kick" },
                        { title: "ᴡᴇʟᴄᴏᴍᴇ", description: "ᴀᴛᴜʀ ᴡᴇʟᴄᴏᴍᴇ ᴍᴇssᴀɢᴇ", id: ".welcome" },
                        { title: "ᴜᴘʟᴏᴀᴅ sᴡ ɢʀᴜᴘ", description: "ᴋɪʀɪᴍ sᴛᴀᴛᴜs ᴋᴇ ɢʀᴜᴘ", id: ".upswgc" },
                        { title: "ᴛᴏᴛᴀʟ ꜰɪᴛᴜʀ", description: "ʟɪʜᴀᴛ sᴇᴍᴜᴀ ꜰɪᴛᴜʀ", id: ".totalfitur" }
                    ]
                },
                {
                    title: "👤 ɪɴꜰᴏ & sᴛᴀᴛᴜs",
                    rows: [
                        { title: "ᴄᴇᴋ ɪᴅ", description: "ᴄᴇᴋ ɪᴅ ɢʀᴜᴘ/ᴄʜᴀɴɴᴇʟ", id: ".cekid" },
                        { title: "ɪɴꜰᴏ ᴜsᴇʀ", description: "ᴄᴇᴋ ɪɴꜰᴏ ᴘᴇɴɢɢᴜɴᴀ", id: ".info" },
                        { title: "ʙᴏᴛ sᴛᴀᴛᴜs", description: "ᴄᴇᴋ sᴛᴀᴛᴜs ʙᴏᴛ", id: ".stats" },
                        { title: "ᴏᴡɴᴇʀ ʙᴏᴛ", description: "ᴋᴏɴᴛᴀᴋ ᴏᴡɴᴇʀ", id: ".owner" }
                    ]
                },
                {
                    title: "⚙️ ᴀᴅᴍɪɴ ʙᴏᴛ",
                    rows: [
                        { title: "ʙᴏᴛ ᴏɴ/ᴏꜰꜰ", description: "ᴀᴋᴛɪꜰ/ɴᴏɴᴀᴋᴛɪꜰ ʙᴏᴛ", id: ".bot" },
                        { title: "sᴇʟꜰ ᴍᴏᴅᴇ", description: "ᴘʀɪᴠᴀᴛᴇ ᴍᴏᴅᴇ", id: ".self" },
                        { title: "ᴀᴜᴛᴏ ʀᴇᴀᴅ", description: "ᴀᴜᴛᴏ ʙᴀᴄᴀ ᴘᴇsᴀɴ", id: ".autoread" },
                        { title: "ᴀᴜᴛᴏ ᴛʏᴘɪɴɢ", description: "ᴀᴜᴛᴏ ᴍᴇɴɢᴇᴛɪᴋ", id: ".autotyping" }
                    ]
                }
            ];

            let msg = generateWAMessageFromContent(from, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            header: {
                                title: "⚡ ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ ʙᴏᴛ ᴍᴇɴᴜ ⚡",
                                hasMediaAttachment: true,
                                ...mediaDoc
                            },
                            body: { text: menuText },
                            footer: { text: "ʙᴏᴛ ᴡʜᴀᴛsᴀᴘᴘ - ᴊᴜɴɴᴍᴏᴅs" },
                            nativeFlowMessage: {
                                buttons: [
                                    {
                                        name: "single_select",
                                        buttonParamsJson: JSON.stringify({
                                            title: "📋 ᴘɪʟɪʜ ᴍᴇɴᴜ",
                                            sections: sections
                                        })
                                    },
                                    {
                                        name: "cta_url",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "🏪 sᴛᴏʀᴇ",
                                            url: "https://junofficial354.my.id"
                                        })
                                    },
                                    {
                                        name: "cta_url",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "👤 ᴏᴡɴᴇʀ",
                                            url: "https://wa.me/6285808630057"
                                        })
                                    }
                                ]
                            },
                            contextInfo: {
                                mentionedJid: [mentionJid],
                                forwardingScore: 999,
                                isForwarded: true
                            }
                        }
                    }
                }
            }, { userJid: from, quoted: m });

            await sock.relayMessage(from, msg.message, { messageId: msg.key.id });

        } catch (e) {
            console.error("YTTA error:", e);
            await sock.sendMessage(from, { text: "❌ ᴛᴇʀᴊᴀᴅɪ ᴋᴇsᴀʟᴀʜᴀɴ sᴀᴀᴛ ᴍᴇɴᴀᴍᴘɪʟᴋᴀɴ ᴍᴇɴᴜ." });
        }
    }
};