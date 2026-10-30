import fs from "fs";
import { downloadMediaMessage, generateWAMessageFromContent } from "@itsliaaa/baileys";
import { buildReplyFunction as R, msg } from "../function/global.js";

async function downloadQuotedMedia(sock, msg) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return null;
    const type = Object.keys(quoted)[0];
    if (!["imageMessage", "videoMessage", "audioMessage", "documentMessage", "stickerMessage"].includes(type)) return null;
    try {
        const buffer = await downloadMediaMessage({ message: quoted }, "buffer", {}, {});
        const mediaType = type.replace("Message", "");
        return { buffer, type: mediaType };
    } catch { return null; }
}

function generateInteractiveMessage(media, caption, buttons, footer = "⚡ JunnMods") {
    const msg = {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    header: media ? {
                        hasMediaAttachment: true,
                        ...media
                    } : {
                        hasMediaAttachment: false,
                        title: "📨 Pesan Interaktif"
                    },
                    body: { text: caption || "Pesan dari bot" },
                    footer: { text: footer },
                    nativeFlowMessage: {
                        buttons: buttons.map(btn => {
                            if (btn.type === "url") {
                                return {
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: btn.name,
                                        url: btn.value
                                    })
                                };
                            } else if (btn.type === "id" || btn.type === "quick_reply") {
                                return {
                                    name: "quick_reply",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: btn.name,
                                        id: btn.value
                                    })
                                };
                            } else if (btn.type === "copy") {
                                return {
                                    name: "cta_copy",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: btn.name,
                                        copy_code: btn.value
                                    })
                                };
                            } else if (btn.type === "call") {
                                return {
                                    name: "cta_call",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: btn.name,
                                        phone_number: btn.value
                                    })
                                };
                            } else if (btn.type === "reminder") {
                                return {
                                    name: "cta_reminder",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: btn.name,
                                        id: btn.value,
                                        timestamp: Math.floor(Date.now() / 1000) + 3600
                                    })
                                };
                            } else {
                                return {
                                    name: "quick_reply",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: btn.name,
                                        id: btn.value || "null"
                                    })
                                };
                            }
                        })
                    }
                }
            }
        }
    };
    return msg;
}

async function prepareMedia(sock, media) {
    if (!media) return null;
    const { prepareWAMessageMedia } = await import("@itsliaaa/baileys");
    const mediaObj = {};
    if (media.type === "image") mediaObj.image = media.buffer;
    else if (media.type === "video") mediaObj.video = media.buffer;
    else if (media.type === "document") mediaObj.document = media.buffer;
    else if (media.type === "audio") mediaObj.audio = media.buffer;
    else return null;
    return await prepareWAMessageMedia(mediaObj, { upload: sock.waUploadToServer });
}

function resolveTarget(targetPart, defaultTarget) {
    if (!targetPart) return defaultTarget;

    // Cek nomor HP
    if (targetPart.match(/^(\+?[0-9]{10,15})$/)) {
        return targetPart.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    }

    // Cek JID langsung
    if (targetPart.includes("@g.us") || targetPart.includes("@newsletter") || targetPart.includes("@s.whatsapp.net") || targetPart.includes("@lid")) {
        return targetPart;
    }

    // Cek link grup
    if (targetPart.includes("chat.whatsapp.com")) {
        return "GROUP_LINK:" + targetPart;
    }

    // Default: tambah @s.whatsapp.net
    return targetPart.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
}

function parseButtons(buttonText) {
    const buttons = [];
    const parts = buttonText.split(";").map(p => p.trim());
    for (const part of parts) {
        const segs = part.split(",").map(s => s.trim());
        if (segs.length >= 3) {
            buttons.push({
                name: segs[0],
                type: segs[1].toLowerCase(),
                value: segs[2]
            });
        }
    }
    return buttons;
}

export const commands = {
    "cbtn": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isOwner) return r(msg.onlyOwner);

        const fullText = o.args.join(" ");
        if (!fullText) {
            return r(`📋 *CARA PAKAI CBUTTON*

*.cbtn [caption] | [target] | [button1];[button2];...*

📌 *Contoh:*
.cbtn Halo! Selamat datang | 6285808630057 | Join,url,https://wa.me/6285808630057;Owner,id,.owner

.cbtn Promo Spesial! | group_link | Beli,url,https://toko.com;CS,id,.cs

.cbtn Test Kirim | channel_id | Oke,id,.oke;Info,url,https://info.com

*Fitur:*
• Bisa kirim ke grup/private/channel via nomor/link/id
• Support media dari reply pesan
• Bisa multiple button (max 3)
• Tipe button: url, id, quick_reply, copy, call, reminder`);
        }

        // Parse input: caption | target | buttons
        const parts = fullText.split("|").map(p => p.trim());
        let caption = "";
        let targetPart = "";
        let buttonPart = "";

        if (parts.length === 1) {
            // Coba parse: button1;button2... atau target
            if (parts[0].includes(";") && parts[0].includes(",")) {
                buttonPart = parts[0];
            } else {
                targetPart = parts[0];
            }
        } else if (parts.length === 2) {
            caption = parts[0];
            const second = parts[1];
            if (second.includes(";") && second.includes(",")) {
                buttonPart = second;
            } else {
                targetPart = second;
            }
        } else if (parts.length >= 3) {
            caption = parts[0];
            targetPart = parts[1];
            buttonPart = parts.slice(2).join(" | ");
        }

        // Ambil caption dari reply jika ada
        let media = null;
        let quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMsg) {
            media = await downloadQuotedMedia(s, m);
            if (media) {
                caption = quotedMsg.imageMessage?.caption ||
                          quotedMsg.videoMessage?.caption ||
                          quotedMsg.documentMessage?.caption ||
                          quotedMsg.audioMessage?.caption || caption;
            } else {
                caption = quotedMsg.conversation ||
                          quotedMsg.extendedTextMessage?.text || caption;
            }
        }

        if (!caption && !media) {
            caption = "📨 Pesan dari Bot";
        }

        // Parse button
        let buttons = [];
        if (buttonPart) {
            buttons = parseButtons(buttonPart);
        }
        if (buttons.length === 0 && fullText.includes(",") && !fullText.includes(";")) {
            // Fallback: single button
            const segs = fullText.split(",").map(s => s.trim());
            if (segs.length >= 3) {
                buttons.push({ name: segs[0], type: segs[1].toLowerCase(), value: segs[2] });
                caption = segs.slice(3).join(" ") || caption;
            }
        }

        if (buttons.length === 0) {
            return r("❌ Minimal 1 button! Format: nama,type,value");
        }

        if (buttons.length > 3) {
            return r("❌ Maksimal 3 button!");
        }

        // Resolve target
        let targetJid = o.from;
        let isGroupLink = false;
        let groupLinkCode = "";

        if (targetPart) {
            if (targetPart.startsWith("GROUP_LINK:")) {
                isGroupLink = true;
                groupLinkCode = targetPart.replace("GROUP_LINK:", "");
            } else if (targetPart.includes("chat.whatsapp.com")) {
                isGroupLink = true;
                groupLinkCode = targetPart.split("/").pop();
            } else {
                targetJid = resolveTarget(targetPart, o.from);
            }
        }

        try {
            // Jika target adalah link grup
            if (isGroupLink) {
                try {
                    const inviteInfo = await s.groupGetInviteInfo(groupLinkCode);
                    targetJid = inviteInfo.id;
                } catch (e) {
                    return r("❌ Gagal mendapatkan info grup dari link: " + e.message);
                }
            }

            // Prepare media
            let preparedMedia = null;
            if (media) {
                preparedMedia = await prepareMedia(s, media);
            }

            // Build message
            const msgPayload = generateInteractiveMessage(preparedMedia, caption, buttons, "⚡ JunnMods");

            const msg = generateWAMessageFromContent(
                targetJid,
                msgPayload,
                { userJid: targetJid, quoted: m }
            );

            await s.relayMessage(targetJid, msg.message, { messageId: msg.key.id });

            const targetDisplay = targetPart || targetJid;
            r(`✅ *Button terkirim!*\n\n📥 *Target:* ${targetDisplay}\n📝 *Caption:* ${caption.substring(0, 30)}${caption.length > 30 ? "..." : ""}\n🔘 *Button:* ${buttons.map(b => b.name).join(", ")}`);

        } catch (e) {
            console.error("CBUTTON ERROR:", e);
            r("❌ Gagal mengirim: " + e.message);
        }
    }
};