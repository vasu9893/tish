#!/usr/bin/env node

const axios = require('axios')
const { io } = require('socket.io-client')

function parseArgs() {
  const args = process.argv.slice(2)
  const result = {}
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if ((a === '--backend' || a === '-b') && args[i + 1]) result.backend = args[++i]
    else if ((a === '--frontend' || a === '-f') && args[i + 1]) result.frontend = args[++i]
    else if ((a === '--token' || a === '-t') && args[i + 1]) result.token = args[++i]
    else if (a === '--help' || a === '-h') result.help = true
  }
  return result
}

function printUsage() {
  console.log('Usage: node scripts/healthcheck.js --backend <BACKEND_URL> [--frontend <FRONTEND_URL>] [--token <JWT>]')
}

function format(label, ok, extra = '') {
  const status = ok ? 'PASS' : 'FAIL'
  return `${status}  ${label}${extra ? ' - ' + extra : ''}`
}

async function testBackendHealth(backend) {
  const url = `${backend.replace(/\/$/, '')}/webhook/test`
  try {
    const { data, status, headers } = await axios.get(url, { timeout: 10000 })
    const ok = status === 200 && data && data.success === true
    return { ok, details: `status=${status}` }
  } catch (e) {
    return { ok: false, details: e.message }
  }
}

async function testInstagramStatus(backend, token) {
  const url = `${backend.replace(/\/$/, '')}/api/instagram/status`
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const res = await axios.get(url, { headers, validateStatus: () => true, timeout: 10000 })
    // Accept 200 with success, or 401/403 when token missing
    const ok = (res.status === 200 && res.data && res.data.success === true) || (!token && (res.status === 401 || res.status === 403))
    return { ok, details: `status=${res.status}` }
  } catch (e) {
    return { ok: false, details: e.message }
  }
}

async function testSocketIo(backend, token) {
  const base = backend.replace(/\/$/, '')
  const url = base
  return new Promise((resolve) => {
    const socket = io(url, {
      transports: ['polling'],
      path: '/socket.io',
      auth: token ? { token } : {},
      timeout: 10000,
    })

    let resolved = false
    const done = (ok, details) => {
      if (!resolved) {
        resolved = true
        try { socket.close() } catch {}
        resolve({ ok, details })
      }
    }

    socket.on('connect', () => done(true, `connected id=${socket.id}`))
    socket.on('connect_error', (err) => done(false, err && err.message ? err.message : 'connect_error'))

    setTimeout(() => done(false, 'timeout'), 12000)
  })
}

;(async () => {
  const args = parseArgs()
  if (args.help || !args.backend) {
    printUsage()
    process.exit(args.help ? 0 : 1)
  }

  const backend = args.backend
  const frontend = args.frontend
  const token = args.token

  console.log('InstantChat Healthcheck')
  console.log(`Backend:  ${backend}`)
  if (frontend) console.log(`Frontend: ${frontend}`)
  console.log(`Token:    ${token ? 'provided' : 'not provided'}`)
  console.log('')

  const results = []

  const health = await testBackendHealth(backend)
  console.log(format('Backend /webhook/test', health.ok, health.details))
  results.push(health.ok)

  const ig = await testInstagramStatus(backend, token)
  console.log(format('API /api/instagram/status', ig.ok, ig.details))
  results.push(ig.ok)

  const sio = await testSocketIo(backend, token)
  console.log(format('Socket.io connect', sio.ok, sio.details))
  results.push(sio.ok)

  const passed = results.filter(Boolean).length
  const total = results.length
  console.log('')
  console.log(`${passed}/${total} checks passed`)

  process.exit(passed === total ? 0 : 2)
})()
