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
                newsletterName: `GOOGLE SEARCH PRE-RELEASE`
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

function parseCookies(filePath) {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    const cookies = [];
    for (const line of lines) {
        if (line.startsWith("#") || line.trim() === "") continue;
        const parts = line.split("\t");
        if (parts.length >= 7) {
            cookies.push({
                domain: parts[0].trim(),
                flag: parts[1].trim(),
                path: parts[2].trim(),
                secure: parts[3].trim(),
                expiration: parts[4].trim(),
                name: parts[5].trim(),
                value: parts.slice(6).join("=").trim()
            });
        }
    }
    return cookies;
}

function cookiesToHeader(cookies, domain) {
    const matched = cookies.filter(c => domain.endsWith(c.domain.replace(/^\./, "")) || c.domain.replace(/^\./, "") === domain);
    return matched.map(c => `${c.name}=${c.value}`).join("; ");
}

async function googleSearch(query) {
    const cookiePath = "./env/cookies.txt";
    if (!fs.existsSync(cookiePath)) throw new Error("Cookie file not found");
    const cookies = parseCookies(cookiePath);
    const cookieHeader = cookiesToHeader(cookies, "google.com");

    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en&gl=id&num=10`;

    const response = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
            "Cookie": cookieHeader,
            "Referer": "https://www.google.com/"
        }
    });

    if (response.status === 429) throw new Error("RATE_LIMITED");
    if (!response.ok) throw new Error("HTTP_" + response.status);

    const html = await response.text();

    if (html.includes("Our systems have detected unusual traffic") || html.includes("g-recaptcha")) {
        throw new Error("BLOCKED");
    }

    const results = [];
    const regex = /<div[^>]*class="[^"]*tF2Cxc[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>/gi;
    
    let match;
    while ((match = regex.exec(html)) !== null && results.length < 5) {
        const url = match[1];
        const title = match[2].replace(/<[^>]+>/g, "").trim();
        if (url.startsWith("http") && title) {
            results.push({ title, url });
        }
    }

    return results;
}

export const commands = {
    "google": async (sock, m, options) => {
        const { reply, args, from } = options;
        const query = args.join(" ");
        if (!query) return reply("❌ Masukkan kata kunci!\n\nContoh: *.google github*");

        const replyFn = buildReplyFunction(sock, from, m);
        await replyFn("🔍 *Mencari...*\n```" + query + "```");

        try {
            const results = await googleSearch(query);

            if (results.length === 0) {
                return replyFn("❌ Tidak ada hasil ditemukan.");
            }

            let text = `🔍 *GOOGLE SEARCH*\n📌 Query: *${query}*\n━━━━━━━━━━━━━━━━━\n\n`;
            results.forEach((r, i) => {
                text += `*${i + 1}. ${r.title}*\n🌐 ${r.url}\n\n`;
            });
            text += `━━━━━━━━━━━━━━━━━\n⚡ *${settings.ownerName}*`;

            await replyFn(text);

        } catch (err) {
            console.error("Google search error:", err);
            if (err.message === "RATE_LIMITED") return replyFn("⚠️ *Rate Limited*\nGoogle meminta verifikasi.");
            if (err.message === "BLOCKED") return replyFn("⚠️ Google memblokir permintaan. Cookies mungkin expired.");
            if (err.message === "Cookie file not found") return replyFn("❌ File cookies tidak ditemukan.");
            return replyFn("❌ Gagal melakukan pencarian.");
        }
    }
};
