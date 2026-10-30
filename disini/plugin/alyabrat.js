import { buildReplyFunction as R, cleanupFile as C, msg } from "../function/global.js";
import { createCanvas, loadImage } from "canvas";
import sharp from "sharp";
import fs from "fs";

async function createSticker(text) {
    const response = await fetch('https://files.catbox.moe/vswnil.jpg');
    const arrayBuffer = await response.arrayBuffer();
    const img = await loadImage(Buffer.from(arrayBuffer));
    const cv = createCanvas(img.width, img.height), ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const [px, py, pw, ph] = [img.width*.17, img.height*.52, img.width*.66, img.height*.32];
    const tw = pw - pw*.16;
    ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    const w = (t, m) => { let o=t.split(' '),l=[],c=''; for(let w of o){let x=c+w+' '; if(ctx.measureText(x).width>m&&c!==''){l.push(c.trim());c=w+' '}else c=x} l.push(c.trim()); return l; };

    let fontSize = 72, ln = [];
    while(fontSize>32){ctx.font=`bold ${fontSize}px Arial`; ln=w(text,tw); if(ln.length<=3&&ln.length*fontSize*1.05<=ph)break; fontSize--}
    ctx.font=`bold ${fontSize}px Arial`; const lh=fontSize*1.05, sy=py+ph/2-(ln.length*lh)/2+lh*.38, rd=3.5*Math.PI/180, cx=px+pw/2, cy=py+ph/2;
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(rd);
    ln.slice(0,3).forEach((l,i)=>ctx.fillText(l,0,sy-cy-25+i*lh));
    ctx.restore();

    const tmp = `/tmp/ab_${Date.now()}.webp`;
    await sharp(cv.toBuffer('image/png')).resize(512,512).webp({quality:80}).toFile(tmp);
    const buf = fs.readFileSync(tmp);
    C(tmp);
    return buf;
}

export const commands = {
    "alyabrat": async (s, m, o) => {
        const r = R(s, o.from, m);
        const t = o.args.join(" ");
        if (!t) return r(msg.invalidFormat(".alyabrat", ".alyabrat <teks>"));
        try {
            await s.sendMessage(o.from, { sticker: await createSticker(t) }, { quoted: m });
        } catch (e) {
            console.error(e);
            r(msg.error);
        }
    }
};