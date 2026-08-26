/** Diagnostico de posicion y estilos tras el recorrido de la pagina. */
import { chromium } from 'playwright'

const URL = process.argv[2] || 'http://localhost:5173'
const nav = await chromium.launch()
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } })
const pg = await ctx.newPage()
await pg.goto(URL, { waitUntil: 'networkidle' })

await pg.evaluate(async () => {
  const paso = window.innerHeight * 0.7
  for (let y = 0; y < document.body.scrollHeight; y += paso) {
    window.scrollTo(0, y); await new Promise(r => setTimeout(r, 180))
  }
})
await pg.waitForTimeout(1500)

const r = await pg.evaluate(() => {
  const centro = window.innerWidth / 2
  const desviados = []
  document.querySelectorAll('.reveal, .check-item, .info-card, .ciclo__stage, .fase, .impacto-card').forEach(el => {
    const cs = getComputedStyle(el)
    const b = el.getBoundingClientRect()
    const t = cs.transform
    if (t && t !== 'none') {
      const m = t.match(/matrix\(([^)]+)\)/)
      if (m) {
        const p = m[1].split(',').map(Number)
        const dx = p[4], dy = p[5]
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5)
          desviados.push({
            clase: el.className.split(' ').slice(0, 2).join('.'),
            dx: Math.round(dx), dy: Math.round(dy),
            opacidad: cs.opacity
          })
      }
    }
  })
  // Centrado de bloques principales
  const centrado = []
  ;['.checklist', '.cards-grid', '.extra-grid', '.fases', '.impacto-grid', '.stats-row'].forEach(s => {
    const el = document.querySelector(s)
    if (!el) return
    const b = el.getBoundingClientRect()
    centrado.push({ sel: s, centro: Math.round(b.left + b.width / 2), desvio: Math.round(b.left + b.width / 2 - centro) })
  })
  return { centroVentana: centro, transformesResiduales: desviados, centradoDeBloques: centrado }
})

console.log(JSON.stringify(r, null, 1))
await nav.close()
