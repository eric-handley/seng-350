import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { cp } from 'node:fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const API_BASE = process.env.API_BASE || 'http://localhost:3000'

await build({
  entryPoints: [resolve(__dirname, 'src/main.tsx')],
  bundle: true,
  sourcemap: false,
  outdir: resolve(__dirname, 'dist/build'),
  platform: 'browser',
  loader: { '.tsx': 'tsx' },
  resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs', '.json'],
  jsx: 'automatic',
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.API_BASE': JSON.stringify(API_BASE),
  },
  minify: true,
})

await cp(resolve(__dirname, 'public'), resolve(__dirname, 'dist'), { recursive: true })
console.log('Built to ./dist')
