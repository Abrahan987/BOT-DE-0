const handler = async (m, { sock, text, command }) => {
    if (!m.quoted) throw `Reply to a message with the command *${command}*`;
    if (!text) throw `Provide the text to send. Example: *${command} hello|573237649689@s.whatsapp.net*`;

    const [fakeText, fakeJid] = text.split('|');
    if (!fakeText || !fakeJid) throw `Incorrect format. Use: text|jid\nExample: *${command} hello|573237649689@s.whatsapp.net*`;

    const number = fakeJid.split('@')[0];

    const fakeMessage = {
        key: {
            participant: `${number}@s.whatsapp.net`,
            remoteJid: m.key.remoteJid
        },
        message: m.quoted.message
    };

    await sock.sendMessage(m.key.remoteJid, { text: fakeText.trim() }, { quoted: fakeMessage });
};

handler.command = ['allfake'];
handler.help = ['allfake <text>|<jid>'];
handler.tags = ['fun'];
handler.owner = true;

export default handler;
