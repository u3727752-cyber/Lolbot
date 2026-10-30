import axios from "axios";

async function translateText(text, to = "id") {
    const url = `https://xmz-translate.vercel.app/api?text=${encodeURIComponent(text)}&to=${to}`;
    const res = await axios.get(url, { timeout: 30000 });
    return res.data;
}

export const commands = {
    "tr": async (sock, m, options) => {
        const { from, args, reply } = options;

        let teks = args.join(" ").trim();
        let targetLang = "id";

        if (teks.includes("|")) {
            const parts = teks.split("|");
            teks = parts[0].trim();
            targetLang = parts[1].trim() || "id";
        }

        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quoted?.conversation ||
                           quoted?.extendedTextMessage?.text ||
                           quoted?.imageMessage?.caption ||
                           quoted?.videoMessage?.caption ||
                           "";

        if (!teks && quotedText) {
            teks = quotedText;
        }

        if (!teks) {
            return sock.sendMessage(from, {
                text: "❌ *Cara pakai:*\n\n1. Reply pesan yang mau di-translate, terus ketik:\n`.tr`\n\n2. Atau ketik langsung:\n`.tr Hello World`\n\n3. Ke bahasa lain:\n`.tr Hello World|ja`"
            }, { quoted: m });
        }

        try {
            await sock.sendPresenceUpdate("composing", from);

            const result = await translateText(teks, targetLang);

            await sock.sendPresenceUpdate("paused", from);

            if (!result || !result.success) {
                return sock.sendMessage(from, { text: "❌ Gagal menerjemahkan." }, { quoted: m });
            }

            const teksBalas = `🌐 *TRANSLATE*\n\n` +
                `📝 *Asal:* ${result.original}\n` +
                `🔤 *Dari:* ${result.from}\n` +
                `➡️ *Ke:* ${result.to}\n\n` +
                `✅ *Hasil:*\n${result.translated}`;

            await sock.sendMessage(from, { text: teksBalas }, { quoted: m });

        } catch (e) {
            await sock.sendPresenceUpdate("paused", from);
            await sock.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: m });
        }
    },

    "translate": async (sock, m, options) => {
        return await commands["tr"](sock, m, options);
    }
};