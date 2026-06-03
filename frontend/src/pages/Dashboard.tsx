import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout, { ColorAvatar } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { SkeletonCard } from '../components/Skeleton';

/* ── DONUT CHART ─────────────────────── */
const DonutChart: React.FC<{ percent: number }> = ({ percent }) => {
  const r = 42; const circ = 2 * Math.PI * r;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
      <div style={{ position: 'relative', width: 100, height: 100 }}>
        <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="#ede9fe" strokeWidth="10" />
          <circle cx="50" cy="50" r={r} fill="none" stroke="#6c5ce7" strokeWidth="10" strokeDasharray={`${(percent / 100) * circ} ${circ - (percent / 100) * circ}`} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>{percent}%</div>
      </div>
    </div>
  );
};

/* ── BAR CHART ───────────────────────── */
const BarChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: 80, marginBottom: '0.5rem' }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 3 }}>
            <div style={{ width: '100%', maxWidth: 20, height: `${(d.value / max) * 100}%`, background: i === data.length - 1 ? 'var(--primary)' : '#c7c2f5', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease', minHeight: 4 }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {data.map((d, i) => <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{d.label}</div>)}
      </div>
    </div>
  );
};

/* ── COURSE CATEGORY TAG ─────────────── */
const categoryStyle = (cat: string): { bg: string; color: string } => {
  const map: Record<string, { bg: string; color: string }> = {
    'Front End': { bg: '#dbeafe', color: '#1d4ed8' },
    'UI/UX Design': { bg: '#ede9fe', color: '#7c3aed' },
    'Backend': { bg: '#d1fae5', color: '#065f46' },
    'Branding': { bg: '#fce7f3', color: '#be185d' },
    'General': { bg: '#f3f4f6', color: '#4b5563' },
  };
  return map[cat] || { bg: '#f3f4f6', color: '#4b5563' };
};

/* ── DASHBOARD ───────────────────────── */
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useApp();

  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ overallPercent: 0, streak: 0, weeklyXp: 0 });
  const [activity, setActivity] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [coursesR, enrolledR, statsR, activityR, mentorsR] = await Promise.all([
          api.get('/courses'),
          api.get('/courses/enrolled'),
          api.get('/users/stats'),
          api.get('/users/activity'),
          api.get('/users/mentors'),
        ]);
        setAllCourses(coursesR.data);
        setEnrolledCourses(enrolledR.data);
        setStats(statsR.data);
        setActivity(activityR.data);
        setMentors(mentorsR.data.slice(0, 3));

        // Fetch lessons from first enrolled course
        if (enrolledR.data.length > 0) {
          const ls = await api.get(`/courses/${enrolledR.data[0].id}`);
          setLessons(ls.data.lessons.slice(0, 3));
        }
      } catch (e) {
        // silent
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleEnroll = async (course: any) => {
    try {
      await api.post(`/courses/${course.id}/enroll`);
      const updated = await api.get('/courses/enrolled');
      setEnrolledCourses(updated.data);
      addToast(`Enrolled in "${course.title}" 🎉`, 'success');
    } catch { addToast('Failed to enroll', 'error'); }
  };

  const handleFollow = async (mentor: any) => {
    try {
      if (mentor.is_following) {
        await api.delete(`/users/mentors/${mentor.id}/follow`);
        setMentors(prev => prev.map(m => m.id === mentor.id ? { ...m, is_following: 0 } : m));
      } else {
        await api.post(`/users/mentors/${mentor.id}/follow`);
        setMentors(prev => prev.map(m => m.id === mentor.id ? { ...m, is_following: 1 } : m));
        addToast(`Following ${mentor.username}!`, 'success');
      }
    } catch {}
  };

  // Course pills from enrolled courses
  const pills = enrolledCourses.slice(0, 3);
  const pillIconClass = ['purple', 'pink', 'blue'];
  const pillIcons = ['✦', '🏷', '⌨'];

  // "Continue Watching" — enrolled courses as cards, plus non-enrolled to fill
  const watchCards = [
    ...enrolledCourses.map(c => ({ ...c, is_enrolled: true })),
    ...allCourses.filter(c => !c.is_enrolled).slice(0, Math.max(0, 3 - enrolledCourses.length))
  ].slice(0, 3);

  return (
    <Layout rightPanel={
        /* ── RIGHT PANEL ──────────────── */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 700 }}>Statistic</h3>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.25rem' }}>⋮</button>
          </div>

          <DonutChart percent={stats.overallPercent || 0} />

          <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <ColorAvatar name={user?.username || 'U'} size={64} idx={0} style={{ margin: '0 auto 0.875rem' }} />
            <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Good Morning {user?.username} 🔥</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Continue your learning to achieve your target!</p>
          </div>

          <BarChart data={activity.length ? activity : [{ label: '1-10d', value: 0 }, { label: '11-20d', value: 0 }, { label: '21-30d', value: 0 }]} />

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h4 style={{ fontWeight: 700 }}>Your mentor</h4>
              <Link to="/mentors" style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>+</Link>
            </div>
            {mentors.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <ColorAvatar name={m.username} size={32} idx={i + 1} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{m.username}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mentor</div>
                </div>
                <button onClick={() => handleFollow(m)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.75rem', border: '1px solid var(--border)', borderRadius: 999, background: m.is_following ? 'var(--primary)' : 'transparent', color: m.is_following ? 'white' : 'var(--text-main)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {m.is_following ? '✓ Following' : '+ Follow'}
                </button>
              </div>
            ))}
            <Link to="/mentors" style={{ display: 'block', width: '100%', marginTop: '1rem', padding: '0.625rem', background: 'var(--primary-soft)', color: 'var(--primary)', border: 'none', borderRadius: 10, fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', transition: 'all 0.2s' }}>
              See All
            </Link>
          </div>
        </div>
      }>
        {/* ── HERO BANNER ─────────────────────── */}
        <div className="hero-banner">
          <div className="online-course-tag">Online Course</div>
          <h2>Sharpen Your Skills with<br />Professional Online Courses</h2>
          <Link to="/courses" className="btn-hero">
            Browse Now
            <span className="arrow-circle">→</span>
          </Link>
          <div className="sparkle">✦</div>
        </div>

        {/* ── COURSE PILLS ─────────────────────── */}
        <div className="course-pills">
          {pills.length === 0
            ? [
                { name: 'UI/UX Design', w: '0/0', ic: 'purple', icon: '✦' },
                { name: 'Branding', w: '0/0', ic: 'pink', icon: '🏷' },
                { name: 'Front End', w: '0/0', ic: 'blue', icon: '⌨' },
              ].map((p, i) => (
                <div key={i} className="course-pill">
                  <div className={`course-pill-icon ${p.ic}`}>{p.icon}</div>
                  <div className="course-pill-info">
                    <div className="course-pill-progress">{p.w} watched</div>
                    <div className="course-pill-name">{p.name}</div>
                  </div>
                </div>
              ))
            : pills.map((c, i) => (
                <div key={c.id} className="course-pill">
                  <div className={`course-pill-icon ${pillIconClass[i % 3]}`}>{pillIcons[i % 3]}</div>
                  <div className="course-pill-info">
                    <div className="course-pill-progress">{c.completed_lessons || 0}/{c.total_lessons || 0} watched</div>
                    <div className="course-pill-name">{c.title}</div>
                  </div>
                </div>
              ))
          }
        </div>

        {/* ── CONTINUE WATCHING ────────────────── */}
        <div className="section-header">
          <h3>Continue Watching</h3>
          <Link to="/courses" style={{ fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>See all</Link>
        </div>

        {loading ? (
          <div className="course-cards-grid">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : (
          <div className="course-cards-grid">
            {(watchCards.length ? watchCards : allCourses.slice(0, 3)).map((c, i) => {
              const cs = categoryStyle(c.category);
              return (
                <div key={c.id} className="course-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="course-card-thumb">
                    <img src={c.thumbnail_url || `/thumb${(i % 3) + 1}.png`} alt={c.title} onError={e => (e.currentTarget.src = `/thumb${(i % 3) + 1}.png`)} />
                    <button className="course-card-fav">♡</button>
                  </div>
                  <div className="course-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ display: 'inline-block', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: 4, marginBottom: '0.5rem', background: cs.bg, color: cs.color }}>
                      {c.category}
                    </span>
                    <div className="course-card-title" style={{ flex: 1 }}>{c.title}</div>
                    <div className="course-card-divider" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ColorAvatar name={c.author || 'M'} size={24} idx={i % 5} />
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{c.author || 'Instructor'}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mentor</div>
                        </div>
                      </div>
                      {c.is_enrolled
                        ? <Link to={`/course/${c.id}`} className="btn btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>Resume</Link>
                        : <button onClick={() => handleEnroll(c)} className="btn btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>Enroll</button>
                      }
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── YOUR LESSON TABLE ─────────────────── */}
        <div className="section-header" style={{ marginTop: '0.5rem' }}>
          <h3>Your Lesson</h3>
          <Link to="/lesson" style={{ fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>See all</Link>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="lesson-table">
            <thead>
              <tr>
                <th>Mentor</th><th>Type</th><th>Desc</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {lessons.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <Link to="/courses" style={{ color: 'var(--primary)', fontWeight: 600 }}>Enroll in a course</Link> to see lessons here
                </td></tr>
              ) : lessons.map((l, i) => (
                <tr key={l.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <ColorAvatar name={enrolledCourses[0]?.author || 'M'} size={32} idx={1} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{enrolledCourses[0]?.author || 'Instructor'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mentor</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 4, background: '#dbeafe', color: '#1d4ed8' }}>
                      {l.type?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{l.title}</td>
                  <td>
                    <Link to={`/course/${enrolledCourses[0]?.id}`} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', transition: 'all 0.2s' }}>→</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── STATS STRIP ──────────────────────── */}
        {stats && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            {[
              { label: 'Day Streak', value: `${stats.streak} 🔥`, bg: 'rgba(253,203,110,0.15)', color: '#f39c12' },
              { label: 'Weekly XP', value: `${stats.weeklyXp} XP`, bg: 'rgba(108,92,231,0.08)', color: 'var(--primary)' },
              { label: 'Courses', value: stats.enrolledCourses, bg: 'rgba(0,184,148,0.08)', color: 'var(--success)' },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, background: s.bg, borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.25rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </Layout>
  );
};

export default Dashboard;
