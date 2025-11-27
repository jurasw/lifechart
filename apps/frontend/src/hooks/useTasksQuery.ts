import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/services/tasksApi'
import type { Task } from '@/types/task'

export const useTasksQuery = () => {
  const queryClient = useQueryClient()

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const apiTasks = await tasksApi.getAll()
      return apiTasks
    },
  })

  const createMutation = useMutation({
    mutationFn: async (task: Omit<Task, 'id'>) => {
      return await tasksApi.create(task)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, task }: { id: string; task: Partial<Task> }) => {
      return await tasksApi.update(id, task)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await tasksApi.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const toggleCompleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await tasksApi.toggleComplete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const toggleDateMutation = useMutation({
    mutationFn: async ({ id, date }: { id: string; date: number }) => {
      return await tasksApi.toggleDate(id, date)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  return {
    tasks,
    isLoading,
    error,
    createTask: createMutation.mutateAsync,
    updateTask: updateMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
    toggleComplete: toggleCompleteMutation.mutateAsync,
    toggleDate: toggleDateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

