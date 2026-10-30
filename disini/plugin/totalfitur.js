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
            forwardedNewsletterMessageInfo: {
                newsletterJid: settings.chId,
                serverMessageId: 100,
                newsletterName: `ALL FEATURE - BOT`
            },
            externalAdReply: {
                title: `⪨ YT ${settings.ownerName} ⪩`,
                body: `Powered by ${settings.ownerName}`,
                thumbnail: logo,
                mediaType: 1,
                renderLargerThumbnail: false
            }
        };
        return await sock.sendMessage(from, finalPayload, { quoted: m });
    };
}

export const commands = {
    "totalfitur": async (sock, m, options) => {
        const { from } = options;
        const replyFn = buildReplyFunction(sock, from, m);

        const pluginDir = "./plugin";
        if (!fs.existsSync(pluginDir)) return replyFn("❌ Folder plugin tidak ditemukan.");

        const files = fs.readdirSync(pluginDir).filter(f => f.endsWith(".js")).sort();
        let totalCommands = 0;
        const pluginList = [];

        for (const file of files) {
            try {
                const mod = await import(`../plugin/${file}?t=${Date.now()}`);
                if (mod.commands && typeof mod.commands === "object") {
                    const commandNames = Object.keys(mod.commands);
                    totalCommands += commandNames.length;
                    pluginList.push({
                        file,
                        commands: commandNames.map(c => `.${c}`).join(", "),
                        count: commandNames.length
                    });
                }
            } catch (e) {}
        }

        let text = `📊 *ᴛᴏᴛᴀʟ ꜰɪᴛᴜʀ ʙᴏᴛ*\n\n`;
        text += `🔌 ᴘʟᴜɢɪɴ: *${pluginList.length}*\n`;
        text += `⚡ ᴛᴏᴛᴀʟ ᴄᴏᴍᴍᴀɴᴅ: *${totalCommands}*\n`;
        text += `━━━━━━━━━━━━━━━━━\n\n`;
        text += `📋 *ᴅᴀꜰᴛᴀʀ ᴘʟᴜɢɪɴ:*\n\n`;

        pluginList.forEach((p, i) => {
            text += `*${i + 1}. ${p.file}* (${p.count})\n`;
            text += `   ${p.commands}\n\n`;
        });

        text += `━━━━━━━━━━━━━━━━━\n`;
        text += `⚡ *${settings.ownerName}*`;

        await replyFn(text);
    }
};