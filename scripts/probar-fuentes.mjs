/**
 * Averigua qué formato de archivo devuelve Google Fonts según el
 * user-agent, para poder incrustar uno que Chromium sí lea.
 *
 *   node scripts/probar-fuentes.mjs
 *
 * Importa porque Chromium NO incrusta fuentes variables al exportar PDF:
 * las sustituye en silencio y el texto llega a la imprenta en otra
 * tipografía. Hay que darle instancias estáticas y en un formato que
 * entienda (ttf o woff, nunca eot).
 */
const AGENTES = {
  'MSIE 6': 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)',
  'Safari 5': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8) AppleWebKit/534.51.22 (KHTML, like Gecko) Version/5.1.1 Safari/534.51.22',
  'Firefox 3.6': 'Mozilla/5.0 (Windows NT 6.1; rv:1.9.2) Gecko/20100115 Firefox/3.6',
  'Chrome viejo': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0 Safari/537.4',
  'sin agente': '',
}

for (const [nombre, ua] of Object.entries(AGENTES)) {
  const css = await fetch('https://fonts.googleapis.com/css?family=Archivo:400', {
    headers: ua ? { 'User-Agent': ua } : {},
  }).then(r => r.text())

  const url = css.match(/url\(([^)]+)\)/)?.[1] ?? '(sin url)'
  const formato = css.match(/format\('([^']+)'\)/)?.[1] ?? '(sin formato)'
  const extension = url.split('?')[0].split('.').pop()
  console.log(`${nombre.padEnd(14)} formato: ${formato.padEnd(10)} extensión: ${extension}`)
}
