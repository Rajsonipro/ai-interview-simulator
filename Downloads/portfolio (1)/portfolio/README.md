[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-blueviolet?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5-black?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-orange?style=for-the-badge&logo=framer)](https://framer.com/motion/)

# Raj Soni Portfolio 

> A cutting-edge personal portfolio engineered with React 18, Tailwind CSS, and Framer Motion. Featuring glassmorphism aesthetics, scroll-driven animations, and production-grade performance optimizations.

---

## 🌐 Live Preview

<div align="center">
  <a href="https://rajsoni-portfolio.netlify.app">
    <img src="https://via.placeholder.com/800x400/0f172a/00f5ff.png?text=Live+Demo" alt="Live Demo" width="800"/>
  </a>
</div>

<div align="center">
  <strong>
    👉 <a href="https://rajsoni-portfolio.netlify.app">View Live</a> 
    | 
    <a href="https://github.com/rajsonidev/portfolio">Source Code</a>
  </strong>
</div>

---

## ✨ Core Features

✅ **Glassmorphism Design System** - Custom CSS variables with backdrop-blur effects and neon gradients  
✅ **Advanced Animations** - Framer Motion powered scroll reveals, hover interactions, stagger effects  
✅ **Component-Driven Architecture** - Modular, reusable React components with TypeScript-ready patterns  
✅ **Interactive UX** - Expandable education timelines, project modals, contact form with validation  
✅ **Zero Runtime JS** - Vite-powered builds with optimized Tailwind purging (95+ Lighthouse scores)  
✅ **Progressive Enhancement** - Accessible by default, mobile-first responsive breakpoints  
✅ **Developer Experience** - Hot reload, linting, formatting, tree-shaking optimization  

---

## 🛠 Technology Stack

### Frontend
```
React 18.2+    Vite 5+     Tailwind CSS 3.4
Framer Motion  Lucide Icons clsx
```

### Build Tools & DevOps
```
PostCSS    Autoprefixer   ESLint    Prettier
Vite       Headless UI    Glassmorphism
```

### Performance & Quality
```
95+ Lighthouse Score   Bundle < 100kb gzipped
Zero Config Deployment  Mobile-First Responsive
```

---

## 🚀 Getting Started

### Prerequisites

```bash
Node.js >= 18.0.0
npm >= 9.0.0  # or yarn/pnpm
Git
```

### Installation

```bash
# Clone the repository
git clone https://github.com/rajsonidev/portfolio.git
cd portfolio

# Install dependencies
npm ci

# Start development server
npm run dev
```

**Available at**: `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 📁 Project Architecture

```
portfolio/
├── public/                 # Static assets & favicon
├── src/
│   ├── components/         # Feature components
│   │   ├── Hero/           # Hero section w/ particles
│   │   ├── Navbar.jsx
│   │   ├── Education.jsx   # 🎓 Academic timeline
│   │   ├── Projects.jsx    # 💼 Project showcase
│   │   ├── Experience.jsx  # 💼 Work history
│   │   └── Contact.jsx     # 📧 Contact form
│   ├── styles/             # Global CSS & utilities
│   ├── App.jsx             # Root layout
│   └── main.jsx            # Entry point
├── tailwind.config.js      # Design system tokens
├── vite.config.js          # Build configuration
└── package.json            # Dependencies & scripts
```

---

## ☁️ Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel --prod
```

**Auto-detected settings:**
```
Framework: Vite
Build: npm run build
Output: dist/
```

### Netlify Drag & Drop

1. Build: `npm run build`
2. Drag `dist/` folder to Netlify dashboard

### Railway / Render / Others

```
Build Command: npm run build
Publish Directory: dist
Install Command: npm ci
```

---

## ⚙️ Customization Guide

### 1. Color Theme (`tailwind.config.js`)

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        'neon-cyan': '#00f5ff',
        'neon-purple': '#c084fc',
        'glass': 'rgba(255,255,255,0.05)',
      }
    }
  }
}
```

### 2. Add Projects (`src/components/Projects.jsx`)

```jsx
const PROJECTS = [
  {
    title: 'Project Name',
    description: 'Brief description...',
    technologies: ['React', 'Node.js'],
    demo: 'https://demo-link.com',
    source: 'https://github.com/...',
    image: '/projects/project1.png'
  }
]
```

### 3. Update Personal Info (`src/components/Hero.jsx`)

```jsx
const PROFILE = {
  name: 'Raj Soni',
  title: 'Full Stack Developer',
  email: 'hello@rajsoni.dev',
  linkedin: 'linkedin.com/in/rajsoni',
  github: 'github.com/rajsonidev'
}
```

---

## 🔧 Available NPM Scripts

| Script | Description |
|--------|-------------|
| `dev` | Development server with HMR |
| `build` | Production build (dist/) |
| `preview` | Local production preview |
| `lint` | ESLint code quality check |
| `format` | Prettier code formatting |

```bash
npm run dev
```

---

## 🤝 Contributing

We ❤️ contributions!

### Development Workflow

```bash
# Setup
git clone https://github.com/rajsonidev/portfolio.git
npm ci

# Development
npm run dev

# Commit convention
git commit -m "feat: add new project showcase"
```

**Guidelines:**
1. Follow existing code style (Prettier/ESLint)
2. Write descriptive commit messages
3. Add tests for new features
4. Update README with new sections

---

## 📄 License

This project is [MIT](LICENSE) licensed.

```
Copyright (c) 2024 Raj Soni

Permission is hereby granted... (see LICENSE)
```

---

## 👨‍💻 Author & Contact

**Raj Soni**  
*Full Stack Developer & UI/UX Engineer*

<div align="center">

[![Portfolio](https://img.shields.io/badge/Portfolio-Visit%20Site-00f5ff?style=for-the-badge&logo=netlify)](https://rajsoni-portfolio.netlify.app)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/rajsoni)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github)](https://github.com/rajsonidev)
[![Email](https://img.shields.io/badge/Email-Contact%20Me-ff6b6b?style=for-the-badge&logo=gmail)](mailto:hello@rajsoni.dev)

</div>

---

<div align="center">

**Built with ❤️ using modern web technologies**

[![Stars](https://img.shields.io/github/stars/rajsonidev/portfolio?style=social)](https://github.com/rajsonidev/portfolio/stargazers/)
[![Forks](https://img.shields.io/github/forks/rajsonidev/portfolio?style=social)](https://github.com/rajsonidev/portfolio/network/)
[![License](https://img.shields.io/github/license/rajsonidev/portfolio)](LICENSE)

</div>


