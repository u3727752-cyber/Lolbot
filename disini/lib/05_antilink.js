import { checkAntiLink } from "../plugin/antilink.js";
import fs from "fs";

export async function execute(ctx) {
    const { sock, msg, from, isGroup, isSenderAdmin, isOwner, text } = ctx;
    if (!isGroup) return;
    if (!text) return;

    msg.text = text;

    const role = isSenderAdmin ? "ADMIN" : "MEMBER";
    const dbFile = `./db/antilink/${from}.json`;
    let status = "OFF";
    if (fs.existsSync(dbFile)) {
        try {
            const db = JSON.parse(fs.readFileSync(dbFile, "utf8"));
            status = (db.gc || db.ch || (db.custom && db.custom.length > 0)) ? "ON" : "OFF";
        } catch {}
    }

    const link = text.match(/(https?:\/\/[^\s]+)/g);
    const detected = link ? link[0] : "-";

    console.clear();
    console.log(`\n\x1b[36m╔══════════════════════════════════╗`);
    console.log(`\x1b[36m║\x1b[33m  🛡️  ANTILINK DETECTION         \x1b[36m`);
    console.log(`\x1b[36m╠══════════════════════════════════╣`);
    console.log(`\x1b[36m║\x1b[0m  👥 GROUP  : \x1b[35m${from.split("@")[0].substring(0, 20)}\x1b[36m`);
    console.log(`\x1b[36m║\x1b[0m  👤 SENDER : \x1b[32m${(msg.pushName || "Unknown").substring(0, 20)}\x1b[36m`);
    console.log(`\x1b[36m║\x1b[0m  🔰 ROLE   : \x1b[${role === "ADMIN" ? "33" : "37"}m${role}\x1b[36m               `);
    console.log(`\x1b[36m║\x1b[0m  ⚙️  STATUS : \x1b[${status === "ON" ? "32" : "31"}m${status}\x1b[36m                `);
    console.log(`\x1b[36m║\x1b[0m  🔗 LINK   : \x1b[34m${detected.substring(0, 20)}\x1b[36m║`);
    console.log(`\x1b[36m╚══════════════════════════════════╝\x1b[0m\n`);

    await checkAntiLink(msg, sock, from, isSenderAdmin, isOwner);
}