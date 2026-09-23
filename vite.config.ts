import { defineConfig, loadEnv } from 'vite'
import dotenv from 'dotenv'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'

const config = defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), '')
  const exampleEnvironment = dotenv.config({ path: '.env.example' }).parsed ?? {}
  Object.assign(process.env, exampleEnvironment, environment)

  return {
    resolve: { tsconfigPaths: true },
    plugins: [tanstackStart(), viteReact()],
  }
})

export default config
