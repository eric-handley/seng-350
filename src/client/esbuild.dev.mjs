import { context } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const port = Number(process.env.PORT || 5173)

const ctx = await context({
  entryPoints: [resolve(__dirname, 'src/main.tsx')],
  bundle: true,
  sourcemap: true,
  outfile: resolve(__dirname, 'public/build/app.js'),
  platform: 'browser',
  loader: { '.tsx': 'tsx' },
  resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs', '.json'],
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': JSON.stringify('development') },
})

await ctx.watch()
const { host, port: boundPort } = await ctx.serve({
  servedir: resolve(__dirname, 'public'),
  host: '0.0.0.0',
  port,
})

console.log(`esbuild dev server on http://localhost:${boundPort}`)
