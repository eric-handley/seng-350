import { context } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join, extname } from 'node:path'
import { createServer } from 'node:http'
import { readFileSync, statSync } from 'node:fs'

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
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.API_BASE': JSON.stringify(API_BASE), // <— add this line
  },
})

await ctx.watch()

// Create a custom server that handles SPA routing

const publicDir = resolve(__dirname, 'public')
const indexPath = join(publicDir, 'index.html')

const server = createServer((req, res) => {
  let filePath = join(publicDir, req.url === '/' ? 'index.html' : req.url)
  
  // Check if file exists
  try {
    const stats = statSync(filePath)
    if (stats.isFile()) {
      // File exists, serve it
      const ext = extname(filePath)
      const contentType = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.ico': 'image/x-icon'
      }[ext] || 'text/plain'
      
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(readFileSync(filePath))
      return
    }
  } catch (err) {
    // File doesn't exist, serve index.html for SPA routing
  }
  
  // Serve index.html for all non-file routes
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(readFileSync(indexPath))
})

const boundPort = port
server.listen(boundPort, '0.0.0.0')

console.log(`esbuild dev server on http://localhost:${boundPort}`)
