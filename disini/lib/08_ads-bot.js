import fs from "fs";
import yaml from "yaml";

export async function execute(ctx) {
    const { sock, msg, from, userJid, senderName, isPrivate, firstTimeUsers } = ctx;
    if (msg.key.fromMe) return;
    if (!isPrivate) return;

    try {
        const config = yaml.load(fs.readFileSync('./db/yaml/respon.yaml', 'utf8'));
        if (config?.settings?.welcome_message && !firstTimeUsers.has(userJid)) {
            firstTimeUsers.add(userJid);
            await sock.sendMessage(from, {
                text: `👋 *Halo ${senderName}!* Selamat datang di JUN BOT\n\n📌 *Panduan Cepat:*\n➠ Ketik *.menu* untuk lihat perintah\n➠ Ketik *.ai* untuk chat AI\n\n_Selamat menggunakan! 🚀_`,
                mentions: [userJid] 
            });
        }
    } catch (e) {}
}