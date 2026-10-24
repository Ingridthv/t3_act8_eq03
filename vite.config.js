import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// IMPORTANTE: cambia XX por el número de tu equipo (por ejemplo t3_act8_eq05).
// Debe coincidir con la carpeta donde subes el build en el VPS.
export default defineConfig({
  plugins: [react()],
  base: '/t3_act8_eq03/',
});
