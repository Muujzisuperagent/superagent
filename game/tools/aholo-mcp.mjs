// Aholo/Lux3D MCP 客户端（stdio）：正确的 MCP 时序
// initialize(id=1) -> notifications/initialized -> tools/call(id=3)
import { spawn } from 'node:child_process'

const MCP = 'C:/Users/lenovo/AppData/Roaming/npm/node_modules/@manycore/aholo-sdk-mcp'

export function call(tool, args, timeoutMs = 90000) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, ['dist/index.js'], {
      cwd: MCP, env: process.env, stdio: ['pipe', 'pipe', 'pipe']
    })
    let buf = '', done = false
    const finish = (v, e) => {
      if (done) return
      done = true
      try { p.kill() } catch {}
      e ? reject(e) : resolve(v)
    }
    p.stdout.on('data', (d) => {
      buf += d.toString()
      let i
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 1)
        if (!line.trim()) continue
        let j
        try { j = JSON.parse(line) } catch { continue }
        if (j.id === 1) {
          p.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')
          p.stdin.write(JSON.stringify({
            jsonrpc: '2.0', id: 3, method: 'tools/call',
            params: { name: tool, arguments: args }
          }) + '\n')
        } else if (j.id === 3) {
          if (j.error) return finish(null, new Error('RPC ' + JSON.stringify(j.error)))
          const txt = (j.result && (j.result.content || []).map(c => c.text || '').join('\n')) || JSON.stringify(j.result)
          return finish(txt)
        }
      }
    })
    p.stderr.on('data', (d) => {
      const s = d.toString().trim()
      if (s) console.log('  [mcp-err]', s.slice(0, 200))
    })
    p.stdin.write(JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'gen', version: '1' } }
    }) + '\n')
    setTimeout(() => finish(null, new Error('timeout ' + tool)), timeoutMs)
  })
}
