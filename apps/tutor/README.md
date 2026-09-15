# AI Tutor Application

An intelligent learning companion that teaches you step-by-step with personalized content, interactive visualizations, and smart resource generation.

## 🚀 Features

- **Interactive Teaching**: 3-panel layout with Unified Chat, Classroom Board, and Studio
- **Classroom Experience**: Realistic chalkboard visuals, animated diagrams, and teacher-style layout
- **Voice Narration**: Text-to-Speech (TTS) with Web Speech API and visual speaking indicators
- **Studio Tools**: Quiz, Notes, Mind Maps, and Flashcards generation
- **Resource Generation**: Notes, Mind Maps, and Flashcards with spaced repetition
- **Analytics Dashboard**: Track learning hours, streaks, quiz scores, and achievements
- **Badges & Achievements**: Visual badge system with "Quick Access" dashboard panel
- **Mobile Responsive**: Works on all devices with adaptive layouts
- **Performance Optimized**: Code-splitting with lazy loading

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State**: Zustand with persistence
- **Animations**: Framer Motion
- **i18n**: react-i18next

## 📦 Installation

```bash
npm install
```

## 🔧 Development

```bash
npm run dev
```

Open http://localhost:3000

## 🏗 Production Build

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/
│   ├── common/       # Reusable UI (PageTransition, Skeleton, ErrorBoundary)
│   ├── studio/       # Resource viewers (Notes, MindMap, Flashcards)
│   └── teaching/     # DoubtPanel, VerificationQuiz
├── pages/            # Route components
├── stores/           # Zustand stores
├── types/            # TypeScript definitions
└── i18n.ts           # Internationalization
```

## 📱 Pages

| Page | Description |
|------|-------------|
| `/` | Redirects to landing `/login` or role home |
| `/login` | Redirects to landing login (canonical) |
| `/dev/demo-roles` | Dev/admin demo role switcher |
| `/onboarding` | Profession selection |
| `/dashboard` | Learning hub with analytics |
| `/learn/:topic` | Teaching interface |
| `/settings` | Preferences and configuration |
| `/profile` | User profile and achievements |

## 🚀 Deployment

This project is configured for **Firebase Hosting**.

### Deploying Updates
1. `npm run build`
2. `firebase deploy`

The application will be available at: `https://project-aira-2d7f3.web.app`


## 📄 License

MIT
