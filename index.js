import { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, makeWASocket } from '@whiskeysockets/baileys';
import pino from 'pino';
import chalk from 'chalk';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';

// --- CONFIGURACIÓN DEL LOGGER ---
const logger = pino({ level: 'silent' });

// --- DIRECTORIO DE PLUGINS ---
const __dirname = path.resolve(path.dirname(''));
const pluginsDir = path.join(__dirname, 'plugins');

// --- COLECCIÓN DE COMANDOS ---
const commands = new Map();

// --- FUNCIÓN PARA CARGAR PLUGINS ---
async function loadPlugins() {
    try {
        const files = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
        console.log(chalk.cyan('Cargando plugins...'));

        for (const file of files) {
            try {
                // Usamos import() dinámico con un timestamp para evitar problemas de caché
                const modulePath = path.join(pluginsDir, file);
                const module = await import(`file://${modulePath}?v=${Date.now()}`);

                if (module.default && typeof module.default.command === 'string' && typeof module.default.run === 'function') {
                    commands.set(module.default.command, module.default);
                    console.log(chalk.green(`  -> Plugin cargado: ${file}`));
                } else {
                    console.log(chalk.yellow(`  -> Archivo ignorado (formato inválido): ${file}`));
                }
            } catch (error) {
                console.error(chalk.red(`Error cargando el plugin ${file}:`), error);
            }
        }
        console.log(chalk.cyan('Plugins cargados exitosamente.\n'));
    } catch (error) {
        console.error(chalk.red('No se pudo leer el directorio de plugins:'), error);
    }
}


// --- FUNCIÓN PRINCIPAL PARA INICIAR EL BOT ---
async function startCorvetteBot() {
    console.log(chalk.magentaBright('Iniciando Corvette Bot...'));
    console.log(chalk.cyan('Creado por ABRAHAN-M Y ARLETTE\n'));

    // Cargar los plugins antes de iniciar la conexión
    await loadPlugins();

    const { state, saveCreds } = await useMultiFileAuthState('sessions');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: true,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
    });

    // --- MANEJO DE LA CONEXIÓN ---
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (connection === 'close') {
            const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red('Conexión cerrada. Razón:'), lastDisconnect?.error, chalk.yellow('¿Reconectando?'), shouldReconnect);

            if (shouldReconnect) {
                startCorvetteBot();
            }
        } else if (connection === 'open') {
            console.log(chalk.green.bold('¡Conexión exitosa! Corvette Bot está en línea.\n'));
        }
    });

    // Guardar credenciales
    sock.ev.on('creds.update', saveCreds);

    // --- MANEJO DE MENSAJES ---
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        if (!text) return;

        // Comprobamos si el mensaje empieza con un prefijo (ej. '!')
        const prefix = '!'; // Puedes cambiar el prefijo aquí
        if (text.startsWith(prefix)) {
            const args = text.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            const command = commands.get(commandName);

            if (command) {
                try {
                    console.log(chalk.blue(`Ejecutando comando: ${commandName}`));
                    await command.run({ sock, msg, args });
                } catch (error) {
                    console.error(chalk.red(`Error al ejecutar el comando ${commandName}:`), error);
                    await sock.sendMessage(msg.key.remoteJid, { text: 'Ocurrió un error al procesar el comando.' }, { quoted: msg });
                }
            }
        }
    });
}

// Iniciar el bot
startCorvetteBot();
