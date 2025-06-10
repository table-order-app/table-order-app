import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'
import { menuRoutes } from './routes/menu'
import { orderRoutes } from './routes/order'
import { tableRoutes } from './routes/table'
import { staffRoutes } from './routes/staff'
import { settingRoutes } from './routes/setting'
import { storeRoutes } from './routes/store'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors())
app.use('*', prettyJSON())

// Routes
app.route('/api/store', storeRoutes)
app.route('/api/menu', menuRoutes)
app.route('/api/order', orderRoutes)
app.route('/api/table', tableRoutes)
app.route('/api/staff', staffRoutes)
app.route('/api/setting', settingRoutes)

// Health check
app.get('/', (c) => c.json({ status: 'ok', message: 'Accorto API Server' }))

// Start server
const port = process.env.PORT || 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port: Number(port)
})
