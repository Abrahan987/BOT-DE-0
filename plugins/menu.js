const handler = async (m, { sock }) => {
    const menu = `
*The crash Bot Menu*

- .menu
- .allfake
    `;
    sock.sendMessage(m.key.remoteJid, { text: menu });
};

handler.command = ['menu'];
handler.help = ['menu'];
handler.tags = ['main'];

export default handler;
