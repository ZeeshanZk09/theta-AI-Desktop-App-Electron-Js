/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/**/*.{ts,tsx}',
    './index.html',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // --- PREMIMUM JARVIS SCI-FI PALETTE ---
        'j-void': '#020406',       // Deeper, purer black for background
        'j-panel': '#0A1218',      // Slightly lighter for panels
        'j-surface': '#111D25',    // For card-like surfaces
        'j-steel': '#1E2D38',      // Muted tech blue/gray

        // Accents
        'j-cyan': '#00E5FF',       // Sharp Electric Cyan
        'j-cyan-dim': 'rgba(0, 229, 255, 0.1)',
        'j-blue': '#0085FF',       // Premium Deep Blue
        'j-neon': '#0066FF',       // Navigation/Active states

        // Data & Alerts
        'j-hologram': '#00FFA3',   // Clean Data Green
        'j-amber': '#FFC700',      // Warning/Init
        'j-crimson': '#FF2E2E',    // Critical/Alert

        // Typography
        'j-text-primary': '#E1F8FF',   // Near-white blue tint
        'j-text-secondary': '#8BA7B0', // Readable muted teal
        'j-text-muted': '#4B636B',     // Low priority text

        // Legacy Support (Mapped to new palette)
        'deep-space': '#020406',
        'glass-surface': 'rgba(10, 18, 24, 0.7)',
        'arc-blue': '#00E5FF',

        'system-grey': '#1E2A33',
        'off-white': '#E6EDF3',
        'muted-steel': '#9AA4AF',
        'offline-red': '#C0392B',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'SF Pro Display', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'], // Tech feel
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(0, 194, 255, 0.3)',
        'glow-teal': '0 0 15px rgba(47, 164, 184, 0.3)',
        'panel': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'scanline': 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2))',
        'hex-grid': 'radial-gradient(circle, #1E2A33 1px, transparent 1px)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
        'scan': 'scan 4s linear infinite',
        'loading-bar': 'loading-bar 2s ease-in-out infinite',
        'data-flow': 'data-flow 2s linear infinite',
        'data-flow-reverse': 'data-flow 2s linear infinite reverse',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scan: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100%' },
        },
        'loading-bar': {
          '0%': { width: '0%', marginLeft: '0%' },
          '50%': { width: '50%', marginLeft: '25%' },
          '100%': { width: '0%', marginLeft: '100%' },
        },
        'data-flow': {
          '0%': { strokeDashoffset: '48' },
          '100%': { strokeDashoffset: '0' }
        }
      }
    },
  },
  plugins: [],
}
