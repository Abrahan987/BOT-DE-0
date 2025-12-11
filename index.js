import fs from 'fs';
import path from 'path';
import baileys from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import config from './config.js';

const commands = new Map();

async function loadPlugins() {
    const pluginDir = './plugins';
    const files = fs.readdirSync(pluginDir).filter(file => file.endsWith('.js'));
    console.log('Loading plugins...');
    for (const file of files) {
        try {
            const pluginPath = path.join(process.cwd(), pluginDir, file);
            const plugin = (await import(`file://${pluginPath}`)).default;
            if (plugin && Array.isArray(plugin.command)) {
                plugin.command.forEach(cmd => {
                    commands.set(cmd.toLowerCase(), plugin);
                });
                console.log(`Loaded command: ${plugin.command.join(', ')} from ${file}`);
            }
        } catch (e) {
            console.error(`Error loading plugin ${file}:`, e);
        }
    }
}

async function connectToWhatsApp() {
    const { state, saveCreds } = await baileys.useMultiFileAuthState('auth_info_baileys');
    const sock = baileys.default({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // Disable QR code
        auth: state,
        browser: baileys.Browsers.macOS('Desktop'), // Set browser
    });

    // Handle pairing code
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            if (!config.botNumber) {
                console.error('Error: botNumber is not defined in config.js. Please add it.');
                return;
            }
            try {
                const code = await sock.requestPairingCode(config.botNumber);
                console.log(`Your pairing code is: ${code}`);
            } catch (error) {
                console.error('Failed to request pairing code:', error);
            }
        }, 3000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) && lastDisconnect.error.output.statusCode !== baileys.DisconnectReason.loggedOut;
            console.log('Connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Opened connection');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        if (!body) return;

        const prefix = '.';
        if (!body.startsWith(prefix)) return;

        const args = body.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        const handler = commands.get(command);
        if (!handler) return;

        const sender = (msg.key.participant || msg.key.remoteJid)?.split('@')[0];
        if (handler.owner && sender !== config.owner) {
            return sock.sendMessage(msg.key.remoteJid, { text: 'Only the owner can use this command.' }, { quoted: msg });
        }

        const contextInfo = msg.message.extendedTextMessage?.contextInfo;
        if (contextInfo?.quotedMessage) {
            msg.quoted = {
                key: {
                    remoteJid: msg.key.remoteJid,
                    id: contextInfo.stanzaId,
                    participant: contextInfo.participant,
                },
                message: contextInfo.quotedMessage
            };
        } else {
            msg.quoted = null;
        }

        try {
            await handler(msg, {
                sock,
                text: args.join(' '),
                command,
            });
        } catch (e) {
            console.error(e);
            await sock.sendMessage(msg.key.remoteJid, { text: String(e) }, { quoted: msg });
        }
    });
}

loadPlugins().then(() => {
    connectToWhatsApp();
});
