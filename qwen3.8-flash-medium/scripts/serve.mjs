#!/usr/bin/env node
// Minimal dependency-free static file server for the game.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..')
const PORT = 8321

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

const server = createServer(async (req, res) => {
  let pathname = '/'
  try {
    pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)
  } catch {
    res.writeHead(400).end('Bad request')
    return
  }
  if (pathname === '/') pathname = '/index.html'

  const file = resolve(ROOT, pathname.replace(/^\/+/, ''))
  if (file !== ROOT && !file.startsWith(ROOT + sep)) {
    res.writeHead(403).end('Forbidden')
    return
  }

  try {
    const body = await readFile(file)
    const type = MIME_TYPES[extname(file)] ?? 'application/octet-stream'
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' }).end(body)
  } catch {
    res.writeHead(404).end('Not found')
  }
})

server.listen(PORT, () => {
  console.log(`Tetris running at http://localhost:${PORT}`)
})
