import { useState } from 'react'
import './index.css'

function App() {
  // State variables
  const [domain, setDomain] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [difficulty, setDifficulty] = useState('Easy')
  const [questions, setQuestions] = useState([])
  const [currentStep, setCurrentStep] = useState('setup') // setup, quiz, results
  const [userAnswers, setUserAnswers] = useState({})
  const [quizResults, setQuizResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sessionToken, setSessionToken] = useState(null)

  // URL for connecting BACKEND
  const URL = import.meta.env.VITE_API_URL

  // Available difficulties
  const difficulties = ['Easy', 'Intermediate', 'Hard']

  // Generate quiz
  const generateQuiz = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${URL}/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain,
          num_questions: numQuestions,
          difficulty,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate quiz')
      }

      const data = await response.json()
      setQuestions(data.questions)
      setSessionToken(data.session_token)
      setCurrentStep('quiz')
      setUserAnswers({})
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Submit quiz
  const submitQuiz = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${URL}/submit-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken,
        },
        body: JSON.stringify({
          answers: userAnswers,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit quiz')
      }

      const results = await response.json()
      setQuizResults(results)
      setCurrentStep('results')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Reset quiz
  const resetQuiz = () => {
    setCurrentStep('setup')
    setQuestions([])
    setUserAnswers({})
    setQuizResults(null)
    setError(null)
    setSessionToken(null)
  }

  // Handle answer selection
  const handleAnswerChange = (questionIndex, selectedOption) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex + 1]: selectedOption
    }))
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Interactive Quiz App</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {currentStep === 'setup' && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="domain">
              Topic/Domain
            </label>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              id="domain"
              type="text"
              placeholder="Enter quiz topic (e.g., JavaScript, History, Science)"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="numQuestions">
              Number of Questions
            </label>
            <input
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              id="numQuestions"
              type="number"
              min="1"
              max="10"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="difficulty">
              Difficulty Level
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              id="difficulty"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              {difficulties.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <button
            onClick={generateQuiz}
            disabled={!domain || isLoading}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            Generate Quiz
          </button>
        </div>
      )}

      {currentStep === 'quiz' && questions.length > 0 && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          {questions.map((question, index) => (
            <div key={index} className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                Question {index + 1}: <br /> {question.question}
              </h3>
              <div className="space-y-2">
                {Object.entries(question.options).map(([option, text]) => (
                  <label key={option} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100">
                    <input
                      type="radio"
                      name={`question${index}`}
                      value={option}
                      checked={userAnswers[index + 1] === option}
                      onChange={() => handleAnswerChange(index, option)}
                      className="form-radio"
                    />
                    <span>{text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={submitQuiz}
            disabled={Object.keys(userAnswers).length !== questions.length || isLoading}
            className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            Submit Quiz
          </button>
        </div>
      )}

      {currentStep === 'results' && quizResults && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-2xl font-bold mb-4">Quiz Results</h2>
          <p className="text-xl mb-4">Score: {quizResults.score} / {quizResults.total_questions}</p>

          <div className="space-y-4">
            {Object.entries(quizResults.results).map(([questionNum, result]) => (
              <div key={questionNum} className={`p-4 rounded ${result === 'Correct' ? 'bg-green-100' : 'bg-red-100'}`}>
                <p className="font-semibold">Question {questionNum}:</p>
                {result === 'Correct' ? (
                  <p className="text-green-700">✓ Correct</p>
                ) : (
                  <>
                    <p className="text-red-700">✗ Incorrect</p>
                    <p className="mt-1">Correct answer: {result['Correct Answer']}</p>
                  </>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={resetQuiz}
            className="w-full mt-6 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Start New Quiz
          </button>
        </div>
      )}
    </main>
  )
}

export default App