/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAF7F2',
        surface: '#FFFFFF',
        'surface-2': '#F3EDE3',
        primary: {
          DEFAULT: '#7D5A3C',
          dark: '#5C4128',
          soft: '#EFE4D8',
        },
        accent: '#B07D56',
        gold: '#C2A36B',
        ink: {
          DEFAULT: '#2A2420',
          2: '#5A524A',
        },
        muted: '#6E655B',
        line: '#E8E0D5',
        success: '#3F8F5B',
        danger: '#C0492F',
        // 产品系列语义渐变（用于封面/缩略图背景）
        series: {
          hutaoli: 'linear-gradient(135deg,#7D5A3C,#5C4128)',
          ruyichun: 'linear-gradient(135deg,#B08A5E,#8B5E3C)',
          xiyue: 'linear-gradient(135deg,#A8554E,#7E3B36)',
          baiyue: 'linear-gradient(135deg,#4A4A4A,#2A2A2A)',
          lanbaojia: 'linear-gradient(135deg,#3F5E8F,#2B426B)',
          office: 'linear-gradient(135deg,#5B7C7A,#3F5A58)',
          soft: 'linear-gradient(135deg,#C2855B,#9A663E)',
        },
      },
      fontFamily: {
        serif: ['"Songti SC"', '"STSong"', '"SimSun"', 'Georgia', '"Noto Serif SC"', 'serif'],
        sans: ['"PingFang SC"', '"Microsoft YaHei"', '"Hiragino Sans GB"', 'Arial', 'sans-serif'],
      },
      fontSize: {
        // 前台标题字号阶梯
        h1: ['46px', { lineHeight: '1.2', fontWeight: '600' }],
        h2: ['32px', { lineHeight: '1.3', fontWeight: '600' }],
        h3: ['22px', { lineHeight: '1.35', fontWeight: '600' }],
        h4: ['18px', { lineHeight: '1.4', fontWeight: '600' }],
      },
      borderRadius: {
        card: '12px',
        control: '8px',
      },
      boxShadow: {
        soft: '0 6px 24px rgba(92,65,40,.08)',
        lg: '0 16px 48px rgba(92,65,40,.14)',
      },
      maxWidth: {
        wrap: '1200px',
      },
    },
  },
  plugins: [],
}
