// plugins/ping.js

export default {
    command: 'ping',
    description: 'Responde con "Pong!" para verificar que el bot está en línea.',
    run: async ({ sock, msg }) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Pong!' }, { quoted: msg });
        } catch (error) {
            console.error('Error en el comando ping:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: 'No se pudo responder al ping.' }, { quoted: msg });
        }
    }
};
