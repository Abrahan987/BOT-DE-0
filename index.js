import { handler } from './handler.js'
import './config.js'
import './plugins/_allfake.js'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { platform } from 'process'
import * as ws from 'ws'
import { readdirSync, statSync, unlinkSync, existsSync, readFileSync, watch } from 'fs'
import yargs from 'yargs'
import { join, dirname } from 'path'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import { Low, JSONFile } from 'lowdb'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import _baileys from '@whiskeysockets/baileys'
const { DisconnectReason, useMultiFileAuthState, MessageRetryMap, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser } = _baileys
import chalk from 'chalk'
import cfonts from 'cfonts'
import readline from 'readline'
import NodeCache from 'node-cache'
import { format } from 'util'

// --- DECORACIÓN DE LA CONSOLA ---
cfonts.say('Corvette Bot', {
    font: 'block',
    align: 'center',
    gradient: ['#00FFFF', '#FF00FF']
});
cfonts.say('Creado por ABRAHAN-M Y ARLETTE', {
    font: 'console',
    align: 'center',
    gradient: ['#FFFFFF', '#808080']
});

protoType()
serialize()

// --- VARIABLES GLOBALES ---
global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
    return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString()
}
global.__dirname_global = function(pathURL) {
    return dirname(global.__filename(pathURL, true));
};
global.__require = function require(dir = import.meta.url) {
    return createRequire(dir)
}

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.db = new Low(new JSONFile(`database.json`))
global.DATABASE = global.db
global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) return new Promise((resolve) => setInterval(function () {
        (!global.db.READ) && (clearInterval(this), resolve(global.db.data == null ? global.loadDatabase() : global.db.data))
    }, 1 * 1000))
    if (global.db.data !== null) return
    global.db.READ = true
    await global.db.read().catch(console.error)
    global.db.READ = false
    global.db.data = {
        users: {},
        chats: {},
        ...(global.db.data || {})
    }
    global.db.chain = global.db.data
}
loadDatabase()

const { state, saveCreds } = await useMultiFileAuthState('sessions')
const msgRetryCounterMap = MessageRetryMap || new Map()
const msgRetryCounterCache = new NodeCache()

// --- LÓGICA DE CONEXIÓN ---
async function startCorvetteBot() {
    const connectionOptions = {
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        msgRetryCounterMap,
        msgRetryCounterCache,
        version: (await fetchLatestBaileysVersion()).version,
    }

    const conn = makeWASocket(connectionOptions)

    if (!conn.authState.creds.registered) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
        const question = (text) => new Promise((resolve) => rl.question(text, resolve))

        const { registration } = await conn.authState.creds;
        let choice;
        do {
            choice = await question(chalk.cyan('Selecciona una opción:\n1. Conectar con código QR\n2. Conectar con código de 8 dígitos\n--> '));
        } while (choice !== '1' && choice !== '2');

        if (choice === '1') {
            console.log(chalk.yellow('Escanea el código QR que aparecerá a continuación:'));
            conn.public = true
        } else {
            let phoneNumber = await question(chalk.green('Por favor, ingresa el número de WhatsApp del bot: '));
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
            let code = await conn.requestPairingCode(phoneNumber);
            console.log(chalk.yellow(`Tu código de vinculación: ${code.match(/.{1,4}/g).join('-')}`));
        }
        rl.close()
    }

    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode
            if (reason === DisconnectReason.badSession) { console.log(`Sesión corrupta, por favor elimina la carpeta "sessions" y escanea de nuevo.`); conn.logout(); }
            else if (reason === DisconnectReason.connectionClosed) { console.log("Conexión cerrada, reconectando..."); startCorvetteBot(); }
            else if (reason === DisconnectReason.connectionLost) { console.log("Conexión perdida con el servidor, reconectando..."); startCorvetteBot(); }
            else if (reason === DisconnectReason.connectionReplaced) { console.log("Conexión reemplazada, otra sesión ha sido abierta. Por favor, cierra la sesión actual primero."); conn.logout(); }
            else if (reason === DisconnectReason.loggedOut) { console.log(`Dispositivo desconectado, por favor elimina la carpeta "sessions" y escanea de nuevo.`); conn.logout(); }
            else if (reason === DisconnectReason.restartRequired) { console.log("Reinicio requerido, reiniciando..."); startCorvetteBot(); }
            else if (reason === DisconnectReason.timedOut) { console.log("Tiempo de conexión agotado, reconectando..."); startCorvetteBot(); }
            else conn.end(`Razón de desconexión desconocida: ${reason}|${lastDisconnect.error}`)
        }
        if (connection === 'open') {
            console.log(chalk.green.bold('¡Conexión exitosa! Corvette Bot está en línea.\n'))
        }
    })

    conn.ev.on('creds.update', saveCreds)

    // --- CARGA DEL HANDLER ---
    conn.handler = handler.bind(conn)
    conn.ev.on('messages.upsert', conn.handler)
}

startCorvetteBot()

global.reloadHandler = async function (restatConn) {
    try {
        const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error)
        global.handler = Handler.handler
        return true
    } catch (e) {
        console.error(e)
        return false
    }
}

// --- MANEJO DE ARCHIVOS DE PLUGINS (HANDLER) ---
const pluginFolder = join(__dirname_global(import.meta.url), './plugins');
const pluginFilter = (filename) => /\.js$/.test(filename)
global.plugins = {}
async function filesInit() {
    for (let filename of readdirSync(pluginFolder).filter(pluginFilter)) {
        try {
            let file = global.__filename(join(pluginFolder, filename))
            const module = await import(file)
            global.plugins[filename] = module.default || module
        } catch (e) {
            console.error(e)
            delete global.plugins[filename]
        }
    }
}
filesInit().then(_ => console.log(Object.keys(global.plugins))).catch(console.error)

global.reload = async (_ev, filename) => {
    if (pluginFilter(filename)) {
        let dir = global.__filename(join(pluginFolder, filename), true)
        if (filename in global.plugins) {
            if (existsSync(dir)) console.log(`Plugin actualizado - '${filename}'`)
            else {
                console.warn(`Plugin eliminado - '${filename}'`)
                return delete global.plugins[filename]
            }
        } else console.log(`Nuevo plugin - '${filename}'`)
        let err = syntaxerror(readFileSync(dir), filename, {
            sourceType: 'module',
            allowAwaitOutsideFunction: true
        })
        if (err) console.error(`Error de sintaxis al cargar '${filename}'\n${format(err)}`)
        else try {
            const module = (await import(`${global.__filename(dir)}?update=${Date.now()}`))
            global.plugins[filename] = module.default || module
        } catch (e) {
            console.error(`Error al requerir el plugin '${filename}\n${format(e)}'`)
        } finally {
            global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)))
        }
    }
}
Object.freeze(global.reload)
watch(pluginFolder, global.reload)
