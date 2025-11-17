/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta de colores personalizada UNACH
        unach: {
          blue: '#002F6C',    // Azul Institucional (Ajusta este HEX si es necesario)
          red: '#E31B23',     // Rojo Institucional
          gold: '#D4AF37',    // Dorado para detalles (opcional)
          light: '#F9FAFB',   // Fondo muy claro
          dark: '#111827',    // Texto oscuro
        }
      },
      backgroundImage: {
        'unach-gradient': 'linear-gradient(135deg, #002F6C 0%, #E31B23 100%)',
      }
    },
  },
  plugins: [],
}