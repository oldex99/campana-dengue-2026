/**
 * Mide el sitio como lo vive la persona en la farmacia: celular de gama
 * media, datos moviles, de pie en la fila.
 *
 *   node scripts/rendimiento.mjs [url]
 *
 * No confia en el "se siente rapido" de una laptop con fibra: estrangula
 * la CPU cuatro veces y la red a 4G lento antes de medir.
 */
import { chromium, devices } from 'playwright'

const URL = process.argv[2] || 'https://dengue2026sacr.online'

// 4G lento, los numeros que usa Lighthouse para su perfil movil
const RED = {
  offline: false,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
  latency: 150,
}

const nav = await chromium.launch()
const ctx = await nav.newContext({ ...devices['Pixel 5'] })
const pg = await ctx.newPage()

const cdp = await ctx.newCDPSession(pg)
await cdp.send('Network.enable')
await cdp.send('Network.emulateNetworkConditions', RED)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

// --- que pesa y cuanto tarda cada recurso ---
const recursos = []
pg.on('response', async r => {
  try {
    const h = r.headers()
    recursos.push({
      url: r.url(),
      tipo: r.request().resourceType(),
      bytes: Number(h['content-length'] || 0),
      estado: r.status(),
    })
  } catch {}
})

const arranque = Date.now()
await pg.goto(URL, { waitUntil: 'load', timeout: 120000 })

// --- metricas del navegador, no cronometro de afuera ---
const m = await pg.evaluate(() => new Promise(resolve => {
  const salida = { lcp: 0, cls: 0, fcp: 0 }
  new PerformanceObserver(l => {
    for (const e of l.getEntries()) salida.lcp = e.startTime
  }).observe({ type: 'largest-contentful-paint', buffered: true })

  new PerformanceObserver(l => {
    for (const e of l.getEntries()) if (!e.hadRecentInput) salida.cls += e.value
  }).observe({ type: 'layout-shift', buffered: true })

  const fcp = performance.getEntriesByName('first-contentful-paint')[0]
  if (fcp) salida.fcp = fcp.startTime

  const t = performance.getEntriesByType('navigation')[0]
  salida.ttfb = t?.responseStart || 0
  salida.domListo = t?.domContentLoadedEventEnd || 0
  salida.cargado = t?.loadEventEnd || 0

  setTimeout(() => resolve(salida), 3000)
}))

// --- recorrer la pagina: ahi es donde GSAP puede ahogar el hilo ---
const antesScroll = Date.now()
await pg.evaluate(async () => {
  const paso = window.innerHeight * 0.8
  for (let y = 0; y < document.body.scrollHeight; y += paso) {
    window.scrollTo(0, y)
    await new Promise(r => setTimeout(r, 120))
  }
})
const scrollMs = Date.now() - antesScroll

const tareasLargas = await pg.evaluate(() =>
  performance.getEntriesByType('longtask')?.length || 0)

const cls = await pg.evaluate(() => {
  let v = 0
  for (const e of performance.getEntriesByType('layout-shift') || []) {
    if (!e.hadRecentInput) v += e.value
  }
  return v
})

// --- peso real, medido en el navegador ---
// La cabecera content-length no viene en las respuestas comprimidas, asi
// que CSS y JS salian en cero. transferSize cuenta lo que de verdad viajo
// por la red, ya comprimido.
const medidos = await pg.evaluate(() =>
  performance.getEntriesByType('resource').map(r => ({
    url: r.name,
    tipo: r.initiatorType,
    bytes: r.transferSize || r.encodedBodySize || 0,
  })))

for (const m of medidos) {
  const yaEsta = recursos.find(r => r.url === m.url)
  if (yaEsta && !yaEsta.bytes) yaEsta.bytes = m.bytes
  else if (!yaEsta) recursos.push({ ...m, estado: 200 })
}

const porTipo = {}
for (const r of recursos) {
  porTipo[r.tipo] = porTipo[r.tipo] || { n: 0, bytes: 0 }
  porTipo[r.tipo].n++
  porTipo[r.tipo].bytes += r.bytes
}
const totalBytes = recursos.reduce((s, r) => s + r.bytes, 0)

const kb = b => (b / 1024).toFixed(0).padStart(6) + ' KB'
const ms = v => (v / 1000).toFixed(2).padStart(6) + ' s'

console.log(`\n${URL}  ·  Pixel 5, CPU x4 mas lenta, 4G lento\n`)
console.log('TIEMPOS')
console.log(`  primer byte            ${ms(m.ttfb)}`)
console.log(`  primer pintado         ${ms(m.fcp)}`)
console.log(`  imagen principal (LCP) ${ms(m.lcp)}`)
console.log(`  DOM listo              ${ms(m.domListo)}`)
console.log(`  carga completa         ${ms(m.cargado)}`)
console.log(`  total hasta load       ${ms(Date.now() - arranque)}`)

console.log('\nESTABILIDAD')
console.log(`  saltos de maqueta (CLS)  ${cls.toFixed(3)}`)
console.log(`  tareas largas            ${tareasLargas}`)
console.log(`  recorrido completo       ${ms(scrollMs)}`)

console.log('\nPESO')
for (const [t, v] of Object.entries(porTipo).sort((a, b) => b[1].bytes - a[1].bytes)) {
  console.log(`  ${t.padEnd(12)} ${String(v.n).padStart(3)} archivos ${kb(v.bytes)}`)
}
console.log(`  ${'TOTAL'.padEnd(12)} ${String(recursos.length).padStart(3)} archivos ${kb(totalBytes)}`)

console.log('\nLOS 8 MAS PESADOS')
recursos.sort((a, b) => b.bytes - a.bytes).slice(0, 8).forEach(r => {
  console.log(`  ${kb(r.bytes)}  ${r.url.replace(URL, '').slice(0, 62)}`)
})

const fallos = recursos.filter(r => r.estado >= 400)
if (fallos.length) {
  console.log('\nRECURSOS QUE FALLARON')
  fallos.forEach(r => console.log(`  ${r.estado}  ${r.url}`))
}

await nav.close()
