import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';

interface Course {
  id: number;
  title: string;
  description: string;
  language: string;
  category: string;
  difficulty: string;
  thumbnail_url: string;
  author: string;
}

interface Lesson {
  id: number;
  course_id: number;
  title: string;
  content: string;
  type: string;
  video_url: string;
  order_index: number;
}

const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'curriculum'>('details');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const { addToast } = useApp();

  // Forms
  const [courseForm, setCourseForm] = useState<Partial<Course>>({});
  const [lessonForm, setLessonForm] = useState<Partial<Lesson>>({});
  const [isEditingLesson, setIsEditingLesson] = useState<boolean>(false);

  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => { loadCourses(); }, []);

  useEffect(() => {
    if (selectedCourse) {
      setCourseForm(selectedCourse);
      setIsCreating(false);
      if (activeTab === 'curriculum') loadLessons(selectedCourse.id);
    }
  }, [selectedCourse, activeTab]);

  const loadCourses = () => api.get('/admin/courses').then(res => setCourses(res.data)).catch(() => {});
  const loadLessons = (courseId: number) => api.get(`/admin/courses/${courseId}/lessons`).then(res => setLessons(res.data)).catch(() => {});

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedCourse?.id) {
        const res = await api.put(`/admin/courses/${selectedCourse.id}`, courseForm);
        setCourses(prev => prev.map(c => c.id === res.data.id ? res.data : c));
        setSelectedCourse(res.data);
        addToast('Course updated', 'success');
      } else {
        const res = await api.post('/admin/courses', courseForm);
        setCourses([res.data, ...courses]);
        setSelectedCourse(res.data);
        setIsCreating(false);
        addToast('Course created', 'success');
      }
    } catch { addToast('Error saving course', 'error');    }
  };

  const handleUploadThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      addToast('Uploading thumbnail to S3...', 'info');
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCourseForm(prev => ({ ...prev, thumbnail_url: res.data.url }));
      addToast('Thumbnail uploaded successfully', 'success');
    } catch (err) {
      addToast('Failed to upload thumbnail', 'error');
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm('Delete this course?')) return;
    try {
      await api.delete(`/admin/courses/${id}`);
      setCourses(prev => prev.filter(c => c.id !== id));
      if (selectedCourse?.id === id) setSelectedCourse(null);
      addToast('Course deleted', 'info');
    } catch { addToast('Error deleting course', 'error'); }
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      const payload = { ...lessonForm, course_id: selectedCourse.id };
      if (isEditingLesson && lessonForm.id) {
        const res = await api.put(`/admin/lessons/${lessonForm.id}`, payload);
        setLessons(prev => prev.map(l => l.id === res.data.id ? res.data : l));
        addToast('Lesson updated', 'success');
      } else {
        const res = await api.post('/admin/lessons', payload);
        setLessons([...lessons, res.data]);
        addToast('Lesson added', 'success');
      }
      setLessonForm({});
      setIsEditingLesson(false);
    } catch { addToast('Error saving lesson', 'error'); }
  };

  const handleDeleteLesson = async (id: number) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await api.delete(`/admin/lessons/${id}`);
      setLessons(prev => prev.filter(l => l.id !== id));
      addToast('Lesson deleted', 'info');
    } catch { addToast('Error deleting lesson', 'error'); }
  };

  return (
    <Layout rightPanel={false}>
      <h2 style={{ marginBottom: '2rem' }}>Course Builder</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Course List Sidebar */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>All Courses</h3>
            <button className="btn btn-primary" onClick={() => { setSelectedCourse(null); setCourseForm({}); setActiveTab('details'); setIsCreating(true); }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8125rem' }}>+ New</button>
          </div>
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {courses.map(course => (
              <div 
                key={course.id} 
                onClick={() => setSelectedCourse(course)}
                style={{ 
                  padding: '1rem', borderBottom: '1px solid var(--border)', cursor: 'pointer', 
                  background: selectedCourse?.id === course.id ? 'rgba(108,92,231,0.05)' : 'transparent',
                  borderLeft: selectedCourse?.id === course.id ? '3px solid var(--primary)' : '3px solid transparent'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{course.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{course.category} • {course.language}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor Area */}
        <div className="card" style={{ minHeight: '600px' }}>
          {!selectedCourse && !isCreating ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Select a course to edit, or create a new one.
            </div>
          ) : (
            <>
              {selectedCourse && (
                <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
                  <button 
                    onClick={() => setActiveTab('details')}
                    style={{ background: 'none', border: 'none', fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer', color: activeTab === 'details' ? 'var(--primary)' : 'var(--text-muted)' }}
                  >
                    Course Details
                  </button>
                  <button 
                    onClick={() => setActiveTab('curriculum')}
                    style={{ background: 'none', border: 'none', fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer', color: activeTab === 'curriculum' ? 'var(--primary)' : 'var(--text-muted)' }}
                  >
                    Curriculum ({lessons.length})
                  </button>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => handleDeleteCourse(selectedCourse.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e17055', fontWeight: 600, fontSize: '0.8125rem' }}>
                    Delete Course
                  </button>
                </div>
              )}

              {activeTab === 'details' || !selectedCourse ? (
                <form onSubmit={handleSaveCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ marginBottom: '1rem' }}>{selectedCourse ? 'Edit Details' : 'Create New Course'}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8125rem' }}>Title</label>
                      <input required value={courseForm.title || ''} onChange={e => setCourseForm({...courseForm, title: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-main)' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8125rem' }}>Category</label>
                      <input required value={courseForm.category || ''} onChange={e => setCourseForm({...courseForm, category: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-main)' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8125rem' }}>Description</label>
                    <textarea value={courseForm.description || ''} onChange={e => setCourseForm({...courseForm, description: e.target.value})} rows={3} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-main)', fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8125rem' }}>Target Language</label>
                      <select required value={courseForm.language || ''} onChange={e => setCourseForm({...courseForm, language: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-main)' }}>
                        <option value="" disabled>Select a language</option>
                        <optgroup label="Frontend">
                          <option value="HTML/CSS">HTML/CSS</option>
                          <option value="JavaScript">JavaScript</option>
                          <option value="TypeScript">TypeScript</option>
                          <option value="React">React</option>
                          <option value="Vue">Vue</option>
                          <option value="Angular">Angular</option>
                        </optgroup>
                        <optgroup label="Backend">
                          <option value="Node.js">Node.js</option>
                          <option value="Python">Python</option>
                          <option value="Java">Java</option>
                          <option value="C#">C#</option>
                          <option value="Go">Go</option>
                          <option value="Ruby">Ruby</option>
                          <option value="PHP">PHP</option>
                          <option value="Rust">Rust</option>
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8125rem' }}>Difficulty</label>
                      <select value={courseForm.difficulty || 'Beginner'} onChange={e => setCourseForm({...courseForm, difficulty: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-main)' }}>
                        <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8125rem' }}>Thumbnail URL</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input value={courseForm.thumbnail_url || ''} onChange={e => setCourseForm({...courseForm, thumbnail_url: e.target.value})} className="form-input" style={{ flex: 1, padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-main)' }} placeholder="URL or upload..." />
                    <label className="btn btn-outline" style={{ cursor: 'pointer', padding: '0.75rem 1rem', height: '100%', margin: 0 }}>
                      Upload (S3)
                      <input type="file" accept="image/*" onChange={handleUploadThumbnail} style={{ display: 'none' }} />
                    </label>
                  </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: 'fit-content', marginTop: '1rem' }}>{selectedCourse ? 'Save Changes' : 'Create Course'}</button>
                </form>
              ) : (
                <div>
                  <h3 style={{ marginBottom: '1.5rem' }}>Curriculum Editor</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                    {lessons.map((lesson, idx) => (
                      <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-base)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(108,92,231,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, marginRight: '1rem' }}>{lesson.order_index}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{lesson.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lesson.type.toUpperCase()}</div>
                        </div>
                        <button onClick={() => { setLessonForm(lesson); setIsEditingLesson(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: '0.8125rem', marginRight: '1rem' }}>Edit</button>
                        <button onClick={() => handleDeleteLesson(lesson.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e17055', fontWeight: 600, fontSize: '0.8125rem' }}>Delete</button>
                      </div>
                    ))}
                    {lessons.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No lessons added yet.</p>}
                  </div>

                  <form onSubmit={handleSaveLesson} style={{ padding: '1.5rem', background: 'rgba(108,92,231,0.03)', borderRadius: 12, border: '1px dashed var(--border)' }}>
                    <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>{isEditingLesson ? 'Edit Lesson' : 'Add New Lesson'}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', gap: '1rem', marginBottom: '1rem' }}>
                      <input placeholder="Lesson Title" required value={lessonForm.title || ''} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} className="form-input" style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)' }} />
                      <select value={lessonForm.type || 'video'} onChange={e => setLessonForm({...lessonForm, type: e.target.value})} className="form-input" style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)' }}>
                        <option value="video">Video</option><option value="text">Text</option>
                      </select>
                      <input type="number" placeholder="Order" value={lessonForm.order_index || ''} onChange={e => setLessonForm({...lessonForm, order_index: Number(e.target.value)})} className="form-input" style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)' }} />
                    </div>
                    {lessonForm.type !== 'text' && (
                      <div style={{ marginBottom: '1rem' }}>
                        <input placeholder="Video URL (YouTube embed or MP4)" value={lessonForm.video_url || ''} onChange={e => setLessonForm({...lessonForm, video_url: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)' }} />
                      </div>
                    )}
                    <div style={{ marginBottom: '1rem' }}>
                      <textarea placeholder="Lesson Content / Notes" value={lessonForm.content || ''} onChange={e => setLessonForm({...lessonForm, content: e.target.value})} rows={3} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', fontFamily: 'inherit' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button type="submit" className="btn btn-primary">{isEditingLesson ? 'Update Lesson' : 'Save Lesson'}</button>
                      {isEditingLesson && <button type="button" onClick={() => { setIsEditingLesson(false); setLessonForm({}); }} className="btn" style={{ background: 'var(--bg-element)' }}>Cancel</button>}
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminCourses;
