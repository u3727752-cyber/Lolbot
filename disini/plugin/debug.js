export const commands = {
    "jembot": async (sock, m, options) => {
        const { from, reply } = options;
        const replyFn = async (text) => {
            await sock.sendMessage(from, { text }, { quoted: m });
        };

        try {
            const metadata = await sock.groupMetadata(from);
            const botJid = sock.user.id;
            const botNumber = botJid.replace(/[^0-9]/g, '');
            
            let text = `🔍 *DEBUG ADMIN*\n\n`;
            text += `Bot JID: ${botJid}\n`;
            text += `Bot Number: ${botNumber}\n\n`;
            text += `📋 *Participants:*\n`;
            
            let botFound = false;
            for (const p of metadata.participants) {
                const isAdmin = p.admin === 'admin' || p.admin === 'superadmin';
                const pNumber = p.id.replace(/[^0-9]/g, '');
                const isBot = pNumber === botNumber;
                
                if (isBot) {
                    botFound = true;
                    text += `🤖 BOT: ${p.id} | ${isAdmin ? '✅ ADMIN' : '❌ MEMBER'}\n`;
                } else {
                    text += `${isAdmin ? '👑' : '👤'} ${p.id}\n`;
                }
            }
            
            if (!botFound) {
                text += `\n❌ *BOT TIDAK DITEMUKAN!*\n`;
                text += `Bot Number: ${botNumber}\n\n`;
                text += `🔍 *Coba cari manual:*\n`;
                for (const p of metadata.participants) {
                    text += `- ${p.id} -> ${p.id.replace(/[^0-9]/g, '')}\n`;
                }
            }
            
            await replyFn(text);
        } catch (e) {
            await replyFn(`❌ Error: ${e.message}`);
        }
    }
};