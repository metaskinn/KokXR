import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** Serves /api/* from server/ during `npm run dev`, the same code the Vercel function (api/handler.ts) runs. */
function api(): Plugin {
  return {
    name: 'kokxr-api',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res) => {
        const { nodeHandler } = await server.ssrLoadModule('/server/node.ts')
        const path = new URL(req.url ?? '/', 'http://local').pathname.replace(/^\/+/, '')
        await nodeHandler(req, res, path)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Server-side secrets (.env.local: DATABASE_URL, ADMIN_PASSWORD, ...) reach the dev API only, never the browser bundle.
  for (const [k, v] of Object.entries(loadEnv(mode, process.cwd(), ''))) process.env[k] ??= v
  return { plugins: [react(), api()] }
})
