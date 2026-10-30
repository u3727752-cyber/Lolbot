import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { generateWAMessageFromContent } from "@itsliaaa/baileys";
import settings from "../settings.js";

const execPromise = promisify(exec);

async function sendReaction(sock, key, emoji) {
    await sock.sendMessage(key.remoteJid, { 
        react: { 
            text: emoji, 
            key: key 
        } 
    });
}

function buildReplyFunction(sock, from, m) {
    return async function reply(payload, editKey = null) {
        const logo = fs.existsSync('./logo.png') ? fs.readFileSync('./logo.png') : Buffer.alloc(0);
        let finalPayload = typeof payload === "string" ? { text: payload } : { ...payload };
        finalPayload.contextInfo = {
            ...(finalPayload.contextInfo || {}),
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: settings.chId,
                serverMessageId: 100,
                newsletterName: `TOLS V1.0`
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
}

function formatFileSize(bytes) {
    if (!bytes || isNaN(bytes)) return "Unknown";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / 1048576).toFixed(2) + " MB";
}

function formatNumber(num) {
    if (!num || num === "0") return "0";
    const n = parseInt(num);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
}

function cleanupFile(filePath) {
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
}

async function getMediaInfo(url) {
    try {
        const { stdout } = await execPromise(
            `yt-dlp --no-warnings --no-check-certificate --user-agent "Mozilla/5.0" --print title --print uploader --print view_count --print like_count --print comment_count --print duration "${url}"`,
            { encoding: 'utf8', timeout: 30000 }
        );
        const parts = stdout.split('\n').map(s => s.trim());
        return {
            title: parts[0] || "Unknown",
            uploader: parts[1] || "Unknown",
            views: parts[2] || "0",
            likes: parts[3] || "0",
            comments: parts[4] || "0",
            duration: parts[5] || "0"
        };
    } catch (e) {
        return null;
    }
}

async function downloadMedia(url, outputFile, format = "best") {
    await execPromise(
        `yt-dlp --no-warnings --no-check-certificate --user-agent "Mozilla/5.0" -f "${format}" --output "${outputFile}" "${url}"`,
        { encoding: 'utf8', timeout: 120000 }
    );
}

export const commands = {
    "tt": async (sock, m, options) => {
        const { from, args } = options;
        const sendReply = buildReplyFunction(sock, from, m);

        if (!args[0]) return sendReply(`🔗 *TIKTOK VIDEO*\n\n.tt <link>`);

        const url = args[0];
        const videoFile = path.join("/tmp", `tt_${Date.now()}.mp4`);

        try {
            await sendReaction(sock, m.key, "⏰");
            const info = await getMediaInfo(url);
            if (!info) {
                await sendReaction(sock, m.key, "❌");
                return sendReply("❌ Gagal mengambil info.");
            }

            await downloadMedia(url, videoFile, "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best");

            if (!fs.existsSync(videoFile)) {
                await sendReaction(sock, m.key, "❌");
                return sendReply("❌ Gagal download!");
            }

            const stats = fs.statSync(videoFile);
            if (stats.size > 100000000) {
                cleanupFile(videoFile);
                await sendReaction(sock, m.key, "❌");
                return sendReply("❌ File terlalu besar.");
            }

            await sendReaction(sock, m.key, "✅");
            await sock.sendMessage(from, {
                video: fs.readFileSync(videoFile),
                caption: `🎵 *TIKTOK VIDEO*\n📛 *Title:* ${info.title}\n👤 *Uploader:* ${info.uploader}\n👁️ *Views:* ${formatNumber(info.views)}\n👍 *Likes:* ${formatNumber(info.likes)}\n💬 *Comments:* ${formatNumber(info.comments)}\n⏱️ *Duration:* ${info.duration}s\n📦 *Size:* ${formatFileSize(stats.size)}`,
                mimetype: "video/mp4"
            }, { quoted: m });
            cleanupFile(videoFile);
        } catch (e) {
            cleanupFile(videoFile);
            await sendReaction(sock, m.key, "❌");
            sendReply("❌ Error!");
        }
    },

    "ttmp3": async (sock, m, options) => {
        const { from, args } = options;
        const sendReply = buildReplyFunction(sock, from, m);

        if (!args[0]) return sendReply(`🔗 *TIKTOK AUDIO*\n\n.ttmp3 <link>`);

        const url = args[0];
        const audioFile = path.join("/tmp", `tta_${Date.now()}.mp3`);

        try {
            await sendReaction(sock, m.key, "⏰");
            const info = await getMediaInfo(url);
            if (!info) {
                await sendReaction(sock, m.key, "❌");
                return sendReply("❌ Gagal mengambil info.");
            }

            await downloadMedia(url, audioFile, "bestaudio[ext=m4a]/bestaudio/best");

            if (!fs.existsSync(audioFile)) {
                await sendReaction(sock, m.key, "❌");
                return sendReply("❌ Gagal download!");
            }

            await sendReaction(sock, m.key, "✅");
            await sendReply(`🎵 *TIKTOK AUDIO*\n📛 *Title:* ${info.title}\n👤 *Uploader:* ${info.uploader}\n👁️ *Views:* ${formatNumber(info.views)}\n👍 *Likes:* ${formatNumber(info.likes)}`);
            await sock.sendMessage(from, {
                audio: fs.readFileSync(audioFile),
                mimetype: "audio/mpeg",
                fileName: `${info.title}.mp3`
            }, { quoted: m });
            cleanupFile(audioFile);
        } catch (e) {
            cleanupFile(audioFile);
            await sendReaction(sock, m.key, "❌");
            sendReply("❌ Error!");
        }
    },

    "song": async (sock, m, options) => {
        const { from, args } = options;
        const sendReply = buildReplyFunction(sock, from, m);

        if (!args[0]) return sendReply(`🎵 *CARI LAGU*\n\nContoh:\n.song dj tiktok,5\n.song lathi`);

        const rawArgs = args.join(" ");
        let query = rawArgs;
        let limit = null;

        if (rawArgs.includes(",")) {
            const parts = rawArgs.split(",");
            query = parts[0].trim();
            const possibleLimit = parseInt(parts[1].trim());
            if (!isNaN(possibleLimit)) {
                limit = Math.min(possibleLimit, 10);
            }
        }

        if (!limit) {
            const audioFile = path.join("/tmp", `song_${Date.now()}.mp3`);
            try {
                await sendReaction(sock, m.key, "⏰");
                const { stdout } = await execPromise(`yt-dlp --no-warnings --no-check-certificate --default-search "ytsearch" --print title --print uploader --print duration --print view_count "${query}"`);
                const [title, uploader, duration, views] = stdout.split('\n').map(s => s.trim());

                await execPromise(`yt-dlp --no-warnings --no-check-certificate --default-search "ytsearch" --extract-audio --audio-format mp3 --audio-quality 192K --output "${audioFile}" "${query}"`);

                if (!fs.existsSync(audioFile)) {
                    await sendReaction(sock, m.key, "❌");
                    return sendReply("❌ Tidak ditemukan.");
                }

                await sendReaction(sock, m.key, "✅");
                await sendReply(`🎵 *SONG FOUND*\n📛 *Title:* ${title}\n👤 *Uploader:* ${uploader}\n⏱️ *Duration:* ${duration}s\n👁️ *Views:* ${formatNumber(views)}`);
                await sock.sendMessage(from, {
                    audio: fs.readFileSync(audioFile),
                    mimetype: "audio/mpeg",
                    fileName: `${title || 'song'}.mp3`
                }, { quoted: m });
                cleanupFile(audioFile);
            } catch (e) {
                cleanupFile(audioFile);
                await sendReaction(sock, m.key, "❌");
                sendReply("❌ Error!");
            }
        } else {
            try {
                await sendReaction(sock, m.key, "⏰");
                const { stdout } = await execPromise(`yt-dlp --no-warnings --no-check-certificate --default-search "ytsearch${limit}" --print id --print title --print uploader "${query}"`);
                const lines = stdout.split('\n').map(s => s.trim()).filter(Boolean);
                
                const results = [];
                for (let i = 0; i < lines.length; i += 3) {
                    if (lines[i] && lines[i+1]) {
                        results.push({ id: lines[i], title: lines[i+1], uploader: lines[i+2] || "Unknown" });
                    }
                }

                if (results.length === 0) {
                    await sendReaction(sock, m.key, "❌");
                    return sendReply("❌ Lagu tidak ditemukan.");
                }

                const rows = results.map(res => ({
                    title: res.title.substring(0, 60),
                    description: `Uploader: ${res.uploader}`,
                    id: `.sgres https://www.youtube.com/watch?v=${res.id}`
                }));

                const msg = generateWAMessageFromContent(from, {
                    viewOnceMessage: {
                        message: {
                            interactiveMessage: {
                                header: { title: "🎵 PILIHAN LAGU" },
                                body: { text: `Menampilkan ${results.length} hasil pencarian untuk *${query}*.\nSilahkan pilih salah satu dibawah ini:` },
                                nativeFlowMessage: {
                                    buttons: [{ name: "single_select", buttonParamsJson: JSON.stringify({ title: "PILIH LAGU", sections: [{ title: "HASIL CARI", rows }] }) }]
                                }
                            }
                        }
                    }
                }, { userJid: from, quoted: m });
                
                await sock.relayMessage(from, msg.message, { messageId: msg.key.id });
                await sendReaction(sock, m.key, "✅");
            } catch (e) {
                await sendReaction(sock, m.key, "❌");
                sendReply("❌ Error saat mencari list lagu!");
            }
        }
    },

    "sgres": async (sock, m, options) => {
        const { args, from } = options;
        const sendReply = buildReplyFunction(sock, from, m);
        const url = args[0];

        try {
            await sock.sendMessage(from, { delete: m.key });
        } catch {}

        if (!url) return;

        const audioFile = path.join("/tmp", `song_${Date.now()}.mp3`);

        try {
            await sendReaction(sock, m.key, "⏰");
            const info = await getMediaInfo(url);
            
            await execPromise(`yt-dlp --no-warnings --no-check-certificate --extract-audio --audio-format mp3 --audio-quality 192K --output "${audioFile}" "${url}"`);
            
            if (!fs.existsSync(audioFile)) {
                await sendReaction(sock, m.key, "❌");
                return sendReply("❌ Gagal download lagu.");
            }

            await sendReaction(sock, m.key, "✅");
            await sock.sendMessage(from, { 
                audio: fs.readFileSync(audioFile), 
                mimetype: "audio/mpeg", 
                fileName: `${info?.title || 'song'}.mp3` 
            }, { quoted: m });
            cleanupFile(audioFile);
        } catch (e) {
            cleanupFile(audioFile);
            await sendReaction(sock, m.key, "❌");
            sendReply("❌ Error mengunduh lagu!");
        }
    },

    "ytmp4": async (sock, m, options) => {
        const { from, args } = options;
        const sendReply = buildReplyFunction(sock, from, m);

        if (!args[0]) return sendReply(`📺 *YOUTUBE VIDEO*\n\n.ytmp4 <link>`);

        const url = args[0];
        const videoFile = path.join("/tmp", `ytmp4_${Date.now()}.mp4`);

        try {
            await sendReaction(sock, m.key, "⏰");
            const info = await getMediaInfo(url);
            if (!info) {
                await sendReaction(sock, m.key, "❌");
                return sendReply("❌ Gagal mengambil info.");
            }

            await downloadMedia(url, videoFile, "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best");

            if (!fs.existsSync(videoFile)) {
                await sendReaction(sock, m.key, "❌");
                return sendReply("❌ Gagal download video.");
            }

            await sendReaction(sock, m.key, "✅");
            await sock.sendMessage(from, { 
                video: fs.readFileSync(videoFile), 
                caption: `📛 *Title:* ${info.title}\n👤 *Uploader:* ${info.uploader}`, 
                mimetype: "video/mp4" 
            }, { quoted: m });
            cleanupFile(videoFile);
        } catch (e) {
            cleanupFile(videoFile);
            await sendReaction(sock, m.key, "❌");
            sendReply("❌ Error!");
        }
    },

    "ytmp3": async (sock, m, options) => {
        const { from, args } = options;
        const sendReply = buildReplyFunction(sock, from, m);

        if (!args[0]) return sendReply(`🎵 *YOUTUBE AUDIO*\n\n.ytmp3 <link>`);

        const url = args[0];
        const audioFile = path.join("/tmp", `ytmp3_${Date.now()}.mp3`);

        try {
            await sendReaction(sock, m.key, "⏰");
            const info = await getMediaInfo(url);
            if (!info) {
                await sendReaction(sock, m.key, "❌");
                return sendReply("❌ Gagal mengambil info.");
            }

            await execPromise(`yt-dlp --no-warnings --no-check-certificate --extract-audio --audio-format mp3 --audio-quality 192K --output "${audioFile}" "${url}"`);

            if (!fs.existsSync(audioFile)) {
                await sendReaction(sock, m.key, "❌");
                return sendReply("❌ Gagal download audio.");
            }

            await sendReaction(sock, m.key, "✅");
            await sock.sendMessage(from, { 
                audio: fs.readFileSync(audioFile), 
                mimetype: "audio/mpeg", 
                fileName: `${info.title}.mp3` 
            }, { quoted: m });
            cleanupFile(audioFile);
        } catch (e) {
            cleanupFile(audioFile);
            await sendReaction(sock, m.key, "❌");
            sendReply("❌ Error!");
        }
    },

    "dlyt": async (sock, m, options) => {
        const { args, from } = options;
        const videoFile = path.join("/tmp", `dlyt_${Date.now()}.mp4`);
        const url = args[0], formatId = args[1], title = args.slice(2).join(" ");

        try {
            await sendReaction(sock, m.key, "⏰");
            await downloadMedia(url, videoFile, formatId);
            await sendReaction(sock, m.key, "✅");
            await sock.sendMessage(from, { video: fs.readFileSync(videoFile), caption: title, mimetype: "video/mp4" }, { quoted: m });
            cleanupFile(videoFile);
        } catch (e) {
            cleanupFile(videoFile);
            await sendReaction(sock, m.key, "❌");
        }
    },

    "dlya": async (sock, m, options) => {
        const { args, from } = options;
        const audioFile = path.join("/tmp", `dlya_${Date.now()}.mp3`);
        const url = args[0], formatId = args[1], title = args.slice(2).join(" ");

        try {
            await sendReaction(sock, m.key, "⏰");
            await downloadMedia(url, audioFile, formatId);
            await sendReaction(sock, m.key, "✅");
            await sock.sendMessage(from, { audio: fs.readFileSync(audioFile), mimetype: "audio/mpeg", fileName: `${title}.mp3` }, { quoted: m });
            cleanupFile(audioFile);
        } catch (e) {
            cleanupFile(audioFile);
            await sendReaction(sock, m.key, "❌");
        }
    }
};
