/**
 * Vista previa de las piezas impresas al tamaño real (96 px/pulgada).
 *
 *   node scripts/previsualizar-piezas.mjs
 *
 * Vive acá y no en piezas/ porque es donde está instalado Playwright.
 * Mide el alto real del bloque contra el alto del papel: en impresión el
 * único fallo grave es que algo quede cortado, y eso no se ve leyendo el
 * código.
 */
import { chromium } from 'playwright'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const PIEZAS_DIR = path.resolve('..', 'piezas')

const PIEZAS = [
  { archivo: 'Main.dc.html', ancho: 1587, alto: 2245, png: 'previo-afiche.png' },
  { archivo: 'Adhesivo.dc.html', ancho: 189, alto: 265, png: 'previo-adhesivo.png' },
  { archivo: 'TeaserA.dc.html', ancho: 1587, alto: 2245, png: 'previo-teaser-a.png' },
  { archivo: 'DirectoAfiche.dc.html', ancho: 1587, alto: 2245, png: 'previo-directo-afiche.png' },
  { archivo: 'DirectoAdhesivo.dc.html', ancho: 189, alto: 265, png: 'previo-directo-adhesivo.png' },
]

const nav = await chromium.launch()

for (const p of PIEZAS) {
  const pg = await nav.newPage({ viewport: { width: p.ancho, height: p.alto } })
  await pg.goto(pathToFileURL(path.join(PIEZAS_DIR, p.archivo)).href)
  await pg.waitForTimeout(2000)

  const m = await pg.evaluate(() => {
    const el = document.querySelector('x-dc > div')
    const r = el.getBoundingClientRect()
    return {
      ancho: Math.round(r.width),
      alto: Math.round(r.height),
      desborde: el.scrollHeight - el.clientHeight,
    }
  })

  const veredicto = m.desborde > 0 ? `SE CORTA por ${m.desborde}px` : 'entra completo'
  console.log(`${p.archivo.padEnd(18)} ${m.ancho}x${m.alto}px  ${veredicto}`)

  await pg.screenshot({ path: path.join(PIEZAS_DIR, p.png) })
  await pg.close()
}

await nav.close()
