// plugin/hd.js
import fs from "fs";
import sharp from "sharp";
import { downloadMediaMessage, generateWAMessageFromContent } from "@itsliaaa/baileys";
import settings from "../settings.js";

let mediaCache = {};

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
                newsletterName: `HD V1.0`
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

async function extractMedia(sock, m) {
    const quotedMsg = m.quoted ? m.quoted.message : m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg) return null;
    const type = Object.keys(quotedMsg)[0];
    if (!["imageMessage", "videoMessage", "stickerMessage"].includes(type)) return null;
    try {
        const buffer = await downloadMediaMessage({ message: quotedMsg }, "buffer", {}, {});
        const mediaType = type.replace("Message", "");
        return { buffer, type: mediaType, raw: quotedMsg };
    } catch (e) {
        return null;
    }
}

function getCaptionFromMessage(m) {
    const quotedMsg = m.quoted ? m.quoted.message : m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg) return "";
    const type = Object.keys(quotedMsg)[0];
    if (quotedMsg[type]?.caption) {
        return quotedMsg[type].caption;
    }
    return "";
}

async function applyEffect(sharpInstance, effect) {
    switch(effect) {
        case "ocean":
            return sharpInstance.modulate({ brightness: 1.1, saturation: 1.4, hue: 10 }).sharpen({ sigma: 2, flat: 1, jagged: 2 });
        case "cinematic":
            return sharpInstance.modulate({ brightness: 0.9, saturation: 1.3 }).gamma(0.8).sharpen({ sigma: 1.5 });
        case "vivid":
            return sharpInstance.modulate({ brightness: 1, saturation: 1.6 }).sharpen({ sigma: 1 });
        case "dramatic":
            return sharpInstance.modulate({ brightness: 0.8, saturation: 1.2 }).gamma(0.7).sharpen({ sigma: 2 });
        case "soft":
            return sharpInstance.modulate({ brightness: 1.1, saturation: 0.8 }).blur(1).sharpen({ sigma: 0.5 });
        case "hdr":
            return sharpInstance.modulate({ brightness: 0.9, saturation: 1.3 }).gamma(0.9).sharpen({ sigma: 2.5 });
        case "neon":
            return sharpInstance.modulate({ brightness: 1.2, saturation: 1.8, hue: 20 }).sharpen({ sigma: 2 });
        case "vintage":
            return sharpInstance.modulate({ brightness: 0.8, saturation: 0.6 }).gamma(0.9).sharpen({ sigma: 0.5 });
        case "cartoon":
            return sharpInstance.modulate({ brightness: 1.1, saturation: 1.5 }).sharpen({ sigma: 3, flat: 2, jagged: 3 });
        case "glow":
            return sharpInstance.modulate({ brightness: 1.3, saturation: 1.1 }).blur(0.5).sharpen({ sigma: 1 });
        case "monochrome":
            return sharpInstance.grayscale().modulate({ brightness: 1.1, saturation: 0 }).sharpen({ sigma: 1.5 });
        case "sepia":
            return sharpInstance.modulate({ brightness: 0.9, saturation: 0.5 }).tint({ r: 180, g: 120, b: 80 }).sharpen({ sigma: 0.5 });
        case "cool":
            return sharpInstance.modulate({ brightness: 0.9, saturation: 1.1, hue: -20 }).sharpen({ sigma: 1.5 });
        case "warm":
            return sharpInstance.modulate({ brightness: 1.1, saturation: 1.1, hue: 20 }).sharpen({ sigma: 1.5 });
        case "pastel":
            return sharpInstance.modulate({ brightness: 1.2, saturation: 0.7 }).blur(0.5).sharpen({ sigma: 0.5 });
        case "sharp":
            return sharpInstance.sharpen({ sigma: 3, flat: 2, jagged: 3 });
        case "noise":
            return sharpInstance.modulate({ brightness: 1 }).sharpen({ sigma: 0.5 });
        default:
            return sharpInstance;
    }
}

async function processImage(sock, m, from, reply, media, effect, captionText, quality) {
    try {
        await reply(`⏳ Memproses ${effect.toUpperCase()}...`);
        
        const tempInput = `/tmp/hd_in_${Date.now()}.jpg`;
        const tempOutput = `/tmp/hd_out_${Date.now()}.jpg`;
        
        fs.writeFileSync(tempInput, media.buffer);
        
        let pipeline = sharp(tempInput);
        pipeline = pipeline.resize(7680, 4320, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 1 },
            kernel: sharp.kernel.lanczos3
        });
        pipeline = await applyEffect(pipeline, effect);
        await pipeline.jpeg({ quality: quality || 100, chromaSubsampling: '4:4:4' }).toFile(tempOutput);
        
        const resultBuffer = fs.readFileSync(tempOutput);
        const stats = fs.statSync(tempOutput);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        
        const effectEmojis = {
            ocean: "🌊", cinematic: "🎬", vivid: "🌈", dramatic: "🎭",
            soft: "🌸", hdr: "💎", neon: "💡", vintage: "📻",
            cartoon: "🎨", glow: "✨", monochrome: "⚫", sepia: "🟫",
            cool: "❄️", warm: "☀️", pastel: "🌸", sharp: "🔪",
            noise: "🎞️"
        };
        
        let finalCaption = `✅ *8K ${effect.toUpperCase()}!*\n\n`;
        finalCaption += `${effectEmojis[effect] || "⚡"} Effect: ${effect.toUpperCase()}\n`;
        finalCaption += `📐 Resolution: 7680x4320 (8K)\n`;
        finalCaption += `📦 Size: ${sizeMB} MB\n`;
        if (captionText) {
            finalCaption += `\n📝 ${captionText}`;
        }
        
        const logo = fs.existsSync('./logo.png') ? fs.readFileSync('./logo.png') : Buffer.alloc(0);
        
        await sock.sendMessage(from, {
            image: resultBuffer,
            caption: finalCaption,
            mimetype: "image/jpeg",
            contextInfo: {
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
            }
        }, { quoted: m });
        
        fs.unlinkSync(tempInput);
        fs.unlinkSync(tempOutput);
        
        delete mediaCache[m.key.id];
        
    } catch (e) {
        console.error("Process error:", e);
        reply("❌ Gagal: " + e.message);
    }
}

export const commands = {
    "hd": async (sock, m, options) => {
        const { from, reply, msg, text, realSender } = options;
        
        const media = await extractMedia(sock, m);
        if (!media) {
            return reply(`📝 *Format HD*\n\nReply gambar/sticker dengan caption .hd`);
        }
        
        if (media.type !== "image" && media.type !== "sticker") {
            return reply("❌ Hanya support gambar atau sticker!");
        }
        
        mediaCache[m.key.id] = media;
        
        const captionText = text || getCaptionFromMessage(m) || "";
        
        const sections = [
            {
                title: "🌊 EFFECTS & FILTERS",
                highlight_label: "POPULER",
                rows: [
                    { title: "🌊 8K + Ultra Ocean", description: "Biru segar, kontras tinggi", id: `.hdocean ${m.key.id}` },
                    { title: "💎 8K + HDR", description: "High Dynamic Range", id: `.hdhdr ${m.key.id}` },
                    { title: "🌈 8K + Vivid", description: "Warna super hidup", id: `.hdvivid ${m.key.id}` },
                    { title: "🎬 8K + Cinematic", description: "Film look, warm tone", id: `.hdcinematic ${m.key.id}` },
                    { title: "🎭 8K + Dramatic", description: "Dark & intense", id: `.hddramatic ${m.key.id}` }
                ]
            },
            {
                title: "🎨 CREATIVE EFFECTS",
                highlight_label: "ARTISTIK",
                rows: [
                    { title: "🌸 8K + Soft", description: "Lembut, blur tipis", id: `.hdsoft ${m.key.id}` },
                    { title: "💡 8K + Neon", description: "Warna neon menyala", id: `.hdneon ${m.key.id}` },
                    { title: "📻 8K + Vintage", description: "Nuansa retro klasik", id: `.hdvintage ${m.key.id}` },
                    { title: "🎨 8K + Cartoon", description: "Efek kartun", id: `.hdcartoon ${m.key.id}` },
                    { title: "✨ 8K + Glow", description: "Efek glow/cahaya", id: `.hdglow ${m.key.id}` }
                ]
            },
            {
                title: "🎞️ CLASSIC FILTERS",
                highlight_label: "KLASIK",
                rows: [
                    { title: "⚫ 8K + Monochrome", description: "Hitam putih", id: `.hdmonochrome ${m.key.id}` },
                    { title: "🟫 8K + Sepia", description: "Nuansa coklat tua", id: `.hdsepia ${m.key.id}` },
                    { title: "❄️ 8K + Cool", description: "Warna dingin", id: `.hdcool ${m.key.id}` },
                    { title: "☀️ 8K + Warm", description: "Warna hangat", id: `.hdwarm ${m.key.id}` },
                    { title: "🌸 8K + Pastel", description: "Warna pastel lembut", id: `.hdpastel ${m.key.id}` }
                ]
            },
            {
                title: "🔧 ENHANCEMENT",
                highlight_label: "KUALITAS",
                rows: [
                    { title: "🔪 8K + Sharp", description: "Tajam maksimal", id: `.hdsharp ${m.key.id}` },
                    { title: "🎞️ 8K + Noise", description: "Efek film grain", id: `.hdnoise ${m.key.id}` },
                    { title: "⚡ 8K Default", description: "Tanpa efek", id: `.hddefault ${m.key.id}` }
                ]
            }
        ];
        
        const logo = fs.existsSync('./logo.png') ? fs.readFileSync('./logo.png') : Buffer.alloc(0);
        
        const msg2 = generateWAMessageFromContent(from, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: { title: "📸 HD UPSCALER 8K", hasMediaAttachment: false },
                        body: { text: `*Pilih efek untuk gambar:*\n\n📋 ${captionText || 'Tanpa caption'}` },
                        footer: { text: "⚡ 8K Resolution - Lanczos3" },
                        nativeFlowMessage: {
                            buttons: [{
                                name: "single_select",
                                buttonParamsJson: JSON.stringify({
                                    title: "🎨 PILIH EFFECT",
                                    sections: sections
                                })
                            }]
                        },
                        contextInfo: {
                            mentionedJid: [realSender + "@s.whatsapp.net"],
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
                        }
                    }
                }
            }
        }, { userJid: from, quoted: m });
        
        await sock.relayMessage(from, msg2.message, { messageId: msg2.key.id });
    },
    
    "hdocean": async (sock, m, options) => {
        const { from, reply, msg, args } = options;
        const id = args[0];
        const media = mediaCache[id];
        if (!media) return reply("❌ Media tidak ditemukan! Kirim ulang .hd");
        const captionText = getCaptionFromMessage(m) || "";
        await processImage(sock, m, from, reply, media, "ocean", captionText, 100);
    },
    
    "hdcinematic": async (sock, m, options) => {
        const { from, reply, msg, args } = options;
        const id = args[0];
        const media = mediaCache[id];
        if (!media) return reply("❌ Media tidak ditemukan! Kirim ulang .hd");
        const captionText = getCaptionFromMessage(m) || "";
        await processImage(sock, m, from, reply, media, "cinematic", captionText, 100);
    },
    
    "hdvivid": async (sock, m, options) => {
        const { from, reply, msg, args } = options;
        const id = args[0];
        const media = mediaCache[id];
        if (!media) return reply("❌ Media tidak ditemukan! Kirim ulang .hd");
        const captionText = getCaptionFromMessage(m) || "";
        await processImage(sock, m, from, reply, media, "vivid", captionText, 100);
    },
    
    "hddramatic": async (sock, m, options) => {
        const { from, reply, msg, args } = options;
        const id = args[0];
        const media = mediaCache[id];
        if (!media) return reply("❌ Media tidak ditemukan! Kirim ulang .hd");
        const captionText = getCaptionFromMessage(m) || "";
        await processImage(sock, m, from, reply, media, "dramatic", captionText, 100);
    },
    
    "hdsoft": async (sock, m, options) => {
        const { from, reply, msg, args } = options;
        const id = args[0];
        const media = mediaCache[id];
        if (!media) return reply("❌ Media tidak ditemukan! Kirim ulang .hd");
        const captionText = getCaptionFromMessage(m) || "";
        await processImage(sock, m, from, reply, media, "soft", captionText, 100);
    },
    
    "hdhdr": async (sock, m, options) => {
        const { from, reply, msg, args } = options;
        const id = args[0];
        const media = mediaCache[id];
        if (!media) return reply("❌ Media tidak ditemukan! Kirim ulang .hd");
        const captionText = getCaptionFromMessage(m) || "";
        await processImage(sock, m, from, reply, media, "hdr", captionText, 100);
    },
    
    "hdneon": async (sock, m, options) => {
        const { from, reply, msg, args } = options;
        const id = args[0];
        const media = mediaCache[id];
        if (!media) return reply("❌ Media tidak ditemukan! Kirim ulang .hd");
        const captionText = getCaptionFromMessage(m) || "";
        await processImage(sock, m, from, reply, media, "neon", captionText, 100);
    },
    
    "hdvintage": async (sock, m, options) => {
        const { from, reply, msg, args } = options;
        const id = args[0];
        const media = mediaCache[id];
        if (!media) return reply("❌ Media tidak ditemukan! Kirim ulang .hd");
        const captionText = getCaptionFromMessage(m) || "";
        await processImage(sock, m, from, reply, media, "vintage", captionText, 100);
    },
    
    "hdcartoon": async (sock, m, options) => {
        const { from, reply, msg, args } = options;
        const id = args[0];
        const media = mediaCache[id];
        if (!media) return reply("❌ Media tidak ditemukan! Kirim ulang .hd");
        const captionText = getCaptionFromMessage(m) || "";
        await processImage(sock, m, from, reply, media, "cartoon", captionText, 100);
    },
    
    "hdglow": async (sock, m, options) => {
        const { from, reply, msg, args } = options;
        const id = args[0];
        const media = mediaCache[id];
        if (!media) return reply("❌ Media tidak ditemukan! Kirim ulang .hd");
        const captionText = getCaptionFromMessage(m) || "";
        await processImage(sock, m, from, reply, media, "glow", captionText, 100);
    },
    
    "hdmonochrome": async (sock, m, options) => {
        const { from, reply, msg, args } = options;
        const id = args[0];
        const media = mediaCache[id];
        if (!media) return reply("❌ Media tidak ditemukan! Kirim ulang .hd");
        const captionText = getCaptionFromMessage(m) || "";
        await processImage(sock, m, from, reply, media, "monochrome", captionText, 100);
    },
    
    "hdsepia": async (sock, m, options) => {
        const { from, reply, msg, args } = options;
        const id = args[0];
        const media = mediaCache[id];
        if (!media) return reply("❌ Media tidak ditemukan! Kirim ulang .hd");
        const captionText = getCaptionFromMessage(m) || "";
        await processImage(sock, m, from, reply, media, "sepia", captionText, 100);
    },
    
    "hdcool": async (sock, m, options) => {
        const { from, reply, msg, args } = options;
        const id = args[0];
        const media = mediaCache[id];
        if (!media) return reply("❌ Media tidak ditemukan! Kirim ulang .hd");
        const captionText = getCaptionFromMessage(m) || "";
        await processImage(sock, m, from, reply, media, "cool", captionText, 100);
    },
    
    "hdwarm": async (sock, m, options) => {
        const { from, reply, msg, args } = options;
        const id = args[0];
        const media = mediaCache[id];
        if (!media) return reply("❌ Media tidak ditemukan! Kirim ulang .hd");
        const captionText = getCaptionFromMessage(m) || "";
        await processImage(sock, m, from, reply, media, "warm", captionText, 100);
    },
    
    "hdpastel": async (sock, m, options) => {
        const { from, reply, msg, args } = options;
        const id = args[0];
        const media = mediaCache[id];
        if (!media) return reply("❌ Media tidak ditemukan! Kirim ulang .hd");
        const captionText = getCaptionFromMessage(m) || "";
        await processImage(sock, m, from, reply, media, "pastel", captionText, 100);
    },
    
    "hdsharp": async (sock, m, options) => {
        const { from, reply, msg, args } = options;
        const id = args[0];
        const media = mediaCache[id];
        if (!media) return reply("❌ Media tidak ditemukan! Kirim ulang .hd");
        const captionText = getCaptionFromMessage(m) || "";
        await processImage(sock, m, from, reply, media, "sharp", captionText, 100);
    },
    
    "hdnoise": async (sock, m, options) => {
        const { from, reply, msg, args } = options;
        const id = args[0];
        const media = mediaCache[id];
        if (!media) return reply("❌ Media tidak ditemukan! Kirim ulang .hd");
        const captionText = getCaptionFromMessage(m) || "";
        await processImage(sock, m, from, reply, media, "noise", captionText, 100);
    },
    
    "hddefault": async (sock, m, options) => {
        const { from, reply, msg, args } = options;
        const id = args[0];
        const media = mediaCache[id];
        if (!media) return reply("❌ Media tidak ditemukan! Kirim ulang .hd");
        const captionText = getCaptionFromMessage(m) || "";
        await processImage(sock, m, from, reply, media, "default", captionText, 100);
    }
};