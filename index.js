const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { readdirSync, statSync, unlinkSync, watchFile, unwatchFile } = require('fs');
const { join } = require('path');
const handler = require('./handler.js');
const chalk = require('chalk');

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const conn = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        defaultQueryTimeoutMs: undefined,
    });

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('messages.upsert', async (m) => {
        await handler(m, conn);
    });

    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            console.log(chalk.red('Conexión cerrada, reconectando...'));
            start();
        } else if (connection === 'open') {
            console.log(chalk.green('Conexión abierta'));
        }
    });

    return conn;
}

start().catch(console.error);
