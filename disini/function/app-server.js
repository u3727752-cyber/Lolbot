import http from "http";
import fs from "fs";
import crypto from "crypto";
import yaml from "js-yaml";

const AF = "./db/accounts.yaml";
const ID = "./db/intro";
const SESSIONS_FILE = "./db/sessions.yaml";
const OWNERS = ["6285808630057"];
const sessions = {};

const loadSessions = () => {
    try {
        if (fs.existsSync(SESSIONS_FILE)) {
            const data = yaml.load(fs.readFileSync(SESSIONS_FILE, "utf8")) || {};
            for (const [t, s] of Object.entries(data)) if (s.exp > Date.now()) sessions[t] = s;
        }
    } catch {}
};

const saveSessions = () => {
    try {
        if (!fs.existsSync("./db")) fs.mkdirSync("./db", { recursive: true });
        fs.writeFileSync(SESSIONS_FILE, yaml.dump(sessions, { lineWidth: -1 }));
    } catch {}
};

const loadAcc = () => {
    try { return fs.existsSync(AF) ? yaml.load(fs.readFileSync(AF, "utf8")) || {} : {}; } catch { return {}; }
};

const saveAcc = (d) => {
    if (!fs.existsSync("./db")) fs.mkdirSync("./db", { recursive: true });
    fs.writeFileSync(AF, yaml.dump(d, { lineWidth: -1 }));
};

const initOwner = () => {
    const acc = loadAcc();
    const ownerWa = OWNERS[0];
    if (!acc[ownerWa]) {
        acc[ownerWa] = {
            username: "admin", password: "admin123", nama: "Jun Official", level: "owner",
            total_request: 0, terakhir_login: "", login_session: false, ktp_id: null,
            folder: ownerWa + "@s.whatsapp.net", created: new Date().toISOString().split("T")[0]
        };
        saveAcc(acc);
        const dir = `./db/user/account/${ownerWa}@s.whatsapp.net`;
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
};

initOwner();
loadSessions();

function isOwner(wa) { return OWNERS.includes(wa); }

function serveFile(res, fp, ct = "text/html") {
    try { res.writeHead(200, { "Content-Type": ct }); res.end(fs.readFileSync(fp)); }
    catch { res.writeHead(404, { "Content-Type": "text/html" }); res.end("<h1>404 Not Found</h1>"); }
}

function getMime(ext) {
    const m = { html: "text/html", css: "text/css", js: "application/javascript", json: "application/json", png: "image/png", jpg: "image/jpeg", svg: "image/svg+xml", ico: "image/x-icon" };
    return m[ext] || "text/plain";
}

async function handleSuperAdmin(req, res, token, sender, acc) {
    if (!sender || !isOwner(sender)) { res.writeHead(403, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ ok: false, msg: "Forbidden" })); }
    const path = new URL(req.url, `http://${req.headers.host}`).pathname;

    if (path === "/api/admin/users" && req.method === "GET") {
        return res.end(JSON.stringify({ ok: true, users: Object.entries(acc).map(([wa, u]) => ({ wa, ...u })) }));
    }
    if (path === "/api/admin/update-level" && req.method === "POST") {
        let body = ""; req.on("data", c => body += c); req.on("end", () => {
            try {
                const { wa: tw, level } = JSON.parse(body);
                if (acc[tw]) { acc[tw].level = level; saveAcc(acc); return res.end(JSON.stringify({ ok: true })); }
                res.end(JSON.stringify({ ok: false }));
            } catch { res.end(JSON.stringify({ ok: false })); }
        }); return;
    }
    if (path === "/api/admin/delete" && req.method === "POST") {
        let body = ""; req.on("data", c => body += c); req.on("end", () => {
            try {
                const { wa: tw } = JSON.parse(body);
                if (acc[tw] && !isOwner(tw)) { delete acc[tw]; saveAcc(acc); return res.end(JSON.stringify({ ok: true })); }
                res.end(JSON.stringify({ ok: false }));
            } catch { res.end(JSON.stringify({ ok: false })); }
        }); return;
    }
}

export function startAppServer(port = 3001) {
    http.createServer(async (req, res) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const path = url.pathname;
        const token = url.searchParams.get("token");
        const sender = sessions[token]?.wa;

        if (path.startsWith("/api/admin/")) { const acc = loadAcc(); return handleSuperAdmin(req, res, token, sender, acc); }

        if (path === "/api/login" && req.method === "POST") {
            let body = ""; req.on("data", c => body += c); req.on("end", async () => {
                try {
                    const { user, pass } = JSON.parse(body);
                    const acc = loadAcc(); let found = null;
                    for (const [wa, d] of Object.entries(acc)) { if (d.username === user && d.password === pass) { found = { wa, ...d }; break; } }
                    if (found) {
                        const t = crypto.randomBytes(16).toString("hex");
                        sessions[t] = { wa: found.wa, exp: Date.now() + 2592000000 }; saveSessions();
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ ok: true, token: t, owner: isOwner(found.wa) }));
                    } else { res.writeHead(401, { "Content-Type": "application/json" }); res.end(JSON.stringify({ ok: false })); }
                } catch { res.writeHead(500, { "Content-Type": "application/json" }); res.end(JSON.stringify({ ok: false })); }
            }); return;
        }

        if (path === "/api/profile") {
            if (!sender || sessions[token]?.exp < Date.now()) { res.writeHead(401, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ ok: false })); }
            res.end(JSON.stringify({ ok: true, ...loadAcc()[sender] })); return;
        }

        if (path === "/api/ktp") {
            if (!sender || sessions[token]?.exp < Date.now()) { res.writeHead(401, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ ok: false })); }
            const ktp = []; try {
                if (fs.existsSync(ID)) for (const f of fs.readdirSync(ID).filter(f => f.endsWith(".yaml"))) {
                    const d = yaml.load(fs.readFileSync(`${ID}/${f}`, "utf8")) || {};
                    if (d[sender]) ktp.push({ grup_id: f.replace(".yaml", ""), ...d[sender] });
                }
            } catch {}
            res.end(JSON.stringify({ ok: true, ktp })); return;
        }

        if (path === "/api/gantipass" && req.method === "POST") {
            let body = ""; req.on("data", c => body += c); req.on("end", () => {
                try {
                    const { token: t, old, pass } = JSON.parse(body);
                    if (!t || !sessions[t] || sessions[t].exp < Date.now()) { res.writeHead(401); return res.end(JSON.stringify({ ok: false })); }
                    const acc = loadAcc(); const s = sessions[t].wa;
                    if (acc[s].password !== old) return res.end(JSON.stringify({ ok: false }));
                    acc[s].password = pass; saveAcc(acc); res.end(JSON.stringify({ ok: true }));
                } catch { res.end(JSON.stringify({ ok: false })); }
            }); return;
        }

        if (path === "/dashboard") {
            if (!sender || sessions[token]?.exp < Date.now()) { res.writeHead(302, { Location: "/" }); res.end(); return; }
            const acc = loadAcc(); const role = acc[sender]?.level;
            if (role === "owner" || role === "admin") { serveFile(res, "./public/dash-admin.html"); return; }
            serveFile(res, "./public/dashboard.html"); return;
        }

        const pd = "./public";
        if (!fs.existsSync(pd)) { fs.mkdirSync(pd, { recursive: true }); res.end("<h1>Public folder created</h1>"); return; }
        const files = fs.readdirSync(pd).filter(f => !f.startsWith("."));
        const cp = path.replace(/^\/+/, "") || "index.html";
        for (const f of files) { if (cp === f) { serveFile(res, `${pd}/${f}`, getMime(f.split(".").pop())); return; } }
        if (cp === "index.html") { serveFile(res, `${pd}/index.html`); return; }
        res.writeHead(404, { "Content-Type": "text/html" }); res.end("<h1>404 Not Found</h1>");
    }).listen(port, "0.0.0.0", () => console.log(`🌐 App server: http://0.0.0.0:${port}`));
}