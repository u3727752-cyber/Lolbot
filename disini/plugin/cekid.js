import fs from "fs";
import { generateWAMessageFromContent, prepareWAMessageMedia } from "@itsliaaa/baileys";
import { buildReplyFunction as R, msg } from "../function/global.js";

export const commands = {
    "cekid": async (s, m, o) => {
        const r = R(s, o.from, m);
        const link = (o.args[0] || "").trim();
        if (!link || !link.includes("whatsapp.com")) return r(msg.invalidFormat(".cekid", ".cekid <ʟɪɴᴋ>\n\nɢʀᴏᴜᴘ: chat.whatsapp.com/xxx\nᴄʜᴀɴɴᴇʟ: whatsapp.com/channel/xxx"));

        try {
            let isNL = link.includes("channel") || link.includes("newsletter");
            let id, name, desc, pfp, mc;

            if (isNL) {
                let meta = await s.newsletterMetadata("invite", link.split("/").pop());
                id = meta.id; name = meta.name; desc = meta.description || "ᴛɪᴅᴀᴋ ᴀᴅᴀ ᴅᴇsᴋʀɪᴘsɪ.";
            } else {
                let meta = await s.groupGetInviteInfo(link.split("chat.whatsapp.com/")[1]?.split("/")[0]);
                id = meta.id; name = meta.subject; desc = meta.desc || "ᴛɪᴅᴀᴋ ᴀᴅᴀ ᴅᴇsᴋʀɪᴘsɪ."; mc = meta.size;
            }

            try { pfp = await s.profilePictureUrl(id, 'image'); } catch { pfp = null; }

            let txt = `\`「 ɪᴅ ᴅᴇᴛᴇᴄᴛᴏʀ sʏsᴛᴇᴍ 」\`\n\n┌  ◦  *ɴᴀᴍᴇ:* ${name}\n│  ◦  *ᴛʏᴘᴇ:* ${isNL?"ᴄʜᴀɴɴᴇʟ":"ɢʀᴏᴜᴘ"}\n${mc?`│  ◦  *ᴍᴇᴍʙᴇʀs:* ${mc}\n`:""}└  ◦  *ɪᴅ:* \`${id}\`\n\n*📝 ᴅᴇsᴄʀɪᴘᴛɪᴏɴ:*\n${desc}`;

            const imgBuf = pfp ? { url: pfp } : (fs.existsSync('./logo.png') ? fs.readFileSync('./logo.png') : { url: 'https://telegra.ph/file/default.jpg' });
            const media = await prepareWAMessageMedia({ image: imgBuf }, { upload: s.waUploadToServer });

            const msg = generateWAMessageFromContent(o.from, {
                viewOnceMessage: { message: { interactiveMessage: {
                    header: { title: "⚡ *ɪᴅ ᴍᴇᴛᴀᴅᴀᴛᴀ ꜰᴏᴜɴᴅ* ⚡", hasMediaAttachment: true, ...media },
                    body: { text: txt },
                    footer: { text: "ᴊᴜɴᴍᴏᴅs" },
                    nativeFlowMessage: { buttons: [
                        { name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "📋 ᴄᴏᴘʏ ɪᴅ", copy_code: id }) },
                        { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "🔗 ʙᴜᴋᴀ", url: link }) }
                    ]},
                    contextInfo: { mentionedJid: [o.realSender + "@s.whatsapp.net"], forwardingScore: 999, isForwarded: true }
                }}}
            }, { userJid: o.from, quoted: m });

            await s.relayMessage(o.from, msg.message, { messageId: msg.key.id });
        } catch (e) { console.error(e); r(msg.error); }
    }
};