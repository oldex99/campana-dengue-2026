/**
 * Revisa que lo publicado diga lo que creemos que dice.
 *
 *   node scripts/verificar.mjs [url]
 *
 * Lee los textos que mas nos ha costado dejar bien (cifras del grafico,
 * rotulos de las fases, instruccion de urgencias) directamente del sitio
 * ya desplegado, en vez de confiar en que el despliegue salio bien.
 */
import { chromium } from 'playwright'

const URL = process.argv[2] || 'https://dengue2026sacr.online'

const nav = await chromium.launch()
const pg = await nav.newPage({ viewport: { width: 900, height: 1200 } })

const errores = []
pg.on('console', m => m.type() === 'error' && errores.push(m.text()))
pg.on('pageerror', e => errores.push(String(e)))

await pg.goto(URL, { waitUntil: 'networkidle' })

// Recorrer la pagina: los contadores y el grafico solo arrancan al verse
await pg.evaluate(async () => {
  const paso = window.innerHeight * 0.7
  for (let y = 0; y < document.body.scrollHeight; y += paso) {
    window.scrollTo(0, y)
    await new Promise(r => setTimeout(r, 150))
  }
})
await pg.waitForTimeout(2500)

const r = await pg.evaluate(() => ({
  titulo: document.querySelector('#que-es .section-title')?.textContent?.trim(),
  bajadaSuelta: !!document.querySelector('#que-es .section-subtitle'),
  fases: [...document.querySelectorAll('.fase__num')].map(e => e.textContent.trim()),
  alarma: document.querySelector('.alarma__intro')?.textContent?.trim(),
  cifras: [...document.querySelectorAll('.stat-num')].map(e => e.textContent.trim()),
  pieGrafico: document.querySelector('.fuente-chart')?.textContent?.trim(),
  video: document.getElementById('yt-iframe') ? 'presente' : 'FALTA',
}))

console.log(`\n${URL}\n`)
console.log('Titulo del virus :', r.titulo)
console.log('Bajada suelta    :', r.bajadaSuelta ? 'SIGUE AHI' : 'quitada')
console.log('Fases            :', r.fases.join(' | '))
console.log('Urgencias        :', r.alarma)
console.log('Cifras           :', r.cifras.join(' · '))
console.log('Pie del grafico  :', r.pieGrafico)
console.log('Reproductor      :', r.video)
console.log('Errores          :', errores.length ? errores : 'ninguno')

await nav.close()
