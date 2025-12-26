from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    SHORT_ANSWER = "short_answer"

class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class Question(BaseModel):
    id: Optional[str] = None
    text: str
    type: QuestionType
    options: Optional[List[str]] = None  # For multiple choice questions
    correct_answer: str
    explanation: Optional[str] = None
    difficulty: DifficultyLevel
    topic: str
    tags: Optional[List[str]] = None

class Quiz(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    questions: List[Question]
    created_by: str
    created_at: Optional[datetime] = None
    time_limit: Optional[int] = None  # in minutes
    is_public: bool = True
    difficulty: DifficultyLevel
    topic: str

class QuizSession(BaseModel):
    id: Optional[str] = None
    quiz_id: str
    user_id: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    score: Optional[float] = None
    answers: Dict[str, Any] = {}  # question_id -> answer
    time_taken: Optional[int] = None  # in seconds
    is_completed: bool = False

class Answer(BaseModel):
    question_id: str
    answer: str
    is_correct: Optional[bool] = None
    time_taken: Optional[int] = None  # in seconds

class UserProgress(BaseModel):
    id: Optional[str] = None
    username: str
    topic: str
    total_questions: int = 0
    correct_answers: int = 0
    wrong_answers: int = 0
    average_score: float = 0.0
    last_activity: datetime
    difficulty_progress: Dict[str, int] = {
        "easy": 0,
        "medium": 0,
        "hard": 0
    }
    strengths: List[str] = []
    weaknesses: List[str] = []

class QuestionGenerationRequest(BaseModel):
    topic: str
    difficulty: DifficultyLevel
    question_type: QuestionType
    count: int = 1
    user_progress: Optional[Dict] = None

class LiveQuizSession(BaseModel):
    id: Optional[str] = None
    quiz_id: str
    host_id: str
    participants: List[str] = []
    current_question: int = 0
    is_active: bool = True
    started_at: Optional[datetime] = None
    leaderboard: Dict[str, float] = {}
    room_code: str
