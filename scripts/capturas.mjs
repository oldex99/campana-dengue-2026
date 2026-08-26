/**
 * Capturas del sitio en varios anchos, como archivos PNG.
 *
 *   node scripts/capturas.mjs [url]
 *
 * Por defecto apunta al servidor de desarrollo. Deja las imagenes en
 * capturas/, que esta fuera del repositorio.
 */
import { chromium } from 'playwright'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'

const URL = process.argv[2] || 'http://localhost:5173'
const SALIDA = path.resolve('capturas')

const ANCHOS = [
  { nombre: 'movil',   ancho: 375,  alto: 812 },
  { nombre: 'tablet',  ancho: 768,  alto: 1024 },
  { nombre: 'laptop',  ancho: 1024, alto: 768 },
  { nombre: 'desktop', ancho: 1440, alto: 900 },
]

// Cada seccion por separado, para mirarlas de cerca
const SECCIONES = ['hero', 'que-es', 'ciclo', 'sintomas', 'datos', 'sistema', 'accion']

await rm(SALIDA, { recursive: true, force: true })
await mkdir(SALIDA, { recursive: true })

const navegador = await chromium.launch()

for (const v of ANCHOS) {
  const ctx = await navegador.newContext({
    viewport: { width: v.ancho, height: v.alto },
    deviceScaleFactor: 2,
    isMobile: v.ancho < 768,
    hasTouch: v.ancho < 768,
  })
  const pg = await ctx.newPage()

  const errores = []
  pg.on('console', m => { if (m.type() === 'error') errores.push(m.text()) })
  pg.on('pageerror', e => errores.push('PAGEERROR: ' + e.message))

  await pg.goto(URL, { waitUntil: 'networkidle' })

  // Recorrer toda la pagina para disparar animaciones y carga diferida
  await pg.evaluate(async () => {
    const paso = window.innerHeight * 0.7
    for (let y = 0; y < document.body.scrollHeight; y += paso) {
      window.scrollTo(0, y)
      await new Promise(r => setTimeout(r, 180))
    }
    window.scrollTo(0, 0)
    await new Promise(r => setTimeout(r, 600))
  })
  await pg.waitForTimeout(900)

  await pg.screenshot({
    path: path.join(SALIDA, `${v.nombre}-completa.png`),
    fullPage: true,
  })

  for (const id of SECCIONES) {
    const el = await pg.$('#' + id)
    if (!el) continue
    await el.scrollIntoViewIfNeeded()
    await pg.waitForTimeout(500)
    await el.screenshot({ path: path.join(SALIDA, `${v.nombre}-${id}.png`) })
  }

  const alto = await pg.evaluate(() => document.body.scrollHeight)
  console.log(`${v.nombre.padEnd(8)} ${String(v.ancho).padStart(4)}px  alto=${alto}px  ` +
              (errores.length ? `ERRORES: ${errores.slice(0, 3).join(' | ')}` : 'sin errores'))

  await ctx.close()
}

await navegador.close()
console.log('\nCapturas en: ' + SALIDA)
