'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { TodoItem, TodoDay } from '@/lib/schemas/todo';
import { useAppStore } from '@/lib/store';

export function useTripTodos(tripId: string | null) {
  const { firebaseUser } = useAppStore();
  const [todoDays, setTodoDays] = useState<TodoDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const initializingRef = useRef(false);

  useEffect(() => {
    if (!tripId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Real-time listener for todos
    const todosRef = collection(db, 'trips', tripId, 'todos');
    const q = query(todosRef, orderBy('dayNumber'), orderBy('order'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const todos: TodoItem[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as TodoItem));

        // Group todos by day
        const dayMap = new Map<number, TodoItem[]>();
        todos.forEach(todo => {
          const dayTodos = dayMap.get(todo.dayNumber) || [];
          dayTodos.push(todo);
          dayMap.set(todo.dayNumber, dayTodos);
        });

        // Convert to TodoDay array
        const days: TodoDay[] = Array.from(dayMap.entries())
          .sort(([a], [b]) => a - b)
          .map(([dayNumber, todos]) => ({
            dayNumber,
            todos,
            completedCount: todos.filter(t => t.isCompleted).length,
            totalCount: todos.length,
          }));

        setTodoDays(days);
        setInitialized(todos.length > 0);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to todos:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tripId]);

  const initializeTodos = useCallback(async () => {
    if (!tripId || initializingRef.current) return;

    const user = firebaseUser || auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    initializingRef.current = true;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/trips/${tripId}/todos/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initialize todos');
      }

      const data = await response.json();
      console.log('Todos initialized:', data);
    } catch (error) {
      console.error('Error initializing todos:', error);
      throw error;
    } finally {
      initializingRef.current = false;
    }
  }, [tripId, firebaseUser]);

  const toggleTodo = useCallback(async (todoId: string, isCompleted: boolean) => {
    if (!tripId) return;

    const user = firebaseUser || auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/trips/${tripId}/todos/${todoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isCompleted }),
      });

      if (!response.ok) {
        throw new Error('Failed to update todo');
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
      throw error;
    }
  }, [tripId]);

  const addTodo = useCallback(async (dayNumber: number, activityName: string, description?: string) => {
    if (!tripId) return;

    const user = firebaseUser || auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Get max order for this day
      const dayTodos = todoDays.find(d => d.dayNumber === dayNumber)?.todos || [];
      const maxOrder = dayTodos.length > 0 
        ? Math.max(...dayTodos.map(t => t.order))
        : 0;

      const token = await user.getIdToken();
      const response = await fetch(`/api/trips/${tripId}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dayNumber,
          activityName,
          description,
          isCustom: true,
          order: maxOrder + 1,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add todo');
      }
    } catch (error) {
      console.error('Error adding todo:', error);
      throw error;
    }
  }, [tripId, todoDays, firebaseUser]);

  const updateTodo = useCallback(async (todoId: string, activityName: string, description?: string) => {
    if (!tripId) return;

    const user = firebaseUser || auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/trips/${tripId}/todos/${todoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activityName, description }),
      });

      if (!response.ok) {
        throw new Error('Failed to update todo');
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      throw error;
    }
  }, [tripId]);

  const deleteTodo = useCallback(async (todoId: string) => {
    if (!tripId) return;

    const user = firebaseUser || auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/trips/${tripId}/todos/${todoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete todo');
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      throw error;
    }
  }, [tripId]);

  return {
    todoDays,
    loading,
    initialized,
    initializeTodos,
    toggleTodo,
    addTodo,
    updateTodo,
    deleteTodo,
  };
}
