// plugins/ping.js

async function handler(m, { conn, text, usedPrefix, command }) {
    try {
        const startTime = new Date();
        await m.reply('Pong!');
        const endTime = new Date();
        const speed = endTime - startTime;
        await m.reply(`Velocidad de respuesta: ${speed} ms`);
    } catch (e) {
        console.error(e);
        m.reply('Hubo un error al medir la velocidad.');
    }
}

handler.command = ['ping', 'speed'];
handler.tags = ['info'];
handler.help = ['ping', 'speed'];
handler.fail = null;

export default handler;
