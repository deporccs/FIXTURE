import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Ajustado al nombre real de tu repositorio para evitar el error 404
  base: '/gestor_torneo/',
})