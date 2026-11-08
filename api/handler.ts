import type { IncomingMessage, ServerResponse } from 'node:http'
import { nodeHandler } from '../server/node.js'

// Every /api/* request is rewritten here (vercel.json) with the original path in ?__path=.
export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://local')
  const path = url.searchParams.get('__path') ?? url.pathname.replace(/^\/api\/?/, '')
  await nodeHandler(req, res, path)
}
