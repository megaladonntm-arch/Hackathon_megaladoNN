import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../AuthContext';

export default function TodoPage() {
  const { token, isAuthed } = useAuth();
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('');

  const loadTodos = useCallback(async () => {
    if (!token) return;
    const data = await apiFetch('/api/todos', {}, token);
    setTodos(data);
  }, [token]);

  useEffect(() => {
    if (isAuthed) {
      loadTodos();
    }
  }, [isAuthed, loadTodos]);

  const addTodo = async (event) => {
    event.preventDefault();
    if (!title.trim()) return;
    setStatus('');
    try {
      const todo = await apiFetch(
        '/api/todos',
        { method: 'POST', body: JSON.stringify({ title: title.trim() }) },
        token
      );
      setTodos((prev) => [todo, ...prev]);
      setTitle('');
    } catch (err) {
      setStatus('Saqlashda xatolik.');
    }
  };

  const toggleTodo = async (todo) => {
    try {
      const updated = await apiFetch(
        `/api/todos/${todo.id}`,
        { method: 'PATCH', body: JSON.stringify({ is_done: !todo.is_done }) },
        token
      );
      setTodos((prev) => prev.map((item) => (item.id === todo.id ? updated : item)));
    } catch (err) {
      setStatus('Yangilashda xatolik.');
    }
  };

  const deleteTodo = async (todoId) => {
    try {
      await apiFetch(`/api/todos/${todoId}`, { method: 'DELETE' }, token);
      setTodos((prev) => prev.filter((item) => item.id !== todoId));
    } catch (err) {
      setStatus("O'chirishda xatolik.");
    }
  };

  if (!isAuthed) {
    return (
      <div className="page">
        <div className="section">
          <h2>To Do</h2>
          <p className="muted">To do ro'yxatini ko'rish uchun login qiling.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page todo-page">
      <div className="section todo-card">
        <h1>To Do list</h1>
        <p className="muted">Shaxsiy vazifalar ro'yxati.</p>
        <form className="todo-form" onSubmit={addTodo}>
          <input
            placeholder="Yangi vazifa..."
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <button className="primary-btn">Qo'shish</button>
        </form>
        {status ? <p className="status-text">{status}</p> : null}
        <div className="todo-list">
          {todos.length === 0 ? <p className="muted">Hozircha vazifa yo'q.</p> : null}
          {todos.map((todo) => (
            <div key={todo.id} className={todo.is_done ? 'todo-item done' : 'todo-item'}>
              <button className="todo-check" onClick={() => toggleTodo(todo)}>
                {todo.is_done ? '✓' : '○'}
              </button>
              <span>{todo.title}</span>
              <button className="todo-delete" onClick={() => deleteTodo(todo.id)}>
                O'chirish
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
