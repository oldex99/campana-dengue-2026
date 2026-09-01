/**
 * Descarga las tipografías estáticas y arma un CSS con ellas incrustadas.
 *
 *   node scripts/bajar-fuentes.mjs
 *
 * Por qué no basta con enlazar Google Fonts en el documento de impresión:
 * Chromium sustituye en silencio cualquier fuente que no logre resolver a
 * tiempo al exportar el PDF, y el texto llega a la imprenta en otra
 * tipografía sin que nadie se entere. Incrustadas en base64 no hay red,
 * no hay carrera y no hay sustitución posible.
 *
 * Deja piezas/fuentes.css, que pdf-imprenta.mjs mete en el documento.
 */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

const SALIDA = path.resolve('..', 'piezas', 'fuentes.css')

// Sin user-agent, la API v1 devuelve TTF estático. Ojo con "mejorarlo"
// mandando uno de navegador viejo: con el de Internet Explorer devuelve EOT,
// que Chromium no lee, el @font-face se cae sin avisar y el PDF sale con la
// tipografía del sistema.
const CABECERAS = {}

// Un pedido por peso: si se piden juntos, la API vieja devuelve un solo
// archivo y el navegador termina engordando el resto por su cuenta, que en
// impresión se ve como una negrita falsa y sucia.
const PEDIDOS = [
  { familia: 'Archivo+Black', pesos: '400' },
  { familia: 'Archivo', pesos: '400' },
  { familia: 'Archivo', pesos: '500' },
  { familia: 'Archivo', pesos: '600' },
  { familia: 'Archivo', pesos: '700' },
]

const partes = []

for (const p of PEDIDOS) {
  const url = `https://fonts.googleapis.com/css?family=${p.familia}:${p.pesos}`
  const css = await fetch(url, { headers: CABECERAS }).then(r => r.text())

  // Cada bloque @font-face trae su familia, su peso y su URL
  for (const bloque of css.split('@font-face').slice(1)) {
    const familia = bloque.match(/font-family:\s*'([^']+)'/)?.[1]
    // El peso lo manda el pedido: la API vieja a veces responde 400 en el
    // CSS aunque el archivo servido sea el del peso solicitado.
    const peso = p.pesos
    const estilo = bloque.match(/font-style:\s*(\w+)/)?.[1] ?? 'normal'
    const fuente = bloque.match(/url\((https:[^)]+)\)/)?.[1]
    if (!familia || !fuente) continue

    const bytes = Buffer.from(await fetch(fuente).then(r => r.arrayBuffer()))
    const tipo = fuente.endsWith('.woff2') ? 'woff2'
      : fuente.endsWith('.woff') ? 'woff' : 'truetype'

    partes.push(`@font-face{font-family:'${familia}';font-style:${estilo};` +
      `font-weight:${peso};src:url(data:font/${tipo === 'truetype' ? 'ttf' : tipo};` +
      `base64,${bytes.toString('base64')}) format('${tipo}');font-display:block;}`)

    console.log(`${familia} ${peso} ${estilo}  ${(bytes.length / 1024).toFixed(0)} KB  ${tipo}`)
  }
}

await writeFile(SALIDA, partes.join('\n'), 'utf8')
console.log(`\n${partes.length} fuentes en piezas/fuentes.css`)
