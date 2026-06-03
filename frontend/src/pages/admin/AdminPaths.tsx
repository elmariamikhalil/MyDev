import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import Layout from '../../components/Layout';

const AdminPaths: React.FC = () => {
  const [paths, setPaths] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', thumbnail_url: '' });

  // Manage Courses State
  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [activePathId, setActivePathId] = useState<number | null>(null);
  const [pathCourses, setPathCourses] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [selectedCourseToAdd, setSelectedCourseToAdd] = useState<string>('');

  const { addToast } = useApp();

  useEffect(() => {
    fetchPaths();
    fetchAllCourses();
  }, []);

  const fetchPaths = async () => {
    try {
      const res = await api.get('/paths');
      setPaths(res.data);
    } catch (e) {
      addToast('Failed to fetch paths', 'error');
    }
  };

  const fetchAllCourses = async () => {
    try {
      const res = await api.get('/admin/courses');
      setAllCourses(res.data);
    } catch (e) {}
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', thumbnail_url: '' });
    setShowModal(true);
  };

  const openEditModal = (path: any) => {
    setEditingId(path.id);
    setFormData({ title: path.title, description: path.description || '', thumbnail_url: path.thumbnail_url || '' });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/paths/${editingId}`, formData);
        addToast('Path updated successfully', 'success');
      } else {
        await api.post('/admin/paths', formData);
        addToast('Path created successfully', 'success');
      }
      setShowModal(false);
      fetchPaths();
    } catch (error) {
      addToast('Failed to save path', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this learning path?')) return;
    try {
      await api.delete(`/admin/paths/${id}`);
      addToast('Path deleted', 'success');
      fetchPaths();
    } catch (error) {
      addToast('Failed to delete path', 'error');
    }
  };

  const openManageCourses = async (pathId: number) => {
    setActivePathId(pathId);
    setShowCoursesModal(true);
    await fetchPathCourses(pathId);
  };

  const fetchPathCourses = async (pathId: number) => {
    try {
      const res = await api.get(`/admin/paths/${pathId}/courses`);
      setPathCourses(res.data);
    } catch (error) {
      addToast('Failed to fetch path courses', 'error');
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePathId || !selectedCourseToAdd) return;
    try {
      await api.post(`/admin/paths/${activePathId}/courses`, { course_id: parseInt(selectedCourseToAdd) });
      addToast('Course added to path', 'success');
      setSelectedCourseToAdd('');
      fetchPathCourses(activePathId);
      fetchPaths(); // Update total course count
    } catch (error) {
      addToast('Failed to add course', 'error');
    }
  };

  const handleRemoveCourse = async (courseId: number) => {
    if (!activePathId || !window.confirm('Remove this course from the path?')) return;
    try {
      await api.delete(`/admin/paths/${activePathId}/courses/${courseId}`);
      addToast('Course removed from path', 'success');
      fetchPathCourses(activePathId);
      fetchPaths(); // Update total course count
    } catch (error) {
      addToast('Failed to remove course', 'error');
    }
  };

  return (
    <Layout rightPanel={false}>
      <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
          <div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>
              Manage Paths
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Bundle courses together to create comprehensive learning journeys.</p>
          </div>
          <button onClick={openAddModal} className="btn btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem', boxShadow: '0 8px 24px rgba(108,92,231,0.3)', borderRadius: 12 }}>
            + Create New Path
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {paths.map(p => (
            <div key={p.id} style={{ display: 'flex', flexDirection: 'column', background: 'white', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.03)', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 48px rgba(108,92,231,0.1)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.03)'; }}>
              <div style={{ height: 180, background: 'var(--bg-element)', position: 'relative' }}>
                {p.thumbnail_url ? (
                  <img src={p.thumbnail_url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary-soft) 0%, rgba(108,92,231,0.2) 100%)', color: 'var(--primary)', fontSize: '4rem' }}>
                    ✦
                  </div>
                )}
                <div style={{ position: 'absolute', top: 16, right: 16, background: 'white', padding: '0.375rem 1rem', borderRadius: 20, fontSize: '0.8125rem', fontWeight: 800, color: 'var(--primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {p.total_courses || 0} Courses
                </div>
              </div>
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.75rem', lineHeight: 1.2 }}>{p.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, flex: 1, marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button onClick={() => openManageCourses(p.id)} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', borderRadius: 12 }}>Manage Courses</button>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => openEditModal(p)} className="btn btn-secondary" style={{ flex: 1, padding: '0.75rem', borderRadius: 12 }}>Edit Path</button>
                    <button onClick={() => handleDelete(p.id)} className="btn btn-secondary" style={{ padding: '0.75rem', color: 'var(--error)', borderRadius: 12, border: '1px solid rgba(225,112,85,0.2)', background: 'rgba(225,112,85,0.05)' }}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Path Metadata Edit Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, animation: 'fadeIn 0.2s' }}>
            <div style={{ background: 'white', padding: '2.5rem', borderRadius: 24, width: '100%', maxWidth: 500, boxShadow: '0 24px 48px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1.5rem' }}>{editingId ? 'Edit Path' : 'Create New Path'}</h2>
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Path Title</label>
                  <input required autoFocus value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: 12, border: '1px solid var(--border)', fontSize: '1rem', outline: 'none' }} placeholder="e.g. Frontend Masterclass" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Description</label>
                  <textarea required rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: 12, border: '1px solid var(--border)', fontSize: '1rem', outline: 'none', resize: 'none' }} placeholder="Describe what students will learn..." />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Thumbnail URL (Optional)</label>
                  <input value={formData.thumbnail_url} onChange={e => setFormData({ ...formData, thumbnail_url: e.target.value })} style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: 12, border: '1px solid var(--border)', fontSize: '1rem', outline: 'none' }} placeholder="https://example.com/image.png" />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1, padding: '1rem', borderRadius: 12 }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '1rem', borderRadius: 12 }}>{editingId ? 'Save Changes' : 'Create Path'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Manage Courses Modal */}
        {showCoursesModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, animation: 'fadeIn 0.2s' }}>
            <div style={{ background: 'white', padding: '2.5rem', borderRadius: 24, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Manage Path Courses</h2>
                <button onClick={() => setShowCoursesModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
              </div>

              {/* Add Course Form */}
              <form onSubmit={handleAddCourse} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-element)', borderRadius: 16 }}>
                <select required value={selectedCourseToAdd} onChange={e => setSelectedCourseToAdd(e.target.value)} style={{ flex: 1, padding: '0.875rem 1rem', borderRadius: 12, border: '1px solid var(--border)', outline: 'none' }}>
                  <option value="" disabled>Select a course to add...</option>
                  {allCourses.filter(c => !pathCourses.find(pc => pc.id === c.id)).map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                <button type="submit" className="btn btn-primary" style={{ padding: '0 1.5rem', borderRadius: 12 }}>Add to Path</button>
              </form>

              {/* Path Course Sequence */}
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Course Sequence</h3>
                {pathCourses.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 16 }}>
                    No courses in this path yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {pathCourses.map((c, i) => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: 16, background: 'white' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-element)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          {i + 1}
                        </div>
                        <div style={{ width: 60, height: 40, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-element)', flexShrink: 0 }}>
                          {c.thumbnail_url && <img src={c.thumbnail_url} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div style={{ flex: 1, fontWeight: 600, fontSize: '0.9375rem' }}>
                          {c.title}
                        </div>
                        <button onClick={() => handleRemoveCourse(c.id)} className="btn" style={{ padding: '0.5rem', color: 'var(--error)', background: 'rgba(225,112,85,0.05)', borderRadius: 8 }}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminPaths;
