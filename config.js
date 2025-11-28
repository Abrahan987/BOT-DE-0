import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

// --- DATOS DEL BOT Y DEL CREADOR ---
global.owner = [
  ['51906930453', '👑 ABRAHAN-M - Creador 👑', true],
  ['5219992095471', '👑 ARLETTE - Creadora 👑', true]
]
global.suittag = ['51906930453']
global.prems = ['51906930453']

// --- NOMBRE DEL BOT ---
global.botname = 'Corvette Bot'

// --- OPCIONES DE CONEXIÓN ---
global.packname = 'Corvette Bot'
global.author = 'ABRAHAN-M Y ARLETTE'
global.wm = 'Corvette Bot'
global.igfg = '▢ Sígueme en Instagram\nhttps://www.instagram.com/abraham.18.1'
global.wait = '*[ ⏳ ] Cargando...*'

// --- MENSAJES Y COMANDOS ---
import fs from 'fs'
import * as cheerio from 'cheerio'

global.APIs = {}
global.APIKeys = {}

// --- DECORACIONES Y SÍMBOLOS ---
global.dev = 'ABRAHAN-M Y ARLETTE'
global.vs = '1.0'
global.mods = []

// --- SEPARADORES ---
global.flaaa = [
  'https://flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=water-logo&script=water-logo&fontsize=90&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&fillTextColor=%23000&shadowGlowColor=%23000&backgroundColor=%23000&text=',
  'https://flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=crafts-logo&fontsize=90&doScale=true&scaleWidth=800&scaleHeight=500&text=',
  'https://flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=amped-logo&doScale=true&scaleWidth=800&scaleHeight=500&text=',
  'https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=sketch-name&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&fillTextType=1&fillTextPattern=Warning!&text=',
  'https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=sketch-name&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&fillTextType=1&fillTextPattern=Warning!&fillColor1Color=%23f2aa4c&fillColor2Color=%23f2aa4c&fillColor3Color=%23f2aa4c&fillColor4Color=%23f2aa4c&fillColor5Color=%23f2aa4c&fillColor6Color=%23f2aa4c&fillColor7Color=%23f2aa4c&fillColor8Color=%23f2aa4c&fillColor9Color=%23f2aa4c&fillColor10Color=%23f2aa4c&fillOutlineColor=%23f2aa4c&fillOutline2Color=%23f2aa4c&backgroundColor=%23101820&text='
]

// --- NO TOCAR ESTO ---
let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Se actualizó 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})
