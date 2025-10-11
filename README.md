# LLM Quiz App 🧠

An interactive quiz application that generates dynamic quizzes on any topic using Large Language Models (LLM). Built with React frontend and FastAPI backend, powered by Groq AI.

## 🌟 Features

- **Dynamic Quiz Generation**: Create quizzes on any topic using AI
- **Customizable Difficulty**: Choose from Easy, Intermediate, or Hard levels
- **Flexible Question Count**: Generate 1-10 questions per quiz
- **Interactive UI**: Clean, responsive design with real-time feedback
- **Session Management**: Secure quiz sessions with unique tokens
- **Instant Results**: Get detailed feedback and scoring
- **Multiple Choice Format**: Standard A, B, C, D format for consistency

## 🚀 Tech Stack

### Frontend
- **React** - Modern JavaScript library for building user interfaces
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Axios** - HTTP client for API requests

### Backend
- **FastAPI** - Modern Python web framework for building APIs
- **Groq** - High-performance LLM inference API
- **Uvicorn** - ASGI server for FastAPI
- **Python-dotenv** - Environment variable management

## 📁 Project Structure

```
LLM_Quiz_App/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── App.jsx          # Main application component
│   │   ├── main.jsx         # React entry point
│   │   └── index.css        # Global styles
│   ├── public/              # Static assets
│   ├── package.json         # Node.js dependencies
│   └── vite.config.js       # Vite configuration
├── backend/                  # FastAPI backend application
│   ├── main.py              # Main API server
│   └── requirements.txt     # Python dependencies
├── LICENSE                  # Project license
└── README.md               # Project documentation
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- Groq API Key ([Get one here](https://console.groq.com/))

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create environment file**
   ```bash
   touch .env
   ```

5. **Configure environment variables**
   Add the following to your `.env` file:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   MODEL=llama3-8b-8192
   ORIGIN=http://localhost:5173
   ```

6. **Start the server**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   touch .env
   ```

4. **Configure environment variables**
   Add the following to your `.env` file:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🎯 Usage

1. **Access the application** at `http://localhost:5173`
2. **Enter a topic** (e.g., "JavaScript", "World History", "Biology")
3. **Select difficulty level** (Easy, Intermediate, Hard)
4. **Choose number of questions** (1-10)
5. **Click "Generate Quiz"** to create your custom quiz
6. **Answer the questions** by selecting the appropriate options
7. **Submit your answers** to see results and correct answers
8. **Start a new quiz** with different parameters

## 🔧 API Endpoints

### POST `/generate-quiz`
Generate a new quiz based on specified parameters.

**Request Body:**
```json
{
  "domain": "JavaScript",
  "num_questions": 5,
  "difficulty": "Intermediate"
}
```

**Response:**
```json
{
  "session_token": "uuid-string",
  "questions": [...],
  "num_questions": 5
}
```

### POST `/submit-quiz`
Submit quiz answers and get results.

**Headers:**
- `x-session-token`: Session token from quiz generation

**Request Body:**
```json
{
  "answers": {
    "1": "A",
    "2": "B",
    "3": "C"
  }
}
```

**Response:**
```json
{
  "score": 2,
  "results": {...},
  "total_questions": 3
}
```

## 🧪 Development

### Running Tests
```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm test
```

### Building for Production
```bash
# Frontend build
cd frontend
npm run build

# Backend deployment
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 🌐 Deployment

### Docker Deployment (Recommended)

1. **Create Dockerfile for backend:**
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY . .
   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

2. **Create Dockerfile for frontend:**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   FROM nginx:alpine
   COPY --from=0 /app/dist /usr/share/nginx/html
   ```

### Environment Variables for Production
- Update `ORIGIN` to your frontend domain
- Update `VITE_API_URL` to your backend domain
- Ensure GROQ_API_KEY is securely configured

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Groq](https://groq.com/) for providing high-performance LLM inference
- [FastAPI](https://fastapi.tiangolo.com/) for the excellent Python web framework
- [React](https://reactjs.org/) for the powerful frontend library
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first styling approach

## 📞 Support

If you have any questions or run into issues, please open an issue on GitHub or contact the maintainer.

---

**Built with ❤️ by [Sachinn-p](https://github.com/Sachinn-p)**
