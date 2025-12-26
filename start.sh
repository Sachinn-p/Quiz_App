#!/bin/bash

# Quiz App Startup Script
echo "🎯 Starting Quiz Application..."

# Check if backend .env file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env file not found. Please create one with your GROQ_API_KEY"
    echo "   You can copy from .env.example: cp .env.example backend/.env"
    echo "   Then edit backend/.env and add your GROQ_API_KEY"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install backend dependencies
echo "📥 Installing backend dependencies..."
pip install -r requirements.txt

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "📊 Starting MongoDB..."
    sudo systemctl start mongod || echo "⚠️  Please start MongoDB manually"
fi

# Start backend in background
echo "🚀 Starting backend server..."
cd backend
/home/sachinn-p/Codes/Quiz_App/venv/bin/python main.py &
BACKEND_PID=$!

# Navigate to frontend
cd ../frontend

# Install frontend dependencies
echo "📥 Installing frontend dependencies..."
npm install

# Start frontend
echo "🎨 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Quiz Application is starting up!"
echo "📡 Backend: http://127.0.0.1:8000"
echo "🎨 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for interrupt
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
