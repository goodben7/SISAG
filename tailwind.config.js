/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Open Sans", "system-ui", "ui-sans-serif", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans", "sans-serif"],
        display: ["Montserrat", "system-ui", "ui-sans-serif", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans", "sans-serif"]
      },
      colors: {
        rdcBlue: '#0072C6',
        rdcBlueDark: '#005EB8',
        rdcBlueLight: '#E6F2FF',
        rdcGreen: '#008000',
        rdcGreenDark: '#1B5E20',
        rdcGreenLight: '#E8F5E9',
        rdcRed: '#DC143C',
        rdcRedDark: '#B71C1C',
        rdcRedLight: '#FFEBEE',
        rdcYellow: '#FFD700',
        rdcYellowLight: '#FFF9C4',
        rdcGrayBg: '#F9FAFB',
        rdcGrayBorder: '#E5E7EB',
        rdcGrayText: '#4B5563',
        rdcTextPrimary: '#333333'
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0, 0, 0, 0.1)'
      },
      borderRadius: {
        xl: '12px'
      }
    },
  },
  plugins: [],
};
