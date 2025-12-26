import os
import json
import asyncio
from typing import List, Dict, Any
from groq import Groq
from dotenv import load_dotenv
from models import Question, QuestionType, DifficultyLevel, UserProgress

# Load environment variables from backend directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

class LLMService:
    def __init__(self, model_name: str = "llama-3.1-70b-versatile"):
        self.model_name = model_name
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY environment variable is required")
        self.client = Groq(api_key=self.api_key)
    
    async def ensure_model_available(self):
        """Check if Groq API is accessible"""
        try:
            # Test API connection with a simple request
            response = self.client.chat.completions.create(
                messages=[{"role": "user", "content": "Hello"}],
                model=self.model_name,
                max_tokens=5
            )
            print(f"Groq API connection successful with model {self.model_name}")
        except Exception as e:
            print(f"Error connecting to Groq API: {e}")
            # Try alternative models
            alternative_models = ["llama-3.1-8b-instant", "gemma2-9b-it", "mixtral-8x7b-32768"]
            for alt_model in alternative_models:
                try:
                    self.model_name = alt_model
                    response = self.client.chat.completions.create(
                        messages=[{"role": "user", "content": "Hello"}],
                        model=self.model_name,
                        max_tokens=5
                    )
                    print(f"Successfully switched to model: {self.model_name}")
                    break
                except Exception as alt_e:
                    print(f"Failed with {alt_model}: {alt_e}")
                    continue
    
    async def generate_questions(
        self, 
        topic: str, 
        difficulty: DifficultyLevel, 
        question_type: QuestionType, 
        count: int = 1,
        user_progress: Dict = None
    ) -> List[Question]:
        """Generate questions using Groq API based on topic, difficulty, and user progress"""
        
        await self.ensure_model_available()
        
        # Build context based on user progress
        progress_context = ""
        if user_progress:
            strengths = user_progress.get('strengths', [])
            weaknesses = user_progress.get('weaknesses', [])
            if weaknesses:
                progress_context = f"Focus more on these weak areas: {', '.join(weaknesses)}. "
            if strengths:
                progress_context += f"User is strong in: {', '.join(strengths)}. "
        
        # Create appropriate prompt based on question type
        if question_type == QuestionType.MULTIPLE_CHOICE:
            prompt = self._create_mcq_prompt(topic, difficulty, count, progress_context)
        elif question_type == QuestionType.TRUE_FALSE:
            prompt = self._create_tf_prompt(topic, difficulty, count, progress_context)
        else:
            prompt = self._create_sa_prompt(topic, difficulty, count, progress_context)
        
        try:
            response = self.client.chat.completions.create(
                messages=[{
                    'role': 'user',
                    'content': prompt
                }],
                model=self.model_name,
                temperature=0.7,
                max_tokens=2000
            )
            
            questions_text = response.choices[0].message.content
            return self._parse_questions(questions_text, topic, difficulty, question_type)
            
        except Exception as e:
            print(f"Error generating questions: {e}")
            # Return fallback questions
            return self._get_fallback_questions(topic, difficulty, question_type, count)
    
    def _create_mcq_prompt(self, topic: str, difficulty: str, count: int, progress_context: str) -> str:
        return f"""
        {progress_context}
        Generate {count} multiple choice question(s) about {topic} at {difficulty} difficulty level.
        
        Format each question as JSON with this exact structure:
        {{
            "text": "Question text here?",
            "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
            "correct_answer": "A) Option 1",
            "explanation": "Brief explanation of why this is correct"
        }}
        
        Make sure:
        - Questions are at {difficulty} difficulty level
        - All options are plausible
        - Only one correct answer
        - Include clear explanations
        - Use proper JSON format
        
        Return only valid JSON array of questions.
        """
    
    def _create_tf_prompt(self, topic: str, difficulty: str, count: int, progress_context: str) -> str:
        return f"""
        {progress_context}
        Generate {count} true/false question(s) about {topic} at {difficulty} difficulty level.
        
        Format each question as JSON:
        {{
            "text": "Statement to evaluate as true or false",
            "correct_answer": "True",
            "explanation": "Explanation of why this is true/false"
        }}
        
        Return only valid JSON array of questions.
        """
    
    def _create_sa_prompt(self, topic: str, difficulty: str, count: int, progress_context: str) -> str:
        return f"""
        {progress_context}
        Generate {count} short answer question(s) about {topic} at {difficulty} difficulty level.
        
        Format each question as JSON:
        {{
            "text": "Question requiring a short answer?",
            "correct_answer": "Expected answer",
            "explanation": "Additional context or explanation"
        }}
        
        Return only valid JSON array of questions.
        """
    
    def _parse_questions(self, questions_text: str, topic: str, difficulty: DifficultyLevel, question_type: QuestionType) -> List[Question]:
        """Parse the LLM response into Question objects"""
        try:
            # Try to extract JSON from the response
            json_start = questions_text.find('[')
            json_end = questions_text.rfind(']') + 1
            
            if json_start != -1 and json_end != -1:
                json_str = questions_text[json_start:json_end]
            else:
                # If no array brackets, try to find individual JSON objects
                json_str = questions_text
            
            questions_data = json.loads(json_str)
            
            if not isinstance(questions_data, list):
                questions_data = [questions_data]
            
            questions = []
            for q_data in questions_data:
                question = Question(
                    text=q_data.get('text', ''),
                    type=question_type,
                    options=q_data.get('options'),
                    correct_answer=q_data.get('correct_answer', ''),
                    explanation=q_data.get('explanation', ''),
                    difficulty=difficulty,
                    topic=topic,
                    tags=[topic.lower()]
                )
                questions.append(question)
            
            return questions
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            return self._get_fallback_questions(topic, difficulty, question_type, 1)
        except Exception as e:
            print(f"Error parsing questions: {e}")
            return self._get_fallback_questions(topic, difficulty, question_type, 1)
    
    def _get_fallback_questions(self, topic: str, difficulty: DifficultyLevel, question_type: QuestionType, count: int) -> List[Question]:
        """Return fallback questions when LLM generation fails"""
        fallback_questions = []
        
        for i in range(count):
            if question_type == QuestionType.MULTIPLE_CHOICE:
                question = Question(
                    text=f"Sample {difficulty.value} question about {topic}?",
                    type=question_type,
                    options=["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
                    correct_answer="A) Option 1",
                    explanation="This is a fallback question generated when LLM service is unavailable.",
                    difficulty=difficulty,
                    topic=topic,
                    tags=[topic.lower(), "fallback"]
                )
            elif question_type == QuestionType.TRUE_FALSE:
                question = Question(
                    text=f"This is a true/false question about {topic}.",
                    type=question_type,
                    correct_answer="True",
                    explanation="This is a fallback question.",
                    difficulty=difficulty,
                    topic=topic,
                    tags=[topic.lower(), "fallback"]
                )
            else:
                question = Question(
                    text=f"What is a key concept in {topic}?",
                    type=question_type,
                    correct_answer=f"A fundamental concept in {topic}",
                    explanation="This is a fallback question.",
                    difficulty=difficulty,
                    topic=topic,
                    tags=[topic.lower(), "fallback"]
                )
            
            fallback_questions.append(question)
        
        return fallback_questions

    async def analyze_user_performance(self, user_progress: UserProgress) -> Dict[str, Any]:
        """Analyze user performance to provide insights for adaptive question generation"""
        
        await self.ensure_model_available()
        
        prompt = f"""
        Analyze this user's quiz performance and provide recommendations:
        
        Topic: {user_progress.topic}
        Total Questions: {user_progress.total_questions}
        Correct Answers: {user_progress.correct_answers}
        Wrong Answers: {user_progress.wrong_answers}
        Average Score: {user_progress.average_score}
        Difficulty Progress: {user_progress.difficulty_progress}
        Current Strengths: {user_progress.strengths}
        Current Weaknesses: {user_progress.weaknesses}
        
        Provide analysis in JSON format:
        {{
            "performance_level": "beginner/intermediate/advanced",
            "recommended_difficulty": "easy/medium/hard",
            "focus_areas": ["area1", "area2"],
            "next_topics": ["topic1", "topic2"],
            "study_suggestions": ["suggestion1", "suggestion2"]
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                messages=[{'role': 'user', 'content': prompt}],
                model=self.model_name,
                temperature=0.3,
                max_tokens=1000
            )
            
            analysis_text = response.choices[0].message.content
            
            # Parse JSON response
            json_start = analysis_text.find('{')
            json_end = analysis_text.rfind('}') + 1
            
            if json_start != -1 and json_end != -1:
                json_str = analysis_text[json_start:json_end]
                return json.loads(json_str)
            
        except Exception as e:
            print(f"Error analyzing user performance: {e}")
        
        # Fallback analysis
        accuracy = user_progress.correct_answers / max(user_progress.total_questions, 1)
        
        if accuracy >= 0.8:
            performance_level = "advanced"
            recommended_difficulty = "hard"
        elif accuracy >= 0.6:
            performance_level = "intermediate"
            recommended_difficulty = "medium"
        else:
            performance_level = "beginner"
            recommended_difficulty = "easy"
        
        return {
            "performance_level": performance_level,
            "recommended_difficulty": recommended_difficulty,
            "focus_areas": user_progress.weaknesses or [user_progress.topic],
            "next_topics": [user_progress.topic],
            "study_suggestions": [f"Practice more {recommended_difficulty} questions"]
        }

    async def evaluate_answers(self, questions: List[dict], user_answers: dict, username: str = None) -> dict:
        """Evaluate user answers and provide detailed feedback"""
        try:
            await self.ensure_model_available()
            
            # Prepare evaluation data
            evaluation_data = []
            correct_count = 0
            total_questions = len(questions)
            
            for i, question in enumerate(questions):
                question_id = str(i)
                user_answer = user_answers.get(question_id, "")
                correct_answer = question.get('correct_answer', '')
                
                is_correct = user_answer.lower().strip() == correct_answer.lower().strip()
                if is_correct:
                    correct_count += 1
                
                evaluation_data.append({
                    "question": question.get('text', ''),
                    "user_answer": user_answer,
                    "correct_answer": correct_answer,
                    "is_correct": is_correct,
                    "explanation": question.get('explanation', '')
                })
            
            # Calculate score
            score_percentage = (correct_count / total_questions) * 100 if total_questions > 0 else 0
            
            # Generate AI feedback
            feedback_prompt = f"""
            Analyze this quiz performance and provide helpful feedback:
            
            Score: {correct_count}/{total_questions} ({score_percentage:.1f}%)
            
            Questions and Answers:
            {json.dumps(evaluation_data, indent=2)}
            
            Provide:
            1. Overall performance summary
            2. Specific areas for improvement
            3. Strengths identified
            4. Study recommendations
            
            Keep the feedback encouraging and constructive.
            """
            
            try:
                response = self.client.chat.completions.create(
                    messages=[{
                        'role': 'user',
                        'content': feedback_prompt
                    }],
                    model=self.model_name,
                    temperature=0.7,
                    max_tokens=500
                )
                
                ai_feedback = response.choices[0].message.content
            except Exception as e:
                print(f"Error generating AI feedback: {e}")
                ai_feedback = f"You scored {correct_count} out of {total_questions} questions correctly. Keep practicing to improve!"
            
            return {
                "score": {
                    "correct": correct_count,
                    "total": total_questions,
                    "percentage": score_percentage
                },
                "detailed_results": evaluation_data,
                "ai_feedback": ai_feedback,
                "performance_level": self._get_performance_level(score_percentage)
            }
            
        except Exception as e:
            print(f"Error in evaluate_answers: {e}")
            # Return basic evaluation without AI feedback
            correct_count = 0
            evaluation_data = []
            
            for i, question in enumerate(questions):
                question_id = str(i)
                user_answer = user_answers.get(question_id, "")
                correct_answer = question.get('correct_answer', '')
                is_correct = user_answer.lower().strip() == correct_answer.lower().strip()
                
                if is_correct:
                    correct_count += 1
                
                evaluation_data.append({
                    "question": question.get('text', ''),
                    "user_answer": user_answer,
                    "correct_answer": correct_answer,
                    "is_correct": is_correct,
                    "explanation": question.get('explanation', '')
                })
            
            total_questions = len(questions)
            score_percentage = (correct_count / total_questions) * 100 if total_questions > 0 else 0
            
            return {
                "score": {
                    "correct": correct_count,
                    "total": total_questions,
                    "percentage": score_percentage
                },
                "detailed_results": evaluation_data,
                "ai_feedback": f"You scored {correct_count} out of {total_questions} questions correctly.",
                "performance_level": self._get_performance_level(score_percentage)
            }
    
    def _get_performance_level(self, percentage: float) -> str:
        """Determine performance level based on score percentage"""
        if percentage >= 90:
            return "Excellent"
        elif percentage >= 80:
            return "Good"
        elif percentage >= 70:
            return "Average"
        elif percentage >= 60:
            return "Below Average"
        else:
            return "Needs Improvement"

# Global instance
llm_service = LLMService()
