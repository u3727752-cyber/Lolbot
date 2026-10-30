import settings from "../settings.js";
import axios from "axios";

const SYSTEM_PROMPT = "Kamu adalah asisten AI yang WAJIB menjawab HANYA dalam Bahasa Indonesia secara default. Gunakan Bahasa Indonesia yang baik, natural, dan mudah dipahami. KECUALI jika pengguna secara eksplisit meminta jawaban dalam bahasa lain (misal: Inggris, Jepang, Arab, dll), barulah jawab dengan bahasa yang diminta. Jangan pernah mencampur bahasa dalam satu jawaban kecuali istilah teknis yang memang tidak ada padanannya. Selalu ramah, jelas, dan langsung ke inti jawaban.";

function toWhatsAppMarkdown(text) {
    if (typeof text !== "string") text = String(text);

    let out = text;

    out = out.replace(/^#{1,6}\s+(.+)$/gm, "*$1*");
    out = out.replace(/\*\*(.+?)\*\*/g, "*$1*");
    out = out.replace(/__(.+?)__/g, "_$1_");
    out = out.replace(/~~(.+?)~~/g, "~$1~");
    out = out.replace(/`{3}([\s\S]*?)`{3}/g, "```$1```");
    out = out.replace(/`([^`]+)`/g, "`$1`");
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
    out = out.replace(/^\s*[-*+]\s+/gm, "• ");
    out = out.replace(/^\s*>\s?/gm, "> ");
    out = out.replace(/\n{3,}/g, "\n\n");
    out = out.replace(/<br\s*\/?>/gi, "\n");
    out = out.replace(/<[^>]+>/g, "");

    return out.trim();
}

export const commands = {
    "ai": async (sock, m, options) => {
        const { args, from } = options;
        const query = args.join(" ");
        if (!query) return sock.sendMessage(from, { text: "❌ Mau nanya apa?\n\nContoh: *.ai siapa presiden indonesia*" }, { quoted: m });

        const apikey = "xmzwin";
        const fullPrompt = `${SYSTEM_PROMPT}\n\nPertanyaan: ${query}`;
        const url = `https://xemzzkerenbangetcoy.zone.id/api/apikey=${apikey}&ai?text=${encodeURIComponent(fullPrompt)}`;

        try {
            await sock.sendPresenceUpdate("composing", from);

            const response = await axios.get(url, { timeout: 60000 });

            await sock.sendPresenceUpdate("paused", from);

            const data = response.data;
            let answer = data?.text || data?.result?.text || data?.result || data?.message || data?.response || data?.data || (typeof data === "string" ? data : null);

            if (!answer) return sock.sendMessage(from, { text: "❌ AI tidak memberikan respon. Coba lagi nanti ya!" }, { quoted: m });

            if (typeof answer === "object") answer = JSON.stringify(answer, null, 2);

            const formatted = toWhatsAppMarkdown(String(answer));

            await sock.sendMessage(from, { text: formatted }, { quoted: m });

        } catch (e) {
            await sock.sendPresenceUpdate("paused", from);
            console.error("AI error:", e.message);
            await sock.sendMessage(from, { text: `❌ Maaf, AI sedang sibuk.\n\n_${e.message}_` }, { quoted: m });
        }
    },

    "tanyai": async (sock, m, options) => {
        return await commands["ai"](sock, m, options);
    }
};