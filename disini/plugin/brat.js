import fs from "fs";
import sharp from "sharp";
import { buildReplyFunction as R, cleanupFile as C, msg } from "../function/global.js";

function wrap(text, fs) {
    const max = Math.max(4, Math.floor(250 / fs));
    const words = text.split(" ");
    const lines = [];
    let cur = "";
    for (const w of words) {
        if (w.length > max) { if (cur) { lines.push(cur); cur = ""; } lines.push(w); continue; }
        if ((cur + " " + w).trim().length > max) { lines.push(cur); cur = w; }
        else cur = (cur + " " + w).trim();
    }
    if (cur) lines.push(cur);
    return lines;
}

async function gen(text) {
    const [w, h] = [512, 512], pl = 25, pt = 20;
    let fs = 90, lines = [], lh, th;
    while (fs > 20) {
        lines = wrap(text, fs);
        lh = fs * 1.05;
        th = lines.length * lh;
        let ok = true;
        for (const l of lines) if (l.length * (fs * 0.52) > w - pl * 2) { ok = false; break; }
        if (th <= h - pt * 2 && ok) break;
        fs -= 2;
    }
    let el = "";
    lines.forEach((l, i) => el += `<text x="${pl}" y="${pt + i * lh}" font-family="Arial" font-size="${fs}px" font-weight="900" fill="#202124" dominant-baseline="text-before-edge" letter-spacing="-1px">${l}</text>\n`);
    return Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${h}" fill="white"/>${el}</svg>`);
}

export const commands = {
    "brat": async (s, m, o) => {
        const r = R(s, o.from, m);
        const t = o.args.join(" ");
        if (!t) return r(msg.invalidFormat(".brat", ".brat <ᴛᴇᴋs>"));
        try {
            if (!fs.existsSync("./temp")) fs.mkdirSync("./temp", { recursive: true });
            const svg = `./temp/brat_${Date.now()}.svg`, webp = `./temp/brat_${Date.now()}.webp`;
            fs.writeFileSync(svg, await gen(t));
            await sharp(svg).resize(512, 512).webp({ quality: 95 }).toFile(webp);
            await s.sendMessage(o.from, { sticker: fs.readFileSync(webp) }, { quoted: m });
            C(svg); C(webp);
        } catch (e) { console.error(e); r(msg.error); }
    }
};