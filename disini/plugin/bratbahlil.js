import fs from "fs";
import { createCanvas, loadImage } from "canvas";
import sharp from "sharp";
import { buildReplyFunction as R, cleanupFile as C, msg } from "../function/global.js";

async function gen(text) {
    const img = await loadImage(Buffer.from(await (await fetch('https://i.ibb.co/JwT2QFvY/elaina-md.jpg')).arrayBuffer()));
    const cv = createCanvas(img.width, img.height), ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);

    const [bx, by, bw, bh] = [img.width*.18, img.height*.55, img.width*.64, img.height*.30];
    const tw = bw - bw*.16;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000000';

    const wrap = (t, m) => { let w=t.split(' '),l=[],c=''; for(let x of w){let o=c+x+' '; if(ctx.measureText(o).width>m&&c!==''){l.push(c.trim());c=x+' '}else c=o} l.push(c.trim()); return l; };

    let fs=80, ln=[];
    while(fs>32){ctx.font=`500 ${fs}px Arial, Helvetica, sans-serif`; ln=wrap(text,tw); if(ln.length<=3&&ln.length*fs*1.05<=bh)break; fs--}
    ctx.font=`500 ${fs}px Arial, Helvetica, sans-serif`;
    ctx.shadowColor='rgba(0,0,0,0.12)'; ctx.shadowBlur=2; ctx.shadowOffsetX=1; ctx.shadowOffsetY=1;

    const lh=fs*1.05, sy=by+bh/2-(ln.length*lh)/2+lh*.38;
    ln.slice(0,3).forEach((l,i)=>ctx.fillText(l,bx+bw/2,sy+i*lh));

    const tmp=`/tmp/bb_${Date.now()}.webp`;
    await sharp(cv.toBuffer('image/png')).resize(512,512).webp({quality:80}).toFile(tmp);
    const buf=fs.readFileSync(tmp); C(tmp); return buf;
}

export const commands = {
    "bratbahlil": async (s, m, o) => {
        const r = R(s, o.from, m);
        const t = o.args.join(" ");
        if (!t) return r(msg.invalidFormat(".bratbahlil", ".bratbahlil <ᴛᴇᴋs>"));
        try {
            await s.sendMessage(o.from, { sticker: await gen(t) }, { quoted: m });
        } catch (e) { console.error(e); r(msg.error); }
    }
};