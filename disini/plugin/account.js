import fs from "fs";
import crypto from "crypto";
import { buildReplyFunction as R, msg } from "../function/global.js";
import { generateWAMessageFromContent } from "@itsliaaa/baileys";

const AF = "./db/accounts.yaml";
const UD = "./db/user/account";
const ID = "./db/intro";

if (!fs.existsSync(UD)) fs.mkdirSync(UD, { recursive: true });
if (!fs.existsSync(ID)) fs.mkdirSync(ID, { recursive: true });
if (!fs.existsSync("./db")) fs.mkdirSync("./db", { recursive: true });

async function loadYaml(fp) {
    try {
        const { default: yaml } = await import("js-yaml");
        return fs.existsSync(fp) ? yaml.load(fs.readFileSync(fp, "utf8")) || {} : {};
    } catch { return {}; }
}

async function saveYaml(fp, d) {
    const { default: yaml } = await import("js-yaml");
    fs.writeFileSync(fp, yaml.dump(d, { lineWidth: -1 }));
}

function userDir(sender) {
    const jid = sender.includes("@") ? sender : sender + "@s.whatsapp.net";
    return `${UD}/${jid}`;
}

function initUser(sender) {
    const dir = userDir(sender);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const pf = `${dir}/profile.yaml`;
    if (!fs.existsSync(pf)) fs.writeFileSync(pf, "", "utf8");
}

function genUser(name) {
    const clean = name.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 10);
    return clean + "_" + crypto.randomBytes(2).toString("hex");
}

function genKTP() {
    return crypto.randomBytes(4).toString("hex").toUpperCase();
}

function checkFolderSize(sender) {
    const dir = userDir(sender);
    if (!fs.existsSync(dir)) return 0;
    let total = 0;
    const files = fs.readdirSync(dir);
    for (const f of files) {
        try { total += fs.statSync(`${dir}/${f}`).size; } catch {}
    }
    return total;
}

export const commands = {
    "daftar": async (s, m, o) => {
        const r = R(s, o.from, m);
        const input = o.args.join(" ");
        if (!input) return r(msg.invalidFormat(".daftar", ".daftar <ɴᴀᴍᴀ>\n.daftar <ɴᴀᴍᴀ>,<ᴘᴀssᴡᴏʀᴅ>"));

        let nama, customPass;
        if (input.includes(",")) {
            const parts = input.split(",").map(p => p.trim());
            nama = parts[0];
            customPass = parts[1] || "";
        } else {
            nama = input.trim();
            customPass = "";
        }

        if (nama.length < 3 || nama.length > 40) return r("❌ Nama minimal 3 karakter, maksimal 40 karakter!");
        if (customPass && (customPass.length < 3 || customPass.length > 20)) return r("❌ Password custom minimal 3 karakter, maksimal 20 karakter!");

        const acc = await loadYaml(AF);
        const sender = o.realSender || o.userJid.split("@")[0];
        const jid = sender.includes("@") ? sender : sender + "@s.whatsapp.net";

        if (acc[sender]) {
            return r("❌ Nomor Anda sudah terdaftar!\n\nSatu nomor WhatsApp hanya diperbolehkan memiliki 1 akun terdaftar di database.");
        }

        const usr = genUser(nama);
        const pwd = customPass || (usr + "123");

        acc[sender] = {
            username: usr,
            password: pwd,
            nama: nama,
            level: "free",
            total_request: 0,
            terakhir_login: new Date().toISOString().split("T")[0],
            login_session: false,
            ktp_id: null,
            folder: jid,
            created: new Date().toISOString().split("T")[0]
        };

        initUser(sender);
        await saveYaml(AF, acc);

        const bodyText = `👤 *Nama:* ${nama}\n` +
            `🆔 *User:* ${usr}\n` +
            `🔑 *Pass:* ${pwd}\n` +
            `🌟 *Level:* Free\n` +
            `📁 *Folder:* /user/account/${jid}\n` +
            (customPass ? "" : `\n⚠️ Password default!\nSegera ganti dengan *.gantipass <lama> <baru>*`);

        const msgInteractive = generateWAMessageFromContent(o.from, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: { title: "🎫 *PENDAFTARAN BERHASIL*", hasMediaAttachment: false },
                        body: { text: bodyText },
                        footer: { text: "⚡ JunnMods Account System" },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "quick_reply",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "🚀 Langsung Login",
                                        id: `.login ${usr} ${pwd}`
                                    })
                                },
                                {
                                    name: "cta_copy",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "📋 Copy Username",
                                        copy_code: usr
                                    })
                                },
                                {
                                    name: "cta_copy",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "📋 Copy Password",
                                        copy_code: pwd
                                    })
                                }
                            ]
                        },
                        contextInfo: { forwardingScore: 999, isForwarded: true }
                    }
                }
            }
        }, { userJid: o.from, quoted: m });

        await s.relayMessage(o.from, msgInteractive.message, { messageId: msgInteractive.key.id });
    },

    "login": async (s, m, o) => {
        const r = R(s, o.from, m);
        const args = o.args;
        if (args.length < 2) return r(msg.invalidFormat(".login", ".login <ᴜsᴇʀɴᴀᴍᴇ> <ᴘᴀssᴡᴏʀᴅ>"));

        const [usr, pwd] = args;
        const acc = await loadYaml(AF);
        const sender = o.realSender || o.userJid.split("@")[0];

        if (!acc[sender]) return r("❌ Kamu belum daftar!\n\nKetik *.daftar <nama>*");

        const my = acc[sender];
        if (my.username !== usr || my.password !== pwd) return r("❌ Username atau password salah!\n\n💡 Lupa password? Ketik *.lupapass*");

        my.login_session = true;
        my.terakhir_login = new Date().toISOString().split("T")[0];
        initUser(sender);
        await saveYaml(AF, acc);

        r(
            `╭──「 🔓 *LOGIN BERHASIL* 」──╮\n│\n` +
            `│  👤 *Nama:* ${my.nama}\n` +
            `│  🆔 *User:* ${my.username}\n` +
            `│  🌟 *Level:* ${my.level.toUpperCase()}\n` +
            `│  📊 *Request:* ${my.total_request}x\n` +
            `│  🆔 *KTP:* ${my.ktp_id || "Belum"}\n` +
            `│  📅 *Login:* ${my.terakhir_login}\n` +
            `│\n` +
            `│  💡 Ketik *.intro* untuk buat KTP\n` +
            `│\n` +
            `╰──────────────────────────╯`
        );
    },

    "logout": async (s, m, o) => {
        const r = R(s, o.from, m);
        const acc = await loadYaml(AF);
        const sender = o.realSender || o.userJid.split("@")[0];

        if (!acc[sender]) return r("❌ Kamu belum punya akun!");
        if (!acc[sender].login_session) return r("❌ Kamu belum login!");

        acc[sender].login_session = false;
        await saveYaml(AF, acc);
        r("🔒 *Logout berhasil!*");
    },

    "gantipass": async (s, m, o) => {
        const r = R(s, o.from, m);
        const args = o.args;
        if (args.length < 2) return r(msg.invalidFormat(".gantipass", ".gantipass <ᴘᴀssʟᴀᴍᴀ> <ᴘᴀssʙᴀʀᴜ>"));

        const [oldPass, newPass] = args;
        if (newPass.length < 3 || newPass.length > 20) return r("❌ Password baru minimal 3 karakter, maksimal 20 karakter!");

        const acc = await loadYaml(AF);
        const sender = o.realSender || o.userJid.split("@")[0];

        if (!acc[sender]) return r("❌ Kamu belum daftar!");
        if (!acc[sender].login_session) return r("❌ Harus login dulu!");

        if (acc[sender].password !== oldPass) return r("❌ Password lama salah!\n\n💡 Lupa password? Ketik *.lupapass*");

        acc[sender].password = newPass;
        await saveYaml(AF, acc);
        r("✅ *Password berhasil diganti!*");
    },

    "lupapass": async (s, m, o) => {
        const r = R(s, o.from, m);
        const acc = await loadYaml(AF);
        const sender = o.realSender || o.userJid.split("@")[0];

        if (!acc[sender]) return r("❌ Kamu belum terdaftar!");

        const my = acc[sender];
        
        r(
            `╭──「 🔑 *LUPA PASSWORD* 」──╮\n│\n` +
            `│  👤 *Nama:* ${my.nama}\n` +
            `│  🆔 *User:* ${my.username}\n` +
            `│  🔑 *Pass:* ${my.password}\n` +
            `│\n` +
            `╰──────────────────────────╯\n\n` +
            `💡 Silakan *.login* menggunakan kredensial di atas dan segera ganti dengan *.gantipass*`
        );
    },

    "myprofile": async (s, m, o) => {
        const r = R(s, o.from, m);
        const acc = await loadYaml(AF);
        const sender = o.realSender || o.userJid.split("@")[0];

        if (!acc[sender]) return r("❌ Kamu belum daftar!");

        const my = acc[sender];
        const size = (checkFolderSize(sender) / 1048576).toFixed(2);

        r(
            `╭──「 👤 *PROFIL* 」──╮\n│\n` +
            `│  👤 *Nama:* ${my.nama}\n` +
            `│  🆔 *User:* ${my.username}\n` +
            `│  🌟 *Level:* ${my.level.toUpperCase()}\n` +
            `│  📊 *Request:* ${my.total_request}x\n` +
            `│  🆔 *KTP:* ${my.ktp_id || "Belum"}\n` +
            `│  📅 *Daftar:* ${my.created}\n` +
            `│  🔓 *Status:* ${my.login_session ? "LOGIN" : "LOGOUT"}\n` +
            `│  📁 *Size:* ${size}MB / 100MB\n` +
            `│\n` +
            `╰──────────────────────────╯`
        );
    },

"intro": async (s, m, o) => {
    const r = R(s, o.from, m);
    try {
        const acc = await loadYaml(AF);
        const sender = o.realSender || o.userJid.split("@")[0];

        if (!acc[sender]) return r("❌ Harus daftar dulu!");
        if (!acc[sender].login_session) return r("❌ Harus login dulu!");
        if (!o.isGroup) return r("❌ Intro hanya bisa di grup!");

        const a = o.text;
        if (!a || !a.includes(",")) return r(msg.invalidFormat(".intro", ".intro nama,sebutan,umur,askot,hobi,keterangan\n\n.intro Budi,Bro,17,Malang,Gaming,Suka anime"));

        const parts = a.split(",").map(p => p.trim());
        if (parts.length < 6) return r("❌ Harus 6 parameter!");

        const [nama, sebutan, umur, askot, hobi, keterangan] = parts;

        if (isNaN(umur) || parseInt(umur) < 1 || parseInt(umur) > 100) return r("❌ Umur harus angka 1-100!");
        if (nama.length < 2 || nama.length > 30) return r("❌ Nama minimal 2, maksimal 30 karakter!");
        if (sebutan.length < 2 || sebutan.length > 20) return r("❌ Sebutan minimal 2, maksimal 20 karakter!");

        const gid = o.from;
        if (!fs.existsSync(ID)) fs.mkdirSync(ID, { recursive: true });
        
        const introFile = `${ID}/${gid}.yaml`;
        const introData = await loadYaml(introFile);

        if (introData[sender]?.id_ktp) return r(`❌ Kamu sudah punya KTP di grup ini!\n🆔 ID: ${introData[sender].id_ktp}`);

        const ktp = genKTP();
        const now = new Date();

        introData[sender] = {
            id_ktp: ktp,
            nama: String(nama),
            sebutan: String(sebutan),
            umur: String(umur),
            askot: String(askot),
            hobi: String(hobi),
            keterangan: String(keterangan),
            wa: String(sender),
            jid: String(o.userJid || sender + "@s.whatsapp.net"),
            lid: String(o.sender || ""),
            tanggal: now.toISOString().split("T")[0],
            jam: now.toLocaleTimeString("id-ID")
        };

        acc[sender].ktp_id = ktp;
        await saveYaml(introFile, introData);
        await saveYaml(AF, acc);

        await r(
            `╭──「 📋 *INTRO MEMBER* 」──╮\n│\n` +
            `│  🆔 *ID KTP:* ${ktp}\n` +
            `│  👤 *Nama:* ${nama}\n` +
            `│  🏷️ *Sebutan:* ${sebutan}\n` +
            `│  🎂 *Umur:* ${umur} tahun\n` +
            `│  📍 *Askot:* ${askot}\n` +
            `│  🎯 *Hobi:* ${hobi}\n` +
            `│  📝 *Ket:* ${keterangan}\n` +
            `│  📅 *Tanggal:* ${introData[sender].tanggal}\n` +
            `│\n` +
            `╰──────────────────────────╯`
        );
    } catch (err) {
        console.error("ERROR INTRO CASE:", err);
        r("❌ Terjadi kesalahan internal saat menyimpan data intro.");
    }
},

    "introme": async (s, m, o) => {
        const r = R(s, o.from, m);
        const acc = await loadYaml(AF);
        const sender = o.realSender || o.userJid.split("@")[0];

        if (!acc[sender]?.ktp_id) return r("❌ Belum punya KTP!");

        const gid = o.isGroup ? o.from : "private";
        const introFile = `${ID}/${gid}.yaml`;
        const introData = await loadYaml(introFile);
        const my = introData[sender];

        if (!my) return r("❌ KTP tidak ditemukan di grup ini.");

        r(
            `╭──「 📋 *KTP SAYA* 」──╮\n│\n` +
            `│  🆔 *ID:* ${my.id_ktp}\n` +
            `│  👤 *Nama:* ${my.nama}\n` +
            `│  🏷️ *Sebutan:* ${my.sebutan}\n` +
            `│  🎂 *Umur:* ${my.umur}\n` +
            `│  📍 *Askot:* ${my.askot}\n` +
            `│  🎯 *Hobi:* ${my.hobi}\n` +
            `│  📝 *Ket:* ${my.keterangan}\n` +
            `│\n` +
            `╰──────────────────────────╯`
        );
    }
};
