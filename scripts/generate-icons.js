// Script para generar iconos PWA
// Ejecutar con: node scripts/generate-icons.js

const fs = require('fs')
const path = require('path')

// Crear un PNG simple usando datos raw (sin dependencias externas)
// Este es un placeholder - para produccion usar herramientas como sharp o canvas

function createSimplePNG(size, outputPath) {
  // Crear un SVG y guardarlo como referencia
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#4f46e5"/>
  <text x="50" y="68" font-family="Arial, sans-serif" font-size="50" font-weight="bold" fill="white" text-anchor="middle">$</text>
</svg>`

  // Guardar como SVG (los navegadores modernos aceptan SVG como iconos)
  const svgPath = outputPath.replace('.png', '.svg')
  fs.writeFileSync(svgPath, svg)
  console.log(`Created: ${svgPath}`)
}

const publicDir = path.join(__dirname, '..', 'public')

// Generar iconos
createSimplePNG(192, path.join(publicDir, 'pwa-192x192.png'))
createSimplePNG(512, path.join(publicDir, 'pwa-512x512.png'))
createSimplePNG(180, path.join(publicDir, 'apple-touch-icon.png'))

console.log('\nIconos SVG generados. Para PNG real, usa una herramienta online como:')
console.log('https://realfavicongenerator.net/')
console.log('o instala sharp: npm install sharp')
