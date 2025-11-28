# AskYourDB Frontend

React + TypeScript SPA for querying databases with natural language.

## Quick Start

```bash
npm install
npm run dev     # Start on http://localhost:3001
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Routing
- **Axios** - HTTP client

## Project Structure

```
src/
├── components/
│   ├── Header.tsx          # Top navigation
│   ├── Sidebar.tsx         # Side navigation
│   ├── QueryInput.tsx      # Query form
│   ├── ResultsDisplay.tsx  # Results view
│   ├── DataTable.tsx       # Data table
│   └── SettingsModal.tsx   # Settings panel
├── pages/
│   ├── HomePage.tsx        # Main query page
│   ├── LoginPage.tsx       # Authentication
│   └── HistoryPage.tsx     # Query history
├── store/
│   ├── authStore.ts        # Auth state
│   └── queryStore.ts       # Query state
├── services/
│   └── api.ts              # API client
└── App.tsx                 # Root component
```

## Features

- **Natural Language Input** - Ask questions in plain English
- **Streaming Responses** - Real-time AI-generated answers
- **Query History** - Track past queries
- **Dark Mode** - Auto-detects system preference
- **Responsive** - Works on desktop and mobile

## Configuration

The frontend connects to the backend at `http://localhost:4000` by default.

To change, update `vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': 'http://localhost:4000'
  }
}
```

## Building for Production

```bash
npm run build
```

Output is in `dist/` folder, ready for static hosting.

## Environment Variables

Create a `.env` file for custom configuration:

```env
VITE_API_URL=http://localhost:4000    # Backend URL
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
