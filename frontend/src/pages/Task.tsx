import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useApp } from '../context/AppContext';

interface Task {
  id: number;
  title: string;
  due_date: string | null;
  completed: number;
}

const TaskPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [dueDate, setDueDate] = useState('');
  const { addToast } = useApp();

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = () => {
    api.get('/users/tasks').then(res => setTasks(res.data)).catch(() => {});
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    try {
      const res = await api.post('/users/tasks', { title: newTask, due_date: dueDate || null });
      setTasks([res.data, ...tasks]);
      setNewTask('');
      setDueDate('');
      addToast('Task added', 'success');
    } catch { addToast('Error adding task', 'error'); }
  };

  const toggleTask = async (task: Task) => {
    try {
      const updated = !task.completed;
      await api.put(`/users/tasks/${task.id}`, { completed: updated });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: updated ? 1 : 0 } : t));
    } catch { addToast('Error updating task', 'error'); }
  };

  const deleteTask = async (id: number) => {
    try {
      await api.delete(`/users/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
      addToast('Task deleted', 'info');
    } catch { addToast('Error deleting task', 'error'); }
  };

  return (
    <Layout>
      <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: '1rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '2rem' }}>Your Tasks</h2>

        <div className="card" style={{ marginBottom: '2rem' }}>
          <form onSubmit={addTask} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="What do you need to learn today?" 
              value={newTask} 
              onChange={e => setNewTask(e.target.value)} 
              style={{ flex: 1, padding: '0.875rem 1rem', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-main)', fontSize: '0.9375rem' }} 
            />
            <input 
              type="date" 
              value={dueDate} 
              onChange={e => setDueDate(e.target.value)} 
              style={{ padding: '0.875rem 1rem', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-main)', fontSize: '0.9375rem' }} 
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.875rem 1.5rem' }}>Add Task</button>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No tasks yet. Stay organized by adding some!
            </div>
          )}
          {tasks.map(task => {
            const isOverdue = task.due_date && !task.completed && new Date(task.due_date) < new Date(new Date().setHours(0,0,0,0));
            return (
              <div key={task.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', opacity: task.completed ? 0.6 : 1, transition: 'all 0.2s' }}>
                <input 
                  type="checkbox" 
                  checked={!!task.completed} 
                  onChange={() => toggleTask(task)} 
                  style={{ width: 22, height: 22, cursor: 'pointer', accentColor: 'var(--primary)' }} 
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-main)', textDecoration: task.completed ? 'line-through' : 'none' }}>
                    {task.title}
                  </div>
                  {task.due_date && (
                    <div style={{ fontSize: '0.8125rem', color: isOverdue ? '#e17055' : 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: isOverdue ? 700 : 500 }}>
                      Due: {new Date(task.due_date).toLocaleDateString()} {isOverdue ? '(Overdue)' : ''}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => deleteTask(task.id)} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: 8 }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-element)'}
                  onMouseOut={e => e.currentTarget.style.background = 'none'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default TaskPage;
