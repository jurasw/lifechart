import api from './api';
import type { Task } from '@/types/task';

export const tasksApi = {
  getAll: async (): Promise<Task[]> => {
    const response = await api.get('/tasks');
    return response.data.map((task: any) => ({
      ...task,
      id: task._id || task.id,
    }));
  },

  create: async (task: Omit<Task, 'id'>): Promise<Task> => {
    const response = await api.post('/tasks', task);
    return {
      ...response.data,
      id: response.data._id || response.data.id,
    };
  },

  update: async (id: string, task: Partial<Task>): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}`, task);
    return {
      ...response.data,
      id: response.data._id || response.data.id,
    };
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  toggleComplete: async (id: string): Promise<Task> => {
    const response = await api.post(`/tasks/${id}/toggle-complete`);
    return {
      ...response.data,
      id: response.data._id || response.data.id,
    };
  },

  toggleDate: async (id: string, date: number): Promise<Task> => {
    const response = await api.post(`/tasks/${id}/toggle-date`, { date });
    return {
      ...response.data,
      id: response.data._id || response.data.id,
    };
  },

  import: async (tasks: Omit<Task, 'id'>[]): Promise<{ created: number; skipped: number }> => {
    const response = await api.post('/tasks/import', { tasks });
    return response.data;
  },

  clearAll: async (): Promise<{ deleted: number }> => {
    const response = await api.delete('/tasks/clear-all');
    return response.data;
  },
};

