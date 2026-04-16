import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

import { apiFetch } from "@/lib/api"
import { queryClient } from "@/lib/query-client"
import type { Category, CreateCategoryRequest, RenameCategoryRequest } from "@/types"

/**
 * Fetches the authenticated user's categories via `GET /api/categories`.
 *
 * Query key `["categories"]` enables targeted invalidation from mutation hooks.
 * Categories are returned ordered by name (server-side).
 */
export function useGetCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<Category[]>("/api/categories"),
  })
}

/**
 * Creates a new category via `POST /api/categories` with the mandatory three-step
 * optimistic update pattern: onMutate (snapshot + optimistic write) ->
 * onError (rollback) -> onSettled (revalidate from server).
 */
export function useCreateCategory() {
  return useMutation({
    mutationFn: (payload: CreateCategoryRequest) =>
      apiFetch<Category>("/api/categories", { method: "POST", body: payload }),

    onMutate: async (newCategory) => {
      // (a) Cancel outgoing refetches so they don't overwrite the optimistic update
      await queryClient.cancelQueries({ queryKey: ["categories"] })

      // (b) Snapshot current cache for rollback
      const previousCategories = queryClient.getQueryData<Category[]>(["categories"])

      // (c) Create temporary optimistic category (negative ID avoids collision with real IDs)
      const optimisticCategory: Category = {
        id: -Date.now(),
        userId: 0,
        name: newCategory.name,
        createdAt: new Date().toISOString(),
      }

      // (d) Prepend optimistic item to cache
      queryClient.setQueryData<Category[]>(["categories"], (old) => [
        optimisticCategory,
        ...(old ?? []),
      ])

      // (e) Return rollback context
      return { previousCategories }
    },

    onError: (_err, _vars, context) => {
      // Only roll back if we have a valid snapshot
      if (context?.previousCategories) {
        queryClient.setQueryData(["categories"], context.previousCategories)
      }
      toast.error("Failed to create category. Please try again.", { duration: 4000 })
    },

    onSettled: () => {
      // Revalidate from server (replaces temp category with real server response)
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}

/**
 * Renames an existing category via `PATCH /api/categories/{id}` with the mandatory
 * three-step optimistic update pattern: onMutate (snapshot + optimistic write) ->
 * onError (rollback) -> onSettled (revalidate from server).
 */
export function useRenameCategory() {
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & RenameCategoryRequest) =>
      apiFetch<Category>(`/api/categories/${id}`, { method: "PATCH", body: payload }),

    onMutate: async (variables) => {
      // (a) Cancel outgoing refetches so they don't overwrite the optimistic update
      await queryClient.cancelQueries({ queryKey: ["categories"] })

      // (b) Snapshot current cache for rollback
      const previousCategories = queryClient.getQueryData<Category[]>(["categories"])

      // (c) Optimistically update the category name in the cache
      queryClient.setQueryData<Category[]>(["categories"], (old) =>
        (old ?? []).map((c) =>
          c.id === variables.id ? { ...c, name: variables.name } : c
        )
      )

      // (d) Return rollback context
      return { previousCategories }
    },

    onError: (_err, _vars, context) => {
      // Only roll back if we have a valid snapshot
      if (context?.previousCategories) {
        queryClient.setQueryData(["categories"], context.previousCategories)
      }
      toast.error("Failed to rename category. Please try again.", { duration: 4000 })
    },

    onSettled: () => {
      // Revalidate from server to ensure cache matches server state
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}

/**
 * Response type for DELETE /api/categories/{id}.
 * The endpoint returns the number of affected todos (status 200, not 204).
 */
type DeleteCategoryResponse = { affectedTodos: number }

/**
 * Deletes a category via `DELETE /api/categories/{id}` with the mandatory
 * three-step optimistic update pattern: onMutate (snapshot + optimistic remove) ->
 * onError (rollback) -> onSettled (revalidate from server).
 *
 * CRITICAL: onSettled invalidates BOTH ["categories"] AND ["todos"] because
 * deleting a category sets category_id = NULL on affected todos (server-side cascade).
 */
export function useDeleteCategory() {
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      apiFetch<DeleteCategoryResponse>(`/api/categories/${id}`, { method: "DELETE" }),

    onMutate: async (variables) => {
      // (a) Cancel outgoing refetches so they don't overwrite the optimistic update
      await queryClient.cancelQueries({ queryKey: ["categories"] })

      // (b) Snapshot current cache for rollback
      const previousCategories = queryClient.getQueryData<Category[]>(["categories"])

      // (c) Optimistically remove the deleted category from the cache
      queryClient.setQueryData<Category[]>(["categories"], (old) =>
        (old ?? []).filter((c) => c.id !== variables.id)
      )

      // (d) Return rollback context
      return { previousCategories }
    },

    onError: (_err, _vars, context) => {
      // Only roll back if we have a valid snapshot
      if (context?.previousCategories) {
        queryClient.setQueryData(["categories"], context.previousCategories)
      }
      toast.error("Failed to delete category. Please try again.", { duration: 4000 })
    },

    onSettled: () => {
      // Revalidate BOTH query keys: categories cache AND todos cache
      // (deleting a category sets category_id = NULL on affected todos server-side)
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })
}
