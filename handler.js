const { smsg } = require("./lib/simple.cjs")
const { format } = require("util")
const path = require("path")
const fs = require("fs")
const chalk = require("chalk")
const fetch = require("node-fetch")
const ws = require("ws")

const { proto } = require("@whiskeysockets/baileys").default
const isNumber = x => typeof x === "number" && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
    clearTimeout(this)
    resolve()
}, ms))

async function handler(m, conn) {
    this.msgqueque = this.msgqueque || []
    this.uptime = this.uptime || Date.now()
    if (!m) return
    this.pushMessage(m.messages).catch(console.error)
    let msg = m.messages[m.messages.length - 1]
    if (!msg) return
    if (global.db.data == null) await global.loadDatabase()
    try {
        msg = smsg(this, msg) || msg
        if (!msg) return
        msg.exp = 0
        try {
            let user = global.db.data.users[msg.sender]
            if (typeof user !== "object") global.db.data.users[msg.sender] = {}
            if (user) {
                if (!("name" in user)) user.name = msg.name
                if (!("exp" in user) || !isNumber(user.exp)) user.exp = 0
                if (!("coin" in user) || !isNumber(user.coin)) user.coin = 0
                if (!("bank" in user) || !isNumber(user.bank)) user.bank = 0
                if (!("level" in user) || !isNumber(user.level)) user.level = 0
                if (!("health" in user) || !isNumber(user.health)) user.health = 100
                if (!("genre" in user)) user.genre = ""
                if (!("birth" in user)) user.birth = ""
                if (!("marry" in user)) user.marry = ""
                if (!("description" in user)) user.description = ""
                if (!("packstickers" in user)) user.packstickers = null
                if (!("premium" in user)) user.premium = false
                if (!("premiumTime" in user)) user.premiumTime = 0
                if (!("banned" in user)) user.banned = false
                if (!("bannedReason" in user)) user.bannedReason = ""
                if (!("commands" in user) || !isNumber(user.commands)) user.commands = 0
                if (!("afk" in user) || !isNumber(user.afk)) user.afk = -1
                if (!("afkReason" in user)) user.afkReason = ""
                if (!("warn" in user) || !isNumber(user.warn)) user.warn = 0
            } else global.db.data.users[msg.sender] = {
                name: msg.name,
                exp: 0,
                coin: 0,
                bank: 0,
                level: 0,
                health: 100,
                genre: "",
                birth: "",
                marry: "",
                description: "",
                packstickers: null,
                premium: false,
                premiumTime: 0,
                banned: false,
                bannedReason: "",
                commands: 0,
                afk: -1,
                afkReason: "",
                warn: 0
            }
            let chat = global.db.data.chats[msg.chat]
            if (typeof chat !== "object") global.db.data.chats[msg.chat] = {}
            if (chat) {
                if (!("isBanned" in chat)) chat.isBanned = false
                if (!("isMute" in chat)) chat.isMute = false;
                if (!("welcome" in chat)) chat.welcome = false
                if (!("sWelcome" in chat)) chat.sWelcome = ""
                if (!("sBye" in chat)) chat.sBye = ""
                if (!("detect" in chat)) chat.detect = true
                if (!("primaryBot" in chat)) chat.primaryBot = null
                if (!("modoadmin" in chat)) chat.modoadmin = false
                if (!("antiLink" in chat)) chat.antiLink = true
                if (!("nsfw" in chat)) chat.nsfw = false
                if (!("economy" in chat)) chat.economy = true;
                if (!("gacha" in chat)) chat.gacha = true
            } else global.db.data.chats[msg.chat] = {
                isBanned: false,
                isMute: false,
                welcome: false,
                sWelcome: "",
                sBye: "",
                detect: true,
                primaryBot: null,
                modoadmin: false,
                antiLink: true,
                nsfw: false,
                economy: true,
                gacha: true
            }
            let settings = global.db.data.settings[this.user.jid]
            if (typeof settings !== "object") global.db.data.settings[this.user.jid] = {}
            if (settings) {
                if (!("self" in settings)) settings.self = false
                if (!("jadibotmd" in settings)) settings.jadibotmd = true
            } else global.db.data.settings[this.user.jid] = {
                self: false,
                jadibotmd: true
            }
        } catch (e) {
            console.error(e)
        }
        if (typeof msg.text !== "string") msg.text = ""
        const user = global.db.data.users[msg.sender]
        try {
            const actual = user.name || ""
            const nuevo = msg.pushName || await this.getName(msg.sender)
            if (typeof nuevo === "string" && nuevo.trim() && nuevo !== actual) {
                user.name = nuevo
            }
        } catch { }
        const chat = global.db.data.chats[msg.chat]
        const settings = global.db.data.settings[this.user.jid]
        const isROwner = [...global.owner.map((number) => number)].map(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(msg.sender)
        const isOwner = isROwner || msg.fromMe
        const isPrems = isROwner || global.prems.map(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(msg.sender) || user.premium == true
        const isOwners = [this.user.jid, ...global.owner.map((number) => number + "@s.whatsapp.net")].includes(msg.sender)
        if (opts["queque"] && msg.text && !(isPrems)) {
            const queque = this.msgqueque, time = 1000 * 5
            const previousID = queque[queque.length - 1]
            queque.push(msg.id || msg.key.id)
            setInterval(async function () {
                if (queque.indexOf(previousID) === -1) clearInterval(this)
                await delay(time)
            }, time)
        }

        if (msg.isBaileys) return
        msg.exp += Math.ceil(Math.random() * 10)
        let usedPrefix
        const groupMetadata = msg.isGroup ? { ...(conn.chats[msg.chat]?.metadata || await this.groupMetadata(msg.chat).catch(_ => null) || {}), ...(((conn.chats[msg.chat]?.metadata || await this.groupMetadata(msg.chat).catch(_ => null) || {}).participants) && { participants: ((conn.chats[msg.chat]?.metadata || await this.groupMetadata(msg.chat).catch(_ => null) || {}).participants || []).map(p => ({ ...p, id: p.jid, jid: p.jid, lid: p.lid })) }) } : {}
        const participants = ((msg.isGroup ? groupMetadata.participants : []) || []).map(participant => ({ id: participant.jid, jid: participant.jid, lid: participant.lid, admin: participant.admin }))
        const userGroup = (msg.isGroup ? participants.find((u) => conn.decodeJid(u.jid) === msg.sender) : {}) || {}
        const botGroup = (msg.isGroup ? participants.find((u) => conn.decodeJid(u.jid) === this.user.jid) : {}) || {}
        const isRAdmin = userGroup?.admin == "superadmin" || false
        const isAdmin = isRAdmin || userGroup?.admin == "admin" || false
        const isBotAdmin = botGroup?.admin || false

        const ___dirname = path.join(__dirname, "./plugins")
        for (const name in global.plugins) {
            const plugin = global.plugins[name]
            if (!plugin) continue
            if (plugin.disabled) continue
            const __filename = path.join(___dirname, name)
            if (typeof plugin.all === "function") {
                try {
                    await plugin.all.call(this, msg, {
                        chatUpdate: m,
                        __dirname: ___dirname,
                        __filename,
                        user,
                        chat,
                        settings
                    })
                } catch (err) {
                    console.error(err)
                }
            }
            if (!opts["restrict"])
                if (plugin.tags && plugin.tags.includes("admin")) {
                    continue
                }
            const strRegex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
            const pluginPrefix = plugin.customPrefix || conn.prefix || global.prefix
            const match = (pluginPrefix instanceof RegExp ?
                [[pluginPrefix.exec(msg.text), pluginPrefix]] :
                Array.isArray(pluginPrefix) ?
                    pluginPrefix.map(prefix => {
                        const regex = prefix instanceof RegExp ?
                            prefix : new RegExp(strRegex(prefix))
                        return [regex.exec(msg.text), regex]
                    }) : typeof pluginPrefix === "string" ?
                        [[new RegExp(strRegex(pluginPrefix)).exec(msg.text), new RegExp(strRegex(pluginPrefix))]] :
                        [[[], new RegExp]]).find(prefix => prefix[1])
            if (typeof plugin.before === "function") {
                if (await plugin.before.call(this, msg, {
                    match,
                    conn: this,
                    participants,
                    groupMetadata,
                    userGroup,
                    botGroup,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    chatUpdate: m,
                    __dirname: ___dirname,
                    __filename,
                    user,
                    chat,
                    settings
                }))
                    continue
            }
            if (typeof plugin !== "function") {
                continue
            }
            if ((usedPrefix = (match[0] || "")[0])) {
                const noPrefix = msg.text.replace(usedPrefix, "")
                let [command, ...args] = noPrefix.trim().split(" ").filter(v => v)
                args = args || []
                let _args = noPrefix.trim().split(" ").slice(1)
                let text = _args.join(" ")
                command = (command || "").toLowerCase()
                const fail = plugin.fail || global.dfail
                const isAccept = plugin.command instanceof RegExp ?
                    plugin.command.test(command) :
                    Array.isArray(plugin.command) ?
                        plugin.command.some(cmd => cmd instanceof RegExp ?
                            cmd.test(command) : cmd === command) :
                        typeof plugin.command === "string" ?
                            plugin.command === command : false
                global.comando = command

                if (!isOwners && settings.self) return
                if ((msg.id.startsWith("NJX-") || (msg.id.startsWith("BAE5") && msg.id.length === 16) || (msg.id.startsWith("B24E") && msg.id.length === 20))) return

                if (global.db.data.chats[msg.chat].primaryBot && global.db.data.chats[msg.chat].primaryBot !== this.user.jid) {
                    const primaryBotConn = global.conns.find(conn => conn.user.jid === global.db.data.chats[msg.chat].primaryBot && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED)
                    const participants = msg.isGroup ? (await this.groupMetadata(msg.chat).catch(() => ({ participants: [] }))).participants : []
                    const primaryBotInGroup = participants.some(p => p.jid === global.db.data.chats[msg.chat].primaryBot)
                    if (primaryBotConn && primaryBotInGroup || global.db.data.chats[msg.chat].primaryBot === global.conn.user.jid) {
                        throw !1
                    } else {
                        global.db.data.chats[msg.chat].primaryBot = null
                    }
                } else {
                }

                if (!isAccept) continue
                msg.plugin = name
                global.db.data.users[msg.sender].commands++
                if (chat) {
                    const botId = this.user.jid
                    const primaryBotId = chat.primaryBot
                    if (name !== "group-banchat.js" && chat?.isBanned && !isROwner) {
                        if (!primaryBotId || primaryBotId === botId) {
                            const aviso = `ꕥ El bot *${botname}* está desactivado en este grupo\n\n> ✦ Un administrador puede activarlo con el comando:\n> » *${usedPrefix}bot on*`.trim()
                            await msg.reply(aviso)
                            return
                        }
                    }
                    if (msg.text && user.banned && !isROwner) {
                        const mensaje = `ꕥ Estas baneado/a, no puedes usar comandos en este bot!\n\n> ● *Razón ›* ${user.bannedReason}\n\n> ● Si este Bot es cuenta oficial y tienes evidencia que respalde que este mensaje es un error, puedes exponer tu caso con un moderador.`.trim()
                        if (!primaryBotId || primaryBotId === botId) {
                            msg.reply(mensaje)
                            return
                        }
                    }
                }
                if (!isOwners && !msg.chat.endsWith('g.us') && !/code|p|ping|qr|estado|status|infobot|botinfo|report|reportar|invite|join|logout|suggest|help|menu/gim.test(msg.text)) return
                const adminMode = chat.modoadmin || false
                const wa = plugin.botAdmin || plugin.admin || plugin.group || plugin || noPrefix || pluginPrefix || msg.text.slice(0, 1) === pluginPrefix || plugin.command
                if (adminMode && !isOwner && msg.isGroup && !isAdmin && wa) return
                if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
                    fail("owner", msg, this)
                    continue
                }
                if (plugin.rowner && !isROwner) {
                    fail("rowner", msg, this)
                    continue
                }
                if (plugin.owner && !isOwner) {
                    fail("owner", msg, this)
                    continue
                }
                if (plugin.premium && !isPrems) {
                    fail("premium", msg, this)
                    continue
                }
                if (plugin.group && !msg.isGroup) {
                    fail("group", msg, this)
                    continue
                }
                if (plugin.botAdmin && !isBotAdmin) {
                    fail("botAdmin", msg, this)
                    continue
                }
                if (plugin.admin && !isAdmin) {
                    fail("admin", msg, this)
                    continue
                }
                msg.isCommand = true
                msg.exp += plugin.exp ? parseInt(plugin.exp) : 10
                let extra = {
                    match,
                    usedPrefix,
                    noPrefix,
                    _args,
                    args,
                    command,
                    text,
                    conn: this,
                    participants,
                    groupMetadata,
                    userGroup,
                    botGroup,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    chatUpdate: m,
                    __dirname: ___dirname,
                    __filename,
                    user,
                    chat,
                    settings
                }
                try {
                    await plugin.call(this, msg, extra)
                } catch (err) {
                    msg.error = err
                    console.error(err)
                } finally {
                    if (typeof plugin.after === "function") {
                        try {
                            await plugin.after.call(this, msg, extra)
                        } catch (err) {
                            console.error(err)
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.error(err)
    } finally {
        if (opts["queque"] && msg.text) {
            const quequeIndex = this.msgqueque.indexOf(msg.id || msg.key.id)
            if (quequeIndex !== -1)
                this.msgqueque.splice(quequeIndex, 1)
        }
        let user = global.db.data.users[msg.sender]
        if (msg) {
            if (msg.sender && user) {
                user.exp += msg.exp
            }
        }
        try {
            // if (!opts["noprint"]) await require("./lib/print.js").default(msg, this)
        } catch (err) {
            console.warn(err)
            console.log(msg.message)
        }
    }
}

global.dfail = (type, m, conn) => {
    const msg = {
        rowner: `『✦』El comando *${comando}* solo puede ser usado por los creadores del bot.`,
        premium: `『✦』El comando *${comando}* solo puede ser usado por los usuarios premium.`,
        group: `『✦』El comando *${comando}* solo puede ser usado en grupos.`,
        admin: `『✦』El comando *${comando}* solo puede ser usado por los administradores del grupo.`,
        botAdmin: `『✦』Para ejecutar el comando *${comando}* debo ser administrador del grupo.`
    }[type]
    if (msg) return conn.reply(m.chat, msg, m, rcanal).then(_ => m.react('✖️'))
}

module.exports = handler
