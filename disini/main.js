import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PLUGIN_DIR = path.join(__dirname, "plugin");

const c = { dim: "\x1b[2m", reset: "\x1b[0m", red: "\x1b[31m" };

class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.commands = new Map();
        this.handlers = new Map();
        this.lastModified = {};
    }

    async loadAll() {
        if (!fs.existsSync(PLUGIN_DIR)) fs.mkdirSync(PLUGIN_DIR, { recursive: true });
        const files = fs.readdirSync(PLUGIN_DIR).filter(f => f.endsWith('.js'));
        for (const file of files) await this.loadPlugin(file);
        return this.commands;
    }

    async loadPlugin(filename) {
        const filePath = path.join(PLUGIN_DIR, filename);
        const pluginName = filename.replace('.js', '');
        try {
            const modulePath = pathToFileURL(filePath).href;
            const module = await import(`${modulePath}?t=${Date.now()}`);
            if (this.plugins.has(pluginName)) {
                const oldCmds = this.plugins.get(pluginName).commands || [];
                oldCmds.forEach(cmd => this.commands.delete(cmd));
                const oldHandlers = this.plugins.get(pluginName).handlers || [];
                oldHandlers.forEach(h => this.handlers.delete(h));
            }
            let commands = [];
            let handlers = [];
            if (module.default && typeof module.default === 'function') {
                this.commands.set(pluginName, module.default);
                commands.push(pluginName);
            }
            if (module.commands && typeof module.commands === 'object') {
                for (const [cmd, handler] of Object.entries(module.commands)) {
                    this.commands.set(cmd, handler);
                    commands.push(cmd);
                }
            }
            if (module.handlers && typeof module.handlers === 'object') {
                for (const [event, handler] of Object.entries(module.handlers)) {
                    this.handlers.set(`${pluginName}.${event}`, handler);
                    handlers.push(`${pluginName}.${event}`);
                }
            }
            this.plugins.set(pluginName, { module, commands, handlers, filePath, loaded: Date.now() });
            return true;
        } catch (e) {
            console.log(`${c.dim}  ⚠ ${filename}${c.reset}`);
            console.log(`   ${c.red}❌ ${e.message}${c.reset}`);
            if (e.stack) {
                const stackLines = e.stack.split("\n").slice(0, 3).join("\n   ");
                console.log(`   ${c.dim}${stackLines}${c.reset}`);
            }
            return false;
        }
    }

    unloadPlugin(pluginName) {
        if (!this.plugins.has(pluginName)) return false;
        const plugin = this.plugins.get(pluginName);
        plugin.commands.forEach(cmd => this.commands.delete(cmd));
        plugin.handlers.forEach(h => this.handlers.delete(h));
        this.plugins.delete(pluginName);
        return true;
    }

    watch() {
        if (!fs.existsSync(PLUGIN_DIR)) return;
        setInterval(async () => {
            const files = fs.readdirSync(PLUGIN_DIR).filter(f => f.endsWith('.js'));
            for (const file of files) {
                const filePath = path.join(PLUGIN_DIR, file);
                const stats = fs.statSync(filePath);
                const lastMod = this.lastModified[file] || 0;
                if (stats.mtimeMs > lastMod) {
                    this.lastModified[file] = stats.mtimeMs;
                    console.log(`${c.dim}  ↻ ${file}${c.reset}`);
                    await this.loadPlugin(file);
                }
            }
            for (const [name] of this.plugins) {
                if (!files.includes(name + '.js')) this.unloadPlugin(name);
            }
        }, 3000);
    }

    async executeCommand(command, sock, m, options) {
        if (!this.commands.has(command)) return null;
        try {
            return await this.commands.get(command)(sock, m, options);
        } catch (e) {
            console.log(`${c.red}❌ Command error [${command}]: ${e.message}${c.reset}`);
            return null;
        }
    }

    async runHandlers(event, ctx) {
        for (const [key, handler] of this.handlers) {
            if (!key.endsWith(`.${event}`)) continue;
            try {
                const result = await handler(ctx);
                if (result === "stop") break;
            } catch (e) {
                console.log(`${c.red}❌ Handler error [${key}]: ${e.message}${c.reset}`);
            }
        }
    }

    hasCommand(command) { return this.commands.has(command); }
    getCommands() { return Array.from(this.commands.keys()); }
}

const pluginManager = new PluginManager();
pluginManager.loadAll();
pluginManager.watch();

export default pluginManager;