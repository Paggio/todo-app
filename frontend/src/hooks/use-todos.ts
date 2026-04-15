import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

import { apiFetch } from "@/lib/api"
import { queryClient } from "@/lib/query-client"
import type { CreateTodoRequest, Todo, UpdateTodoRequest } from "@/types"

/**
 * Fetches the authenticated user's todos via `GET /api/todos`.
 *
 * Query key `["todos"]` enables targeted invalidation from mutation hooks
 * in Stories 3.3-3.5 via `queryClient.invalidateQueries({ queryKey: ["todos"] })`.
 */
export function useGetTodos() {
  return useQuery({
    queryKey: ["todos"],
    queryFn: () => apiFetch<Todo[]>("/api/todos"),
  })
}

/**
 * Creates a new todo via `POST /api/todos` with the mandatory three-step
 * optimistic update pattern: onMutate (snapshot + optimistic write) →
 * onError (rollback) → onSettled (revalidate from server).
 */
export function useCreateTodo() {
  return useMutation({
    mutationFn: (payload: CreateTodoRequest) =>
      apiFetch<Todo>("/api/todos", { method: "POST", body: payload }),

    onMutate: async (newTodo) => {
      // (a) Cancel outgoing refetches so they don't overwrite the optimistic update
      await queryClient.cancelQueries({ queryKey: ["todos"] })

      // (b) Snapshot current cache for rollback
      const previousTodos = queryClient.getQueryData<Todo[]>(["todos"])

      // (c) Create temporary optimistic todo (negative ID avoids collision with real IDs)
      const optimisticTodo: Todo = {
        id: -Date.now(),
        userId: 0,
        description: newTodo.description,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      }

      // (d) Prepend optimistic item to cache (most recent first, matching API sort order)
      queryClient.setQueryData<Todo[]>(["todos"], (old) => [
        optimisticTodo,
        ...(old ?? []),
      ])

      // (e) Return rollback context
      return { previousTodos }
    },

    onError: (_err, _vars, context) => {
      // Only roll back if we have a valid snapshot; avoids clearing the cache
      // when onMutate threw before producing a snapshot
      if (context?.previousTodos) {
        queryClient.setQueryData(["todos"], context.previousTodos)
      }
      toast.error("Failed to create todo. Please try again.")
    },

    onSettled: () => {
      // Revalidate from server (replaces temp todo with real server response)
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })
}

/**
 * Deletes a todo via `DELETE /api/todos/{id}` with the mandatory three-step
 * optimistic update pattern: onMutate (snapshot + optimistic remove) →
 * onError (rollback) → onSettled (revalidate from server).
 *
 * The DELETE endpoint returns 204 No Content (no response body).
 */
export function useDeleteTodo() {
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      apiFetch<void>(`/api/todos/${id}`, { method: "DELETE" }),

    onMutate: async (variables) => {
      // (a) Cancel outgoing refetches so they don't overwrite the optimistic update
      await queryClient.cancelQueries({ queryKey: ["todos"] })

      // (b) Snapshot current cache for rollback
      const previousTodos = queryClient.getQueryData<Todo[]>(["todos"])

      // (c) Optimistically remove the deleted todo from the cache
      queryClient.setQueryData<Todo[]>(["todos"], (old) =>
        (old ?? []).filter((t) => t.id !== variables.id)
      )

      // (d) Return rollback context
      return { previousTodos }
    },

    onError: (_err, _vars, context) => {
      // Only roll back if we have a valid snapshot; avoids clearing the cache
      // when onMutate threw before producing a snapshot
      if (context?.previousTodos) {
        queryClient.setQueryData(["todos"], context.previousTodos)
      }
      toast.error("Failed to delete todo. Please try again.")
    },

    onSettled: () => {
      // Revalidate from server to ensure cache matches server state
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })
}

/**
 * Updates an existing todo via `PATCH /api/todos/{id}` with the mandatory
 * three-step optimistic update pattern: onMutate (snapshot + optimistic write)
 * → onError (rollback) → onSettled (revalidate from server).
 *
 * Used for toggling completion status (Stories 3.4) and potentially
 * description edits in the future. The `api.ts` utility automatically
 * transforms camelCase keys to snake_case for the request body.
 */
export function useUpdateTodo() {
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & UpdateTodoRequest) =>
      apiFetch<Todo>(`/api/todos/${id}`, { method: "PATCH", body: payload }),

    onMutate: async (variables) => {
      // (a) Cancel outgoing refetches so they don't overwrite the optimistic update
      await queryClient.cancelQueries({ queryKey: ["todos"] })

      // (b) Snapshot current cache for rollback
      const previousTodos = queryClient.getQueryData<Todo[]>(["todos"])

      // (c) Optimistically update the toggled todo in the cache
      queryClient.setQueryData<Todo[]>(["todos"], (old) =>
        (old ?? []).map((t) =>
          t.id === variables.id
            ? { ...t, isCompleted: variables.isCompleted ?? t.isCompleted }
            : t
        )
      )

      // (d) Return rollback context
      return { previousTodos }
    },

    onError: (_err, _vars, context) => {
      // Only roll back if we have a valid snapshot; avoids clearing the cache
      // when onMutate threw before producing a snapshot
      if (context?.previousTodos) {
        queryClient.setQueryData(["todos"], context.previousTodos)
      }
      toast.error("Failed to update todo. Please try again.")
    },

    onSettled: () => {
      // Revalidate from server to ensure cache matches server state
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })
}
