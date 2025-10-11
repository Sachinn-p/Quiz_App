# Quiz App - React Frontend

This is the React + Vite frontend for the Interactive Quiz Application.

## Features

- **Quiz Setup**: Choose topic, number of questions, and difficulty level
- **Interactive Quiz**: Answer multiple-choice questions with real-time feedback
- **Results Display**: View your score and correct answers
- **Responsive Design**: Built with Tailwind CSS for mobile-friendly experience

## Tech Stack

- **React 18** - Frontend framework
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client (included but fetch API is used)
- **ESLint** - Code linting

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend-react directory:
   ```bash
   cd frontend-react
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Backend Connection

The frontend connects to the FastAPI backend running on `http://127.0.0.1:8000`. Make sure the backend server is running before using the app.

## Project Structure

```
frontend-react/
├── public/
│   ├── vite.svg
│   └── index.html
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles with Tailwind
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## API Endpoints Used

- `POST /generate-quiz` - Generate a new quiz
- `POST /submit-quiz` - Submit quiz answers and get results

## Converting from Svelte

This React version maintains the same functionality as the original Svelte application:

- Same UI/UX design using Tailwind CSS
- Identical API communication
- Same state management patterns (adapted for React hooks)
- Same responsive design and user flow