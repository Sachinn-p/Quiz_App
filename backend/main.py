import os
import re
import uuid
import traceback
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Dict, List

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("ORIGIN")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Groq client
groq_api_key = os.environ.get("GROQ_API_KEY")
if not groq_api_key:
    raise ValueError("GROQ_API_KEY is missing from environment variables")
client = Groq(api_key=groq_api_key)

# Models
class QuizGenerationRequest(BaseModel):
    domain: str
    num_questions: int
    difficulty: str

class QuizSubmissionRequest(BaseModel):
    answers: Dict[str, str]  # keyed by question number

class QuizQuestion(BaseModel):
    question: str
    options: Dict[str, str]
    correct_option: str

# In-memory storage of quizzes keyed by session token
quizzes_storage: Dict[str, List[QuizQuestion]] = {}

# Generate quiz prompt
def generate_quiz_prompt(domain: str, num_questions: int, difficulty: str) -> str:
    return (
        f"Generate {num_questions} multiple-choice questions in the domain of {domain} "
        f"with difficulty {difficulty} (easy, intermediate, hard). "
        "Each question should have 4 options: A, B, C, D. "
        "Include the correct option labeled as 'Correct_option: [A/B/C/D]'. "
        "Do not include extra explanations or code blocks. "
        "Example format:\n\n"
        "1. Question: [text]\n"
        "   A) Option A\n"
        "   B) Option B\n"
        "   C) Option C\n"
        "   D) Option D\n"
        "   Correct_option: B\n\n"
        "Continue similarly for all questions."
    )

# Robust parser
def parse_questions(text: str) -> List[QuizQuestion]:
    # Remove code blocks or backticks
    text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    text = text.strip()
    questions = []

    # Split based on numbering (flexible)
    raw_questions = re.split(r"\n\d+\.\s*Question:?", text)
    for rq in raw_questions:
        if not rq.strip():
            continue

        # Extract question text
        match_q = re.search(r"(.*?)(?:\n\s*A\))", rq, re.DOTALL)
        question_text = match_q.group(1).strip() if match_q else None
        if not question_text:
            continue

        # Extract options
        options = {}
        for letter in ['A', 'B', 'C', 'D']:
            match_o = re.search(rf"{letter}\)\s*(.*)", rq)
            if match_o:
                options[letter] = match_o.group(1).strip()

        # Extract correct option
        match_c = re.search(r"Correct_option:\s*([A-D])", rq)
        correct_option = match_c.group(1).strip() if match_c else None

        if question_text and len(options) == 4 and correct_option in options:
            questions.append(QuizQuestion(
                question=question_text,
                options=options,
                correct_option=correct_option
            ))

    return questions

# Generate quiz
@app.post("/generate-quiz")
async def generate_quiz(request: QuizGenerationRequest):
    try:
        prompt = generate_quiz_prompt(request.domain, request.num_questions, request.difficulty)

        # Groq API call
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=os.getenv("MODEL")
        )

        if not chat_completion or not chat_completion.choices or not chat_completion.choices[0].message.content:
            raise HTTPException(status_code=500, detail="Invalid response from Groq API")

        questions_text = chat_completion.choices[0].message.content
        questions = parse_questions(questions_text)

        if not questions:
            raise HTTPException(status_code=500, detail="Could not parse any questions from Groq response")

        # Generate session token
        session_token = str(uuid.uuid4())
        quizzes_storage[session_token] = questions

        return {
            "session_token": session_token,
            "questions": questions,
            "num_questions": len(questions)
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {repr(e)}")

# Submit quiz
@app.post("/submit-quiz")
async def submit_quiz(request: QuizSubmissionRequest, x_session_token: str = Header(...)):
    try:
        if x_session_token not in quizzes_storage:
            raise HTTPException(status_code=400, detail="Invalid or expired session token")

        questions = quizzes_storage[x_session_token]
        answers = request.answers
        score = 0
        results = {}

        # Iterate over stored questions
        for idx, q in enumerate(questions):
            q_num = str(idx + 1)
            user_answer = answers.get(q_num)
            if not user_answer:
                results[q_num] = "No answer provided"
                continue

            if user_answer.upper() == q.correct_option:
                score += 1
                results[q_num] = "Correct"
            else:
                results[q_num] = {"Status": "Incorrect", "Correct Answer": q.correct_option}

        # Delete session to prevent reuse
        del quizzes_storage[x_session_token]

        return {"score": score, "results": results, "total_questions": len(questions)}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to submit quiz: {repr(e)}")
