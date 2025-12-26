from datetime import datetime
from typing import List, Dict, Any
import random
import string
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId

from models import (
    QuestionGenerationRequest, Quiz, Question, QuizSession, Answer, UserProgress, LiveQuizSession
)
from database import db
from services.llm_service import llm_service


app = FastAPI()

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_code: str):
        await websocket.accept()
        if room_code not in self.active_connections:
            self.active_connections[room_code] = []
        self.active_connections[room_code].append(websocket)

    def disconnect(self, websocket: WebSocket, room_code: str):
        if room_code in self.active_connections:
            self.active_connections[room_code].remove(websocket)
            if not self.active_connections[room_code]:
                del self.active_connections[room_code]

    async def broadcast_to_room(self, message: str, room_code: str):
        if room_code in self.active_connections:
            for connection in self.active_connections[room_code]:
                await connection.send_text(message)

manager = ConnectionManager()

# CORS settings
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_room_code() -> str:
    """Generate a random 6-character room code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

# Quiz Management APIs

@app.post("/quizzes", response_model=dict)
async def create_quiz(quiz: Quiz):
    """Create a new quiz"""
    quiz_dict = quiz.model_dump()
    quiz_dict["created_by"] = "anonymous"
    quiz_dict["created_at"] = datetime.utcnow()
    
    # Generate IDs for questions
    for i, question in enumerate(quiz_dict["questions"]):
        question["id"] = str(ObjectId())
    
    result = await db["quizzes"].insert_one(quiz_dict)
    quiz_dict["id"] = str(result.inserted_id)
    return {"message": "Quiz created successfully", "quiz_id": quiz_dict["id"]}

@app.get("/quizzes", response_model=List[dict])
async def get_quizzes(skip: int = 0, limit: int = 10, topic: str = None):
    """Get all public quizzes with optional topic filter"""
    query = {"is_public": True}
    if topic:
        query["topic"] = {"$regex": topic, "$options": "i"}
    
    cursor = db["quizzes"].find(query).skip(skip).limit(limit)
    quizzes = []
    async for quiz in cursor:
        quiz["id"] = str(quiz["_id"])
        del quiz["_id"]
        # Remove correct answers from questions for security
        for question in quiz["questions"]:
            question.pop("correct_answer", None)
        quizzes.append(quiz)
    
    return quizzes

@app.get("/quizzes/{quiz_id}", response_model=dict)
async def get_quiz(quiz_id: str, include_answers: bool = False):
    """Get a specific quiz by ID"""
    try:
        quiz = await db["quizzes"].find_one({"_id": ObjectId(quiz_id)})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        quiz["id"] = str(quiz["_id"])
        del quiz["_id"]
        
        # Only include correct answers if explicitly requested
        if not include_answers:
            for question in quiz["questions"]:
                question.pop("correct_answer", None)
        
        return quiz
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid quiz ID")

@app.post("/quizzes/generate", response_model=List[Question])
async def generate_questions(request: QuestionGenerationRequest):
    """Generate questions using Groq API"""
    try:
        
        
        # No user progress tracking without auth
        user_progress = None
        
        user_progress = None
        progress_data = None
        
        questions = await llm_service.generate_questions(
            topic=request.topic,
            difficulty=request.difficulty,
            question_type=request.question_type,
            count=request.count,
            user_progress=progress_data
        )
        
        return questions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")

# Quiz Session Management

@app.post("/quiz-sessions", response_model=dict)
async def start_quiz_session(quiz_id: str):
    """Start a new quiz session"""
    try:
        # Verify quiz exists
        quiz = await db["quizzes"].find_one({"_id": ObjectId(quiz_id)})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        session = QuizSession(
            quiz_id=quiz_id,
            user_id="anonymous",
            started_at=datetime.utcnow()
        )
        
        session_dict = session.model_dump()
        result = await db["quiz_sessions"].insert_one(session_dict)
        session_dict["id"] = str(result.inserted_id)
        
        return {"message": "Quiz session started", "session_id": session_dict["id"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid quiz ID")

@app.post("/quiz-sessions/{session_id}/answers")
async def submit_answer(session_id: str, answer: Answer):
    """Submit an answer for a quiz session"""
    try:
        # Get session
        session = await db["quiz_sessions"].find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Quiz session not found")
        
        # Get quiz to check correct answer
        quiz = await db["quizzes"].find_one({"_id": ObjectId(session["quiz_id"])})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        # Find the question and check if answer is correct
        correct_answer = None
        for question in quiz["questions"]:
            if question["id"] == answer.question_id:
                correct_answer = question["correct_answer"]
                break
        
        if correct_answer is None:
            raise HTTPException(status_code=404, detail="Question not found")
        
        is_correct = answer.answer.strip().lower() == correct_answer.strip().lower()
        
        # Update session with answer
        await db["quiz_sessions"].update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    f"answers.{answer.question_id}": {
                        "answer": answer.answer,
                        "is_correct": is_correct,
                        "time_taken": answer.time_taken
                    }
                }
            }
        )
        
        return {"is_correct": is_correct, "correct_answer": correct_answer}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/quiz-sessions/{session_id}/complete")
async def complete_quiz_session(session_id: str):
    """Complete a quiz session and calculate score"""
    try:
        session = await db["quiz_sessions"].find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Quiz session not found")
        
        # Calculate score
        answers = session.get("answers", {})
        correct_count = sum(1 for ans in answers.values() if ans.get("is_correct", False))
        total_questions = len(answers)
        score = (correct_count / total_questions * 100) if total_questions > 0 else 0
        
        # Update session
        completion_time = datetime.utcnow()
        time_taken = int((completion_time - session["started_at"]).total_seconds())
        
        await db["quiz_sessions"].update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "completed_at": completion_time,
                    "score": score,
                    "time_taken": time_taken,
                    "is_completed": True
                }
            }
        )
        
        # No user progress tracking without auth
        
        return {
            "score": score,
            "correct_answers": correct_count,
            "total_questions": total_questions,
            "time_taken": time_taken
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def update_user_progress(username: str, quiz_id: str, score: float, correct: int, wrong: int):
    """Update user progress based on quiz performance"""
    try:
        # Get quiz details
        quiz = await db["quizzes"].find_one({"_id": ObjectId(quiz_id)})
        if not quiz:
            return
        
        topic = quiz.get("topic", "General")
        difficulty = quiz.get("difficulty", "medium")
        
        # Get or create user progress
        progress = await db["user_progress"].find_one({
            "username": username,
            "topic": topic
        })
        
        if not progress:
            progress = {
                "username": username,
                "topic": topic,
                "total_questions": 0,
                "correct_answers": 0,
                "wrong_answers": 0,
                "average_score": 0.0,
                "last_activity": datetime.utcnow(),
                "difficulty_progress": {"easy": 0, "medium": 0, "hard": 0},
                "strengths": [],
                "weaknesses": []
            }
        
        # Update statistics
        progress["total_questions"] += correct + wrong
        progress["correct_answers"] += correct
        progress["wrong_answers"] += wrong
        progress["last_activity"] = datetime.utcnow()
        progress["difficulty_progress"][difficulty] += 1
        
        # Calculate new average score
        if progress["total_questions"] > 0:
            progress["average_score"] = (progress["correct_answers"] / progress["total_questions"]) * 100
        
        # Update strengths and weaknesses based on performance
        if score >= 80:
            if topic not in progress["strengths"]:
                progress["strengths"].append(topic)
            if topic in progress["weaknesses"]:
                progress["weaknesses"].remove(topic)
        elif score < 60:
            if topic not in progress["weaknesses"]:
                progress["weaknesses"].append(topic)
        
        # Upsert progress
        await db["user_progress"].update_one(
            {"username": username, "topic": topic},
            {"$set": progress},
            upsert=True
        )
    except Exception as e:
        print(f"Error updating user progress: {e}")



# Live Quiz Session Management

@app.post("/live-quiz", response_model=dict)
async def create_live_quiz(quiz_id: str):
    """Create a live quiz session that others can join"""
    try:
        # Verify quiz exists
        quiz = await db["quizzes"].find_one({"_id": ObjectId(quiz_id)})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        room_code = generate_room_code()
        
        live_session = LiveQuizSession(
            quiz_id=quiz_id,
            host_id="anonymous",
            room_code=room_code,
            started_at=datetime.utcnow()
        )
        
        session_dict = live_session.model_dump()
        result = await db["live_quiz_sessions"].insert_one(session_dict)
        session_dict["id"] = str(result.inserted_id)
        
        return {
            "message": "Live quiz created",
            "session_id": session_dict["id"],
            "room_code": room_code
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/live-quiz/{room_code}/join")
async def join_live_quiz(room_code: str, username: str = "anonymous"):
    """Join a live quiz session using room code"""
    session = await db["live_quiz_sessions"].find_one({"room_code": room_code, "is_active": True})
    if not session:
        raise HTTPException(status_code=404, detail="Live quiz session not found or inactive")
    
    # Add user to participants if not already joined
    if username not in session["participants"]:
        await db["live_quiz_sessions"].update_one(
            {"room_code": room_code},
            {
                "$push": {"participants": username},
                "$set": {f"leaderboard.{username}": 0}
            }
        )
    
    session["id"] = str(session["_id"])
    del session["_id"]
    return session


# WebSocket endpoint for real-time quiz sessions
@app.websocket("/ws/{room_code}")
async def websocket_endpoint(websocket: WebSocket, room_code: str):
    await manager.connect(websocket, room_code)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle real-time quiz events (answers, scoring, etc.)
            await manager.broadcast_to_room(f"Message from room {room_code}: {data}", room_code)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_code)
        await manager.broadcast_to_room(f"A participant left room {room_code}", room_code)



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app=app, host="127.0.0.1", port=8000)
