import fs from 'fs'
import fetch from 'node-fetch'
import { JSDOM } from 'jsdom'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// --- MENSAJE DE ESPERA ---
global.wait = '*[ ⏳ ] Cargando...*'

// --- FAKES Y CONFIGURACIONES ADICIONALES ---
global.keysZens = ['LuOlangNgentot', 'c2459db922', '37CC845916', '6fb0eff124', 'hdiiofficial', 'fiktod', 'BF39D349845E', '675e34de8a', '0b917b905e6f']
global.keysxxx = keysZens[Math.floor(keysZens.length * Math.random())]
global.lolkeysapi = ['GataDios']
global.APIs = {
  tio: 'https://api.botcahx.live',
  lol: 'https://api.lolhuman.xyz',
  neoxr: 'https://api.neoxr.my.id',
  zenz: 'https://api.zahwazein.xyz',
  akuari: 'https://api.akuari.my.id'
}
global.APIKeys = {
  'https://api.botcahx.live': 'Ikyy69',
  'https://api.lolhuman.xyz': 'GataDios',
  'https://api.neoxr.my.id': 'keylerin',
  'https://api.zahwazein.xyz': 'f02596542152'
}

// --- CONFIGURACIÓN DE STICKERS ---
global.stiker_wait = '*[ ⏳ ] Creando sticker...*'
global.packname = 'Corvette Bot'
global.author = 'ABRAHAN-M & ARLETTE'

// --- OTRAS CONFIGURACIONES ---
global.multiplier = 9999
global.fglog = 'https://i.imgur.com/mWHalx6.jpg'
global.fgdot = 'https://i.imgur.com/f03BjoC.jpg'

// --- FUNCIÓN DE EJEMPLO ASÍNCRONA ---
global.thumb = fs.readFileSync(path.join(__dirname, '../media/corvette.jpg'))

// --- WATCH FILE (PARA ACTUALIZACIONES EN VIVO) ---
const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright("Se actualizó '_allfake.js'"))
  import(`${file}?update=${Date.now()}`)
})
