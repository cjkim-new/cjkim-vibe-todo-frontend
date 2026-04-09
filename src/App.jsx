import { useCallback, useEffect, useState } from 'react'
import './App.css'

const API_URL =
  import.meta.env.VITE_TODOS_API_URL ??
  'https://cjkim-vive-todo-backend-e1c570baeabe.herokuapp.com/todos'
const getErrorMessage = async (response, fallbackMessage) => {
  try {
    const data = await response.json()
    return data.message ?? fallbackMessage
  } catch {
    return fallbackMessage
  }
}

function App() {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchTodos = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(API_URL)
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, '할일 목록을 불러오지 못했습니다.'))
      }

      const data = await response.json()
      setTodos(data)
    } catch (fetchError) {
      setError(fetchError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  const handleCreate = async (event) => {
    event.preventDefault()

    if (!newTodo.trim()) {
      setError('할일을 입력해주세요.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newTodo }),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, '할일 추가에 실패했습니다.'))
      }

      const createdTodo = await response.json()
      setTodos((prevTodos) => [createdTodo, ...prevTodos])
      setNewTodo('')
    } catch (createError) {
      setError(createError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (todo) => {
    setEditingId(todo._id)
    setEditingText(todo.text)
    setError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingText('')
  }

  const handleUpdate = async (todoId) => {
    if (!editingText.trim()) {
      setError('수정할 할일을 입력해주세요.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/${todoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editingText }),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, '할일 수정에 실패했습니다.'))
      }

      const updatedTodo = await response.json()
      setTodos((prevTodos) =>
        prevTodos.map((todo) => (todo._id === updatedTodo._id ? updatedTodo : todo)),
      )
      cancelEdit()
    } catch (updateError) {
      setError(updateError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (todoId) => {
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/${todoId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, '할일 삭제에 실패했습니다.'))
      }

      setTodos((prevTodos) => prevTodos.filter((todo) => todo._id !== todoId))
      if (editingId === todoId) {
        cancelEdit()
      }
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="app">
      <section className="todo-card">
        <h1>Todo App</h1>

        <form className="todo-form" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="새 할일을 입력하세요"
            value={newTodo}
            onChange={(event) => setNewTodo(event.target.value)}
            disabled={submitting}
          />
          <button type="submit" disabled={submitting}>
            추가
          </button>
        </form>

        <div className="toolbar">
          <button type="button" onClick={fetchTodos} disabled={loading || submitting}>
            새로고침
          </button>
        </div>

        {error ? <p className="status error">{error}</p> : null}
        {loading ? <p className="status">불러오는 중...</p> : null}

        {!loading && todos.length === 0 ? <p className="status">할일이 없습니다.</p> : null}

        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo._id}>
              {editingId === todo._id ? (
                <div className="todo-edit-row">
                  <input
                    type="text"
                    value={editingText}
                    onChange={(event) => setEditingText(event.target.value)}
                    disabled={submitting}
                  />
                  <button type="button" onClick={() => handleUpdate(todo._id)} disabled={submitting}>
                    저장
                  </button>
                  <button type="button" className="ghost" onClick={cancelEdit} disabled={submitting}>
                    취소
                  </button>
                </div>
              ) : (
                <div className="todo-row">
                  <span>{todo.text}</span>
                  <div className="actions">
                    <button type="button" onClick={() => startEdit(todo)} disabled={submitting}>
                      수정
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => handleDelete(todo._id)}
                      disabled={submitting}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default App
