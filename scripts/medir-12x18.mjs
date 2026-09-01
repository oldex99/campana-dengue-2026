/**
 * Mide el desborde del afiche 12x18 antes de exportarlo.
 *
 * En impresión el único fallo grave es que algo quede cortado, y eso no se ve
 * leyendo el código. Tiene que dar desborde 0 y alto exacto 1728.
 */
import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const RAIZ = path.resolve(AQUI, '..', '..')
const PIEZAS = path.join(RAIZ, 'piezas')

const ORIGINALES = {
  'qr.png': path.join(RAIZ, 'Qq8pblpxkz6sfeF_Sin título 2026-08-25.png'),
  'asamblea.jpg': path.join(RAIZ, 'video', 'fijas', '01-asamblea.jpg'),
}

const fuente = await readFile(path.join(PIEZAS, 'Main-12x18.dc.html'), 'utf8')
const helmet = fuente.match(/<helmet>([\s\S]*?)<\/helmet>/)?.[1] ?? ''
let cuerpo = fuente.match(/<x-dc>([\s\S]*?)<\/x-dc>/)?.[1] ?? ''
cuerpo = cuerpo.replace(/<helmet>[\s\S]*?<\/helmet>/, '')
for (const [nombre, ruta] of Object.entries(ORIGINALES)) {
  cuerpo = cuerpo.split(`src="${nombre}"`).join(`src="${pathToFileURL(ruta).href}"`)
}

const nav = await chromium.launch()
const pg = await nav.newPage({ viewport: { width: 1152, height: 1728 } })
await pg.setContent(`<!doctype html><html><head><meta charset="utf-8">${helmet}</head>
  <body>${cuerpo}</body></html>`, { waitUntil: 'networkidle' })
await pg.evaluate(() => document.fonts.ready)

const m = await pg.evaluate(() => {
  const el = document.querySelector('div')
  const r = []
  // cada bloque de primer nivel, para saber QUÉ desborda si desborda
  for (const hijo of el.children) {
    const c = hijo.getBoundingClientRect()
    r.push({ tag: hijo.tagName, alto: Math.round(c.height), top: Math.round(c.top) })
  }
  const h1 = document.querySelector('h1')
  return {
    alto: el.getBoundingClientRect().height,
    ancho: el.getBoundingClientRect().width,
    desborde: el.scrollHeight - el.clientHeight,
    ultimoFondo: Math.round(r[r.length - 1].top + r[r.length - 1].alto),
    titularLineas: Math.round(h1.getBoundingClientRect().height / (112 * 0.93)),
    titularAlto: Math.round(h1.getBoundingClientRect().height),
    bloques: r,
  }
})

console.log(`lienzo   : ${m.ancho} x ${m.alto} px  (debe ser 1152 x 1728)`)
console.log(`DESBORDE : ${m.desborde} px  ${m.desborde > 0 ? '*** SE CORTA ***' : 'OK'}`)
console.log(`fondo del último bloque: ${m.ultimoFondo} px (holgura ${1728 - m.ultimoFondo})`)
console.log(`titular  : ${m.titularLineas} líneas (${m.titularAlto} px)`)
console.log('bloques  :', m.bloques.map(b => `${b.tag}@${b.top}+${b.alto}`).join('  '))

await pg.screenshot({ path: path.join(PIEZAS, 'previo-afiche-12x18.png') })
console.log('captura  : piezas/previo-afiche-12x18.png')
await nav.close()
