import fs from "fs";
import path from "path";
import { buildReplyFunction as R, msg } from "../function/global.js";
import { generateWAMessageFromContent } from "@itsliaaa/baileys";

const DB_DIR = "./db";
const DB_PATH = path.join(DB_DIR, "groups.json");

function ensureDb() {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({ groups: [] }, null, 2));
}

function loadDb() {
    ensureDb();
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    } catch (e) {
        return { groups: [] };
    }
}

function saveDb(db) {
    ensureDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export const commands = {
    "addgb": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isOwner) return r(msg.onlyOwner);

        const id = o.args[0];
        if (!id) return r(msg.invalidFormat(".addgb", ".addgb <idgroup>\n\nContoh:\n.addgb 120363405265126864@g.us"));
        if (!id.endsWith("@g.us")) return r("❌ ID harus format grup! Contoh: 120363405265126864@g.us");

        const db = loadDb();
        if (db.groups.includes(id)) return r("⚠️ Grup sudah ada di database!");

        db.groups.push(id);
        saveDb(db);

        r(`✅ *Grup ditambahkan!*\n\n📌 ID: ${id}\n📊 Total: ${db.groups.length} grup`);
    },

    "delgb": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isOwner) return r(msg.onlyOwner);

        const id = o.args[0];
        if (!id) return r(msg.invalidFormat(".delgb", ".delgb <idgroup>"));

        const db = loadDb();
        const idx = db.groups.indexOf(id);
        if (idx === -1) return r("❌ Grup tidak ada di database!");

        db.groups.splice(idx, 1);
        saveDb(db);

        r(`✅ *Grup dihapus!*\n\n📌 ID: ${id}\n📊 Sisa: ${db.groups.length} grup`);
    },

    "listgb": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isOwner) return r(msg.onlyOwner);

        const db = loadDb();
        if (db.groups.length === 0) return r("📭 Belum ada grup di database.");

        let teks = `📋 *DAFTAR GRUP* (${db.groups.length})\n\n`;
        db.groups.forEach((g, i) => {
            teks += `${i + 1}. ${g}\n`;
        });

        r(teks);
    },

    "cft": async (s, m, o) => {
        const r = R(s, o.from, m);

        if (!o.isOwner) return r(msg.onlyOwner);

        const input = o.args.join(" ");
        if (!input || !input.includes("|")) return r(msg.invalidFormat(".cft", ".cft <ʟᴀɢᴀ>|<ꜰᴇᴇ>|<ᴛɪᴍ>|<ᴘᴘ>|<ᴜʀʟ>\n\nᴄᴏɴᴛᴏʜ:\n.cft 33|2k|3|6k|https://chat.whatsapp.com/xxx"));

        const parts = input.split("|").map(p => p.trim());
        if (parts.length < 5) return r("❌ Harus 5 parameter!\n\nFormat: .cft laga|fee|tim|pp|url");

        const [laga, fee, tim, pp, url] = parts;

        if (!url.includes("chat.whatsapp.com")) return r("❌ URL harus link grup WhatsApp!");

        const db = loadDb();
        if (db.groups.length === 0) return r("❌ Belum ada grup!\n\nTambahkan dulu:\n.addgb <idgroup>");

        const teks = `*OPEN FTCS*\n\n` +
            `🔥 *Laga:* ${laga}\n` +
            `💰 *Fee:* ${fee}\n` +
            `👥 *Tim:* ${tim}\n` +
            `🏆 *Prize Pool:* ${pp}\n\n` +
            `📌 *Langsung gabung grup di bawah!*`;

        let sukses = 0;
        let gagal = 0;

        for (const targetGc of db.groups) {
            try {
                const msgInteractive = generateWAMessageFromContent(targetGc, {
                    viewOnceMessage: {
                        message: {
                            interactiveMessage: {
                                header: { title: "OPEN FTCS", hasMediaAttachment: false },
                                body: { text: teks },
                                footer: { text: "Powered By @JunMoods" },
                                nativeFlowMessage: {
                                    buttons: [
                                        {
                                            name: "cta_url",
                                            buttonParamsJson: JSON.stringify({
                                                display_text: "🔗 𝗕𝗢𝗢𝗞 𝗥𝗢𝗢𝗠",
                                                url: url,
                                                merchant_url: url
                                            })
                                        },
                                        {
                                            name: "cta_url",
                                            buttonParamsJson: JSON.stringify({
                                                display_text: "𝗧𝗢𝗣𝗨𝗣 𝗚𝗔𝗠𝗘",
                                                url: "https://junofficial354.my.id",
                                                merchant_url: "https://junofficial354.my.id"
                                            })
                                        },
                                        {
                                            name: "cta_url",
                                            buttonParamsJson: JSON.stringify({
                                                display_text: "𝗥𝗨𝗟𝗘𝗦 𝗚𝗔𝗠𝗘",
                                                url: "https://whatsapp.com/channel/0029VbBnIVuCMY0POm5gqO1P/127",
                                                merchant_url: "https://whatsapp.com/channel/0029VbBnIVuCMY0POm5gqO1P/127"
                                            })
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }, { userJid: targetGc });

                await s.relayMessage(targetGc, msgInteractive.message, { messageId: msgInteractive.key.id });
                sukses++;

                await new Promise(t => setTimeout(t, 2000));
            } catch (e) {
                console.error(`Gagal kirim ke ${targetGc}:`, e.message);
                gagal++;
            }
        }

        r(`✅ *FTCS Terkirim!*\n\n📤 Sukses: ${sukses} grup\n❌ Gagal: ${gagal} grup\n\n🔥 Laga: ${laga}\n💰 Fee: ${fee}\n👥 Tim: ${tim}\n🏆 PP: ${pp}`);
    }
};