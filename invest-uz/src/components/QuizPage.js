import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../AuthContext';

export default function QuizPage() {
  const { token, isAuthed } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [startText, setStartText] = useState('');
  const [startTitle, setStartTitle] = useState('');
  const [showStartForm, setShowStartForm] = useState(false);
  const [answers, setAnswers] = useState({});

  const loadQuizzes = useCallback(async () => {
    setStatus('');
    try {
      const data = await apiFetch('/api/quiz', { method: 'GET' }, token);
      setQuizzes(data || []);
    } catch (err) {
      setStatus('Viktorinalarni yuklashda xatolik.');
    }
  }, [token]);

  useEffect(() => {
    if (isAuthed) {
      loadQuizzes();
    }
  }, [isAuthed, loadQuizzes]);

  const startNewQuiz = async (e) => {
    e.preventDefault();
    if (!startText.trim() || !startTitle.trim()) {
      setStatus('Iltimos, matn va sarlavhani to\'ldiring.');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      const quiz = await apiFetch(
        '/api/quiz/start',
        {
          method: 'POST',
          body: JSON.stringify({ title: startTitle, text: startText }),
        },
        token
      );
      setCurrentQuiz(quiz);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setShowStartForm(false);
      setStartText('');
      setStartTitle('');
    } catch (err) {
      setStatus('Viktorina yaratishda xatolik.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (e) => {
    e.preventDefault();
    if (!userAnswer.trim()) {
      setStatus('Javob bo\'sh bo\'lishi mumkin emas.');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      const question = currentQuiz.questions[currentQuestionIndex];
      const result = await apiFetch(
        '/api/answer',
        {
          method: 'POST',
          body: JSON.stringify({
            question_id: question.id,
            answer_text: userAnswer.trim(),
          }),
        },
        token
      );

      setAnswers({
        ...answers,
        [question.id]: {
          answer: userAnswer,
          score: result.score,
          feedback: result.feedback,
        },
      });

      if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setUserAnswer('');
        setStatus(`Xp: +${result.xp_gained} | Level: ${result.user_level}`);
      } else {
        setStatus('Viktorina tugallandi!');
        setCurrentQuiz(null);
        setCurrentQuestionIndex(0);
        loadQuizzes();
      }
    } catch (err) {
      setStatus('Javob yuborishda xatolik.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthed) {
    return (
      <div className="page">
        <div className="section">
          <h1>Viktorina</h1>
          <p className="muted">Viktorinalarga qatnashish uchun login qiling.</p>
        </div>
      </div>
    );
  }

  if (currentQuiz) {
    const question = currentQuiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;

    return (
      <div className="page quiz-page">
        <div className="section quiz-card">
          <div className="quiz-header">
            <h2>{currentQuiz.title}</h2>
            <span className="quiz-progress">
              {currentQuestionIndex + 1}/{currentQuiz.questions.length}
            </span>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="quiz-question">
            <h3>{question.text}</h3>
          </div>

          {answers[question.id] && (
            <div className="answer-result">
              <p>
                <strong>Sizning javob:</strong> {answers[question.id].answer}
              </p>
              <p className="feedback">{answers[question.id].feedback}</p>
              <p className="score">Score: {answers[question.id].score}/10</p>
              {currentQuestionIndex < currentQuiz.questions.length - 1 ? (
                <button
                  className="primary-btn"
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                >
                  Keyingisiga o'tish
                </button>
              ) : (
                <button
                  className="primary-btn"
                  onClick={() => {
                    setCurrentQuiz(null);
                    loadQuizzes();
                  }}
                >
                  Bosh sahifaga qaytish
                </button>
              )}
            </div>
          )}

          {!answers[question.id] && (
            <>
              {status && <p className="status-text">{status}</p>}
              <form className="quiz-form" onSubmit={submitAnswer}>
                <textarea
                  placeholder="Javobingizni yozing..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  rows="4"
                />
                <button className="primary-btn" disabled={loading}>
                  {loading ? 'Yuborilmoqda...' : 'Javobni yuborish'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page quiz-page">
      <div className="section quiz-card">
        <div className="quiz-head">
          <h1>Viktorina</h1>
          <button
            className="primary-btn"
            onClick={() => setShowStartForm(!showStartForm)}
          >
            {showStartForm ? 'Bekor qilish' : 'Yangi viktorina'}
          </button>
        </div>

        {showStartForm && (
          <form className="quiz-start-form" onSubmit={startNewQuiz}>
            <div className="form-group">
              <label>Viktorina sarlavhasi</label>
              <input
                type="text"
                placeholder="Masalan: Tabiatning ajoyibliklari"
                value={startTitle}
                onChange={(e) => setStartTitle(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Matn (qaysi haqida savollar yaratilsin?)</label>
              <textarea
                placeholder="Matn joylang..."
                value={startText}
                onChange={(e) => setStartText(e.target.value)}
                rows="6"
              />
            </div>
            {status && <p className="status-text">{status}</p>}
            <button className="primary-btn" disabled={loading}>
              {loading ? 'Yuklanmoqda...' : 'Viktorinani boshlash'}
            </button>
          </form>
        )}

        {quizzes.length === 0 ? (
          <p className="muted">Hozircha viktorina yo'q.</p>
        ) : (
          <div className="quizzes-list">
            <h3>Sizning viktorinalari</h3>
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="quiz-item">
                <div className="quiz-info">
                  <h4>{quiz.title}</h4>
                  <div className="quiz-stats">
                    <span>Savollar: {quiz.questions.length}</span>
                    <span>Score: {quiz.total_score}</span>
                    <span>
                      {quiz.is_completed ? 'Tugallangan' : 'Davom etmoqda'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
