import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useApp } from '../context/AppContext';

interface Lesson { id: number; title: string; completed: number; type: 'text' | 'video'; }

interface Course {
  id: number;
  title: string;
  description: string;
  language: string;
  category: string;
  difficulty: string;
  thumbnail_url: string;
  author: string;
  is_enrolled: boolean;
}

const CoursePlayer: React.FC = () => {
  const { courseId } = useParams();
  const { addToast } = useApp();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);
  const [lessonContent, setLessonContent] = useState<any>(null);
  
  const [quizAnswer, setQuizAnswer] = useState('');
  const [quizResult, setQuizResult] = useState<any>(null);
  const [certEligible, setCertEligible] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesTimer, setNotesTimer] = useState<any>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => { fetchCourseDetails(); checkCert(); }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const res = await api.get(`/courses/${courseId}`);
      setCourse(res.data.course);
      setLessons(res.data.lessons);
      
      // Only auto-load lesson if they are enrolled
      if (res.data.course.is_enrolled && res.data.lessons.length > 0 && !currentLessonId) {
        loadLesson(res.data.lessons[0].id);
      }
    } catch (error) {
      console.error('Error fetching course details', error);
    }
  };

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      addToast('Successfully enrolled! Welcome to the course.', 'success');
      fetchCourseDetails(); // Reloads course state to set is_enrolled = true
    } catch (error) {
      addToast('Error enrolling in course', 'error');
    } finally {
      setIsEnrolling(false);
    }
  };

  const checkCert = async () => {
    try {
      const res = await api.get(`/courses/${courseId}/certificate`);
      setCertEligible(res.data.eligible);
    } catch (e) {}
  };

  const loadLesson = async (id: number) => {
    if (!course?.is_enrolled) return;
    setCurrentLessonId(id);
    setQuizResult(null); setQuizAnswer('');
    try {
      const res = await api.get(`/courses/lesson/${id}`);
      setLessonContent(res.data);
      setNotes(res.data.notes || '');
      setBookmarked(res.data.is_bookmarked === 1);
    } catch (e) {}
  };

  const handleQuizSubmit = async () => {
    const res = await api.post(`/courses/lesson/${currentLessonId}/quiz`, { answer: quizAnswer });
    setQuizResult(res.data);
    if (res.data.correct) {
      addToast('Correct answer! 🎉', 'success');
      
      const currentIndex = lessons.findIndex(l => l.id === currentLessonId);
      if (currentIndex === lessons.length - 1) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#6c5ce7', '#00b894', '#f1c40f'] });
        addToast('Course fully completed! Check your Path dashboard.', 'success');
      }

      fetchCourseDetails(); checkCert();
    } else {
      addToast('Not quite — try again!', 'warning');
    }
  };

  const markComplete = async () => {
    await api.post(`/courses/lesson/${currentLessonId}/complete`);
    addToast('Lesson completed! ✓', 'success');
    
    const currentIndex = lessons.findIndex(l => l.id === currentLessonId);
    if (currentIndex === lessons.length - 1) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#6c5ce7', '#00b894', '#f1c40f'] });
      addToast('Course fully completed! Check your Path dashboard.', 'success');
    }

    fetchCourseDetails(); checkCert();
  };

  const handleNotesChange = useCallback((val: string) => {
    setNotes(val);
    clearTimeout(notesTimer);
    setNotesTimer(setTimeout(async () => {
      await api.put(`/courses/lesson/${currentLessonId}/notes`, { notes: val });
    }, 1500));
  }, [currentLessonId, notesTimer]);

  const toggleBookmark = async () => {
    const res = await api.post(`/courses/lesson/${currentLessonId}/bookmark`);
    setBookmarked(res.data.bookmarked);
    addToast(res.data.bookmarked ? 'Lesson bookmarked ✦' : 'Bookmark removed', 'info');
  };

  if (!course) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>;
  }

  // === PREVIEW MODE (NOT ENROLLED) ===
  if (!course.is_enrolled) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-main)' }}>
        {/* Header Navigation */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'white' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link to="/dashboard" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.9375rem', fontWeight: 600 }}>
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        <main style={{ maxWidth: 1000, margin: '0 auto', padding: '3rem 1.5rem' }}>
          {/* Hero Section */}
          <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', marginBottom: '4rem' }}>
            <div style={{ flex: '1 1 500px' }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <span className="badge">{course.category}</span>
                <span className="badge" style={{ background: 'var(--bg-element)' }}>{course.difficulty}</span>
              </div>
              <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '1.5rem', color: 'var(--text-main)' }}>
                {course.title}
              </h1>
              <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
                {course.description || "Dive into this comprehensive course and master new skills. Perfect for beginners and seasoned developers alike looking to level up their knowledge."}
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Instructor</div>
                  <div style={{ fontWeight: 600 }}>{course.author || 'Admin'}</div>
                </div>
              </div>

              <button 
                onClick={handleEnroll} 
                disabled={isEnrolling}
                className="btn btn-primary" 
                style={{ padding: '1rem 3rem', fontSize: '1.125rem', width: 'fit-content' }}
              >
                {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
              </button>
            </div>
            
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ aspectRatio: '16/9', background: 'var(--bg-element)', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 24px 48px rgba(0,0,0,0.08)' }}>
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary-soft) 0%, rgba(108,92,231,0.2) 100%)', color: 'var(--primary)', fontSize: '4rem' }}>
                    ✦
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Curriculum Preview */}
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Course Curriculum</h2>
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              {lessons.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No lessons added yet.</div>
              ) : (
                lessons.map((l, i) => (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', borderBottom: i === lessons.length - 1 ? 'none' : '1px solid var(--border)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-element)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, fontWeight: 600, color: 'var(--text-main)' }}>{l.title}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-base)', padding: '0.25rem 0.625rem', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {l.type}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '1.25rem' }}>🔒</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // === PLAYER MODE (ENROLLED) ===
  const currentIndex = lessons.findIndex(l => l.id === currentLessonId);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const completed = lessons.filter(l => l.completed).length;
  const progress = lessons.length > 0 ? (completed / lessons.length) * 100 : 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-main)' }}>
      {/* ── SIDEBAR (Gamified Path) ─────────────────────────────── */}
      <aside style={{ width: 320, background: 'white', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 50, boxShadow: '4px 0 24px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-base)' }}>
          <Link to="/dashboard" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '1.5rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color='var(--primary)'} onMouseOut={e => e.currentTarget.style.color='var(--text-muted)'}>
            ← Back to Dashboard
          </Link>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <span>Your Journey</span><span>{Math.round(progress)}%</span>
          </div>
          <div className="progress-track" style={{ height: 6, borderRadius: 3, background: 'var(--bg-element)' }}>
            <div className="progress-fill" style={{ width: `${progress}%`, background: 'var(--primary)', height: '100%', borderRadius: 3, transition: 'width 0.5s ease' }} />
          </div>
        </div>

        <div style={{ flex: 1, padding: '2rem 1.5rem', overflowY: 'auto', position: 'relative' }}>
          {/* Timeline continuous line background */}
          <div style={{ position: 'absolute', top: '2rem', bottom: '2rem', left: '2.5rem', width: 2, background: 'var(--bg-element)', zIndex: 0 }} />

          {lessons.map((l, i) => {
            const isActive = currentLessonId === l.id;
            const isCompleted = !!l.completed;
            const isFuture = !isCompleted && !isActive && currentIndex !== -1 && i > currentIndex;

            return (
              <button 
                key={l.id} 
                onClick={() => loadLesson(l.id)} 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0', border: 'none', 
                  cursor: 'pointer', textAlign: 'left', background: 'transparent', width: '100%', 
                  marginBottom: i === lessons.length - 1 ? 0 : '2.5rem', position: 'relative', zIndex: 1,
                  opacity: isFuture ? 0.5 : 1, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {/* Node */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isActive && (
                    <div style={{ position: 'absolute', width: 44, height: 44, borderRadius: '50%', background: 'rgba(108,92,231,0.2)', animation: 'pulse 2s infinite' }} />
                  )}
                  <div style={{ 
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', fontWeight: 800,
                    background: isCompleted ? 'var(--success)' : isActive ? 'var(--primary)' : 'white',
                    color: isCompleted || isActive ? 'white' : 'var(--text-muted)',
                    border: isCompleted || isActive ? 'none' : '2px solid var(--border)',
                    boxShadow: isActive ? '0 0 0 4px white, 0 4px 12px rgba(108,92,231,0.4)' : isCompleted ? '0 0 0 4px white' : '0 0 0 4px white',
                    transition: 'all 0.3s'
                  }}>
                    {isCompleted ? '✓' : i + 1}
                  </div>
                </div>

                {/* Text Label */}
                <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', borderRadius: 12, background: isActive ? 'var(--bg-base)' : 'transparent', flex: 1 }}>
                  <span style={{ fontWeight: isActive ? 800 : 600, fontSize: '0.875rem', lineHeight: 1.4, color: isActive ? 'var(--primary)' : 'var(--text-main)' }}>{l.title}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginTop: '0.25rem' }}>
                    {l.type}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── MAIN AREA ─────────────────────────────── */}
      <main style={{ marginLeft: 320, flex: 1, padding: '3rem 4rem', maxWidth: 1000 }}>
        {lessonContent ? (
          <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.35rem 0.75rem', borderRadius: 8, background: 'var(--bg-element)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {lessonContent.type}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 500 }}>Module {currentIndex + 1}</span>
                
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={toggleBookmark} title="Bookmark" style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: bookmarked ? 'rgba(108,92,231,0.1)' : 'var(--bg-base)', cursor: 'pointer', color: bookmarked ? 'var(--primary)' : 'var(--text-muted)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: bookmarked ? 'inset 0 0 0 2px var(--primary)' : 'inset 0 0 0 1px var(--border)' }}>
                    {bookmarked ? '✦' : '✧'}
                  </button>
                  <button onClick={() => setShowNotes(p => !p)} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: showNotes ? 'rgba(108,92,231,0.1)' : 'var(--bg-base)', cursor: 'pointer', color: showNotes ? 'var(--primary)' : 'var(--text-muted)', fontSize: '1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: showNotes ? 'inset 0 0 0 2px var(--primary)' : 'inset 0 0 0 1px var(--border)' }}>
                    📝
                  </button>
                </div>
              </div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.2, marginBottom: '0.5rem', color: 'var(--text-main)' }}>{lessonContent.title}</h1>
            </div>

            {/* Video */}
            {lessonContent.type === 'video' && lessonContent.video_url && (
              <div style={{ marginBottom: '3rem', borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.12)', border: '1px solid var(--border)', background: 'black' }}>
                <div style={{ aspectRatio: '16/9' }}>
                  <iframe width="100%" height="100%" src={lessonContent.video_url} title="Lesson video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              </div>
            )}

            {/* Text content */}
            {lessonContent.type === 'text' && lessonContent.content && (
              <div style={{ background: 'white', borderRadius: 24, border: '1px solid var(--border)', padding: '3rem', marginBottom: '3rem', boxShadow: '0 8px 32px rgba(0,0,0,0.03)' }}>
                {lessonContent.content.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => (
                  <p key={i} style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '1.25rem' }}>{line}</p>
                ))}
              </div>
            )}

            {/* Notes panel */}
            {showNotes && (
              <div style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '3rem', boxShadow: '0 12px 32px rgba(0,0,0,0.05)', animation: 'slideDown 0.3s ease-out' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📝</span> Personal Notes
                </div>
                <textarea
                  value={notes}
                  onChange={e => handleNotesChange(e.target.value)}
                  placeholder="Capture your key takeaways here... (auto-saved securely)"
                  rows={6}
                  style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem', outline: 'none', fontFamily: 'inherit', fontSize: '0.9375rem', color: 'var(--text-main)', lineHeight: 1.7, resize: 'vertical', background: 'var(--bg-base)', transition: 'border-color 0.2s' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'right' }}>✓ Saved to cloud</div>
              </div>
            )}

            {/* Quiz */}
            {lessonContent.quiz && (
              <div style={{ background: 'linear-gradient(135deg, rgba(108,92,231,0.05) 0%, rgba(108,92,231,0.02) 100%)', borderRadius: 24, border: '1px solid var(--border)', padding: '3rem', marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)' }}>
                  🧠 Knowledge Check
                </h2>
                <p style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '2rem', color: 'var(--text-main)', lineHeight: 1.6 }}>{lessonContent.quiz.question}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {lessonContent.quiz.options.map((opt: string) => (
                    <button key={opt} onClick={() => !quizResult && setQuizAnswer(opt)} style={{ padding: '1.25rem 1.5rem', borderRadius: 16, border: `2px solid ${quizAnswer === opt ? 'var(--primary)' : 'var(--bg-element)'}`, background: quizAnswer === opt ? 'var(--primary-soft)' : 'white', cursor: quizResult ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: '1rem', fontWeight: 600, color: quizAnswer === opt ? 'var(--primary)' : 'var(--text-secondary)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: quizAnswer === opt ? '0 8px 24px rgba(108,92,231,0.15)' : '0 4px 12px rgba(0,0,0,0.02)' }}>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${quizAnswer === opt ? 'var(--primary)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'white' }}>
                        {quizAnswer === opt && <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)', display: 'block' }} />}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
                {!quizResult ? (
                  <button onClick={handleQuizSubmit} disabled={!quizAnswer} className="btn btn-primary" style={{ marginTop: '2rem', padding: '1rem 3rem', fontSize: '1rem', width: '100%' }}>
                    Verify Answer
                  </button>
                ) : (
                  <div style={{ marginTop: '2rem', animation: 'fadeIn 0.3s ease-out' }}>
                    <div style={{ padding: '1.25rem', borderRadius: 16, background: quizResult.correct ? 'rgba(0,184,148,0.1)' : 'rgba(225,112,85,0.1)', color: quizResult.correct ? 'var(--success)' : 'var(--error)', fontWeight: 800, fontSize: '1.125rem', marginBottom: '1rem', border: `1px solid ${quizResult.correct ? 'rgba(0,184,148,0.2)' : 'rgba(225,112,85,0.2)'}` }}>
                      {quizResult.correct ? '🎉 Brilliant! That is correct.' : '❌ Not quite. Let\'s try that again.'}
                    </div>
                    {lessonContent.quiz.explanation && (
                      <div style={{ padding: '1.5rem', borderRadius: 16, background: 'white', fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.7, border: '1px solid var(--border)' }}>
                        <strong style={{ color: 'var(--text-main)' }}>Explanation:</strong> {lessonContent.quiz.explanation}
                      </div>
                    )}
                    {!quizResult.correct && (
                      <button onClick={() => { setQuizResult(null); setQuizAnswer(''); }} className="btn btn-secondary" style={{ marginTop: '1.5rem', width: '100%', padding: '1rem' }}>Retry Question</button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Complete button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2rem', marginBottom: '4rem' }}>
              {!lessonContent.quiz && !lessonContent.completed ? (
                <button onClick={markComplete} className="btn btn-primary" style={{ padding: '1rem 4rem', fontSize: '1.125rem', borderRadius: 30, boxShadow: '0 8px 24px rgba(108,92,231,0.3)', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                  ✓ Mark Module as Complete
                </button>
              ) : lessonContent.completed && !lessonContent.quiz ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', color: 'var(--success)', fontWeight: 800, fontSize: '1.125rem', padding: '1rem 3rem', background: 'rgba(0,184,148,0.1)', borderRadius: 30, border: '1px solid rgba(0,184,148,0.2)' }}>
                  ✓ Module Completed
                </div>
              ) : null}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', paddingTop: '2rem', borderTop: '2px dashed var(--border)' }}>
              <button onClick={() => prevLesson && loadLesson(prevLesson.id)} disabled={!prevLesson} className="btn btn-secondary" style={{ opacity: prevLesson ? 1 : 0.4, padding: '1rem 2rem', borderRadius: 20 }}>
                ← Previous Module
              </button>
              <button onClick={() => nextLesson && loadLesson(nextLesson.id)} disabled={!nextLesson} className="btn btn-primary" style={{ opacity: nextLesson ? 1 : 0.4, padding: '1rem 2rem', borderRadius: 20 }}>
                Next Module →
              </button>
            </div>
          </div>
        ) : (
          <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'pulse 2s infinite' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '1.5rem', marginBottom: '1.5rem' }}>✦</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem', fontWeight: 600 }}>Loading module...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CoursePlayer;
