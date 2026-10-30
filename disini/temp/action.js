import * as cloneManager from "./function/other.js";
import settings from "./settings.js";

export default async function actionHandler(sock, m, id, args) {
    const from = m.key.remoteJid;
    const routerNumber = settings.routerNumber.replace(/[^0-9]/g, "");

    switch (id) {
        // CASE 1: NGIRIM TAMPILAN BUTTON KE CHAT
        case "send_ui_logout": {
            const targetId = args[0];
            const data = global.db.logoutQueue?.[targetId];
            if (!data) return;

            const msgVerifikasi = {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            body: { text: `🔐 *KONFIRMASI LOGOUT*\n\nID: ${targetId}\nAlasan: ${data.alasan}\n\n*Yakin ingin logout?*` },
                            footer: { text: "Junn-Router System" },
                            header: { title: "⪨ FINAL CHECK ⪩", hasMediaAttachment: false },
                            nativeFlowMessage: {
                                buttons: [
                                    {
                                        name: "quick_reply",
                                        buttonParamsJson: JSON.stringify({ display_text: "✅ IYA, LOGOUT", id: `dologout ${targetId}` })
                                    },
                                    {
                                        name: "quick_reply",
                                        buttonParamsJson: JSON.stringify({ display_text: "❌ BATALKAN", id: `cancel_out ${targetId}` })
                                    }
                                ]
                            }
                        }
                    }
                }
            };
            return await sock.relayMessage(from, msgVerifikasi, { quoted: m });
        }

        // CASE 2: EKSEKUSI LOGOUT SAAT TOMBOL DIKLIK
        case "dologout": {
            const targetId = args[0];
            const data = global.db.logoutQueue?.[targetId];
            if (!data) return sock.sendMessage(from, { text: "⚠️ Sesi Habis." }, { quoted: m });

            await sock.sendMessage(from, { text: "🚀 *PROSES LOGOUT...*" }, { quoted: m });
            const success = await cloneManager.logoutClone(data.nomor, data.from, sock);
            
            if (success) {
                await sock.sendMessage(routerNumber + "@s.whatsapp.net", { text: `✅ *LOGOUT DONE*\nBot: ${data.nomor}` });
                delete global.db.logoutQueue[targetId];
            }
            break;
        }

        // CASE 3: BATALKAN
        case "cancel_out": {
            const targetId = args[0];
            delete global.db.logoutQueue?.[targetId];
            return await sock.sendMessage(from, { text: "✅ *DIBATALKAN*" }, { quoted: m });
        }
    }
}
