/**
 * Genera los PDF listos para imprenta a partir de las piezas del lienzo.
 *
 *   node scripts/pdf-imprenta.mjs
 *
 * Tres diferencias con lo que exporta el lienzo de diseño, y las tres
 * importan cuando se van a tirar miles:
 *
 *  1. Usa las imágenes ORIGINALES, no las comprimidas que viajan dentro
 *     del lienzo. El QR va con los 2000 px de Bitly.
 *  2. Sale en vectores con las tipografías incrustadas, no rasterizado.
 *  3. Agrega 3 mm de sangrado por lado. Sin eso, el más mínimo corrimiento
 *     de la guillotina deja una franja blanca en el borde de una pieza que
 *     es negra hasta la orilla.
 *
 * Deja los archivos en piezas/imprenta/.
 */
import { chromium } from 'playwright'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const RAIZ = path.resolve('..')
const PIEZAS = path.join(RAIZ, 'piezas')
const SALIDA = path.join(PIEZAS, 'imprenta')

const SANGRADO_CM = 0.3   // 3 mm por lado, lo estándar en Costa Rica
const PX_POR_CM = 96 / 2.54

// Las imágenes livianas del lienzo se cambian por las originales.
const ORIGINALES = {
  'qr.png': path.join(RAIZ, 'Qq8pblpxkz6sfeF_Sin título 2026-08-25.png'),
  'asamblea.jpg': path.join(RAIZ, 'video', 'fijas', '01-asamblea.jpg'),
  'rey.jpg': path.join(RAIZ, 'video', 'fijas', '03-rey.jpg'),
}

const TRABAJOS = [
  { archivo: 'Main.dc.html', pdf: 'afiche-a2.pdf', anchoCm: 42, altoCm: 59.4 },
  // 12 x 18 pulgadas: la medida que ofrece la imprenta (su máquina no da más).
  // Pieza re-fluida aparte, no el A2 escalado: las proporciones no calzan
  // (1,414 vs 1,5) y el legal del pie caería a 8,7 pt.
  { archivo: 'Main-12x18.dc.html', pdf: 'afiche-12x18.pdf', anchoCm: 30.48, altoCm: 45.72 },
  { archivo: 'Adhesivo.dc.html', pdf: 'adhesivo-5x7.pdf', anchoCm: 5, altoCm: 7 },
]

/** Saca el <helmet> y el contenido de <x-dc> del archivo del lienzo. */
function despiezar(fuente) {
  const helmet = fuente.match(/<helmet>([\s\S]*?)<\/helmet>/)?.[1] ?? ''
  const cuerpo = fuente.match(/<x-dc>([\s\S]*?)<\/x-dc>/)?.[1] ?? ''
  return { helmet, cuerpo: cuerpo.replace(/<helmet>[\s\S]*?<\/helmet>/, '') }
}

/**
 * Saca el enlace a Google Fonts del documento de impresión.
 *
 * Enlazadas, Chromium las sustituye en silencio al exportar el PDF y el
 * texto llega a la imprenta en otra tipografía. Se reemplaza por el CSS
 * con las fuentes incrustadas en base64 que arma bajar-fuentes.mjs: sin
 * red de por medio no hay carrera ni sustitución posible.
 */
function sinEnlaceDeFuentes(helmet) {
  return helmet.replace(
    /<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/[^"]*">/, '')
}

/** Reemplaza los nombres de imagen por la ruta absoluta del original. */
function conOriginales(html) {
  let salida = html
  for (const [nombre, ruta] of Object.entries(ORIGINALES)) {
    const url = pathToFileURL(ruta).href
    salida = salida.split(`src="${nombre}"`).join(`src="${url}"`)
  }
  return salida
}

await mkdir(SALIDA, { recursive: true })

let fuentesCss = ''
try {
  fuentesCss = await readFile(path.join(PIEZAS, 'fuentes.css'), 'utf8')
} catch {
  console.error('Falta piezas/fuentes.css. Corré antes: node scripts/bajar-fuentes.mjs')
  process.exitCode = 1
}

const nav = await chromium.launch()

for (const t of TRABAJOS) {
  const fuente = await readFile(path.join(PIEZAS, t.archivo), 'utf8')
  const { helmet, cuerpo } = despiezar(fuente)

  const anchoPx = Math.round(t.anchoCm * PX_POR_CM)
  const altoPx = Math.round(t.altoCm * PX_POR_CM)
  const sangradoCm = SANGRADO_CM
  // La pieza se escala apenas para cubrir el sangrado. El corte cae 3 mm
  // adentro, así que lo que se pierde es margen, nunca contenido.
  const escala = (t.anchoCm + sangradoCm * 2) / t.anchoCm

  // La base apunta a piezas/ para que las rutas relativas del diseño
  // (la textura de grano) resuelvan aunque el HTML temporal viva en
  // imprenta/. Las imágenes grandes ya vienen con ruta absoluta.
  const doc = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<base href="${pathToFileURL(PIEZAS).href}/">
<style>${fuentesCss}</style>
${sinEnlaceDeFuentes(helmet)}
<style>
  @page { size: ${t.anchoCm + sangradoCm * 2}cm ${t.altoCm + sangradoCm * 2}cm; margin: 0; }
  html, body { margin: 0; padding: 0; background: transparent; }
  .hoja {
    width: ${t.anchoCm + sangradoCm * 2}cm;
    height: ${t.altoCm + sangradoCm * 2}cm;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .pieza { transform: scale(${escala.toFixed(5)}); transform-origin: center; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style>
</head><body>
<div class="hoja"><div class="pieza">${conOriginales(cuerpo)}</div></div>
</body></html>`

  const temporal = path.join(SALIDA, `.${t.pdf}.html`)
  await writeFile(temporal, doc, 'utf8')

  const pg = await nav.newPage({ viewport: { width: anchoPx, height: altoPx } })
  await pg.goto(pathToFileURL(temporal).href, { waitUntil: 'networkidle' })
  await pg.evaluate(() => document.fonts.ready)
  await pg.waitForTimeout(1200)

  await pg.pdf({
    path: path.join(SALIDA, t.pdf),
    width: `${t.anchoCm + sangradoCm * 2}cm`,
    height: `${t.altoCm + sangradoCm * 2}cm`,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  })

  console.log(`${t.pdf.padEnd(20)} corte ${t.anchoCm} x ${t.altoCm} cm · ` +
    `con sangrado ${(t.anchoCm + 0.6).toFixed(1)} x ${(t.altoCm + 0.6).toFixed(1)} cm`)

  await pg.close()
}

// --- pliego de adhesivos ---
// Van pegados uno contra otro, sin separación. Es a propósito: como todos
// son iguales y oscuros hasta la orilla, un corte que se desvíe un pelo
// toma del vecino y no se nota. Separarlos obligaría a dos cortes por
// calle y dejaría filo blanco a la vista.
{
  const COLS = 4, FILAS = 4
  const ANCHO_CM = 21, ALTO_CM = 29.7        // A4
  const PIEZA_ANCHO = 189, PIEZA_ALTO = 265  // 5 x 7 cm a 96 px/pulgada

  const fuente = await readFile(path.join(PIEZAS, 'Adhesivo.dc.html'), 'utf8')
  const { helmet, cuerpo } = despiezar(fuente)

  const hojaAncho = Math.round(ANCHO_CM * PX_POR_CM)
  const hojaAlto = Math.round(ALTO_CM * PX_POR_CM)
  const bloqueAncho = COLS * PIEZA_ANCHO
  const bloqueAlto = FILAS * PIEZA_ALTO
  const margenX = (hojaAncho - bloqueAncho) / 2
  const margenY = (hojaAlto - bloqueAlto) / 2

  // Marcas de corte en los márgenes, alineadas con cada calle
  const marcas = []
  for (let c = 0; c <= COLS; c++) {
    const x = margenX + c * PIEZA_ANCHO
    marcas.push(`<div style="position:absolute;left:${x}px;top:0;width:1px;height:${margenY - 6}px;background:#666"></div>`)
    marcas.push(`<div style="position:absolute;left:${x}px;top:${margenY + bloqueAlto + 5}px;width:1px;height:12px;background:#666"></div>`)
  }
  for (let f = 0; f <= FILAS; f++) {
    const y = margenY + f * PIEZA_ALTO
    marcas.push(`<div style="position:absolute;left:0;top:${y}px;height:1px;width:${margenX - 6}px;background:#666"></div>`)
    marcas.push(`<div style="position:absolute;left:${margenX + bloqueAncho + 6}px;top:${y}px;height:1px;width:${margenX - 6}px;background:#666"></div>`)
  }

  const unidades = Array.from({ length: COLS * FILAS }, () => conOriginales(cuerpo)).join('')

  const doc = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<base href="${pathToFileURL(PIEZAS).href}/">
<style>${fuentesCss}</style>
${sinEnlaceDeFuentes(helmet)}
<style>
  @page { size: ${ANCHO_CM}cm ${ALTO_CM}cm; margin: 0; }
  html, body { margin: 0; padding: 0; background: #ffffff; }
  .hoja { position: relative; width: ${hojaAncho}px; height: ${hojaAlto}px; }
  .rejilla {
    position: absolute; left: ${margenX}px; top: ${margenY}px;
    display: grid; grid-template-columns: repeat(${COLS}, ${PIEZA_ANCHO}px);
    grid-auto-rows: ${PIEZA_ALTO}px;
  }
  .rejilla > div { margin: 0 !important; }
  .pie {
    position: absolute; left: ${margenX}px; top: ${margenY + bloqueAlto + 21}px;
    font: 8px 'Archivo', sans-serif; color: #999;
  }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style>
</head><body>
<div class="hoja">
  ${marcas.join('')}
  <div class="rejilla">${unidades}</div>
  <div class="pie">Adhesivos 5 x 7 cm · cortar por las marcas · Campaña Dengue, Área de Salud Cañas</div>
</div>
</body></html>`

  const temporal = path.join(SALIDA, '.pliego.html')
  await writeFile(temporal, doc, 'utf8')

  const pg = await nav.newPage({ viewport: { width: hojaAncho, height: hojaAlto } })
  await pg.goto(pathToFileURL(temporal).href, { waitUntil: 'networkidle' })
  await pg.evaluate(() => document.fonts.ready)
  await pg.waitForTimeout(1200)

  await pg.pdf({
    path: path.join(SALIDA, 'adhesivos-pliego-a4.pdf'),
    width: `${ANCHO_CM}cm`, height: `${ALTO_CM}cm`,
    printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 },
  })

  // Vista previa del pliego: el PDF no se puede mirar desde acá, y una
  // rejilla mal armada solo se ve mirándola.
  await pg.screenshot({ path: path.join(PIEZAS, 'previo-pliego.png') })

  console.log(`adhesivos-pliego-a4.pdf  ${COLS * FILAS} adhesivos en A4 · ` +
    `margen ${(margenX / PX_POR_CM).toFixed(1)} x ${(margenY / PX_POR_CM).toFixed(1)} cm`)
  await pg.close()
}

await nav.close()
console.log(`\nEn piezas/imprenta/`)
