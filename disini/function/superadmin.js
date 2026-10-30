import fs from "fs";
import yaml from "js-yaml";

const AF = "./db/accounts.yaml";

async function loadData() {
    return fs.existsSync(AF) ? yaml.load(fs.readFileSync(AF, "utf8")) || {} : {};
}

async function saveData(d) {
    fs.writeFileSync(AF, yaml.dump(d, { lineWidth: -1 }));
}

export async function SuperAdminController(req, res, token, sessions) {
    const sender = sessions[token]?.wa;
    const acc = await loadData();

    // Verifikasi Hak Admin
    if (!sender || (acc[sender]?.level !== "owner" && acc[sender]?.level !== "admin")) {
        res.writeHead(403);
        return res.end(JSON.stringify({ ok: false, msg: "Forbidden" }));
    }

    const path = new URL(req.url, `http://${req.headers.host}`).pathname;

    // List Semua User
    if (path === "/api/admin/users" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, users: Object.entries(acc).map(([wa, u]) => ({ wa, ...u })) }));
    }

    // Update Rank
    else if (path === "/api/admin/update-level" && req.method === "POST") {
        let body = "";
        req.on("data", c => body += c);
        req.on("end", async () => {
            const { targetWa, targetLevel } = JSON.parse(body);
            if (acc[targetWa]) {
                acc[targetWa].level = targetLevel;
                await saveData(acc);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ ok: true }));
            }
        });
    }

    // Hapus User (Proteksi Konten Ilegal)
    else if (path === "/api/admin/delete" && req.method === "POST") {
        let body = "";
        req.on("data", c => body += c);
        req.on("end", async () => {
            const { targetWa } = JSON.parse(body);
            if (acc[targetWa] && acc[targetWa].level !== "owner") {
                delete acc[targetWa];
                await saveData(acc);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ ok: true }));
            }
        });
    }
}
