/**
 * Espera a que produccion sirva una cadena concreta y sale.
 *
 *   node scripts/esperar-despliegue.mjs "texto que debe aparecer" [url]
 *
 * Vercel tarda un poco en reconstruir; sin esto uno verifica la version
 * vieja y cree que el cambio no salio.
 */
// Sin process.exit: en Windows, salir con un fetch todavia en vuelo revienta
// con una asercion de libuv y el proceso muere con codigo 127, aunque el
// despliegue si haya llegado. Se marca el codigo y se deja terminar solo.
const [aguja, url = 'https://dengue2026sacr.online'] = process.argv.slice(2)
let encontrado = false

for (let i = 0; i < 90 && !encontrado; i++) {
  const html = await fetch(url, { cache: 'no-store' }).then(r => r.text()).catch(() => '')
  encontrado = html.includes(aguja)
  if (!encontrado) await new Promise(r => setTimeout(r, 5000))
}

console.log(encontrado ? 'desplegado' : 'no aparecio en 7.5 minutos')
process.exitCode = encontrado ? 0 : 1
