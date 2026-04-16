import { TodoItem } from "@/components/todo-item"
import { useDeleteTodo, useUpdateTodo } from "@/hooks/use-todos"
import type { Todo } from "@/types"

type TodoListProps = {
  todos: Todo[]
  announce?: (message: string) => void
}

/**
 * Renders the active (incomplete) todos section.
 * Expects pre-filtered active todos from the parent.
 * Returns null when empty to avoid screen reader "list, 0 items" announcement.
 */
export function TodoList({ todos, announce }: TodoListProps) {
  const updateTodo = useUpdateTodo()
  const deleteTodo = useDeleteTodo()

  if (todos.length === 0) return null

  return (
    <div role="list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={() => {
            announce?.(
              todo.isCompleted
                ? `${todo.description} marked as active`
                : `${todo.description} marked as complete`
            )
            updateTodo.mutate({ id: todo.id, isCompleted: !todo.isCompleted })
          }}
          onDelete={() => {
            announce?.(`${todo.description} deleted`)
            deleteTodo.mutate({ id: todo.id })
          }}
        />
      ))}
    </div>
  )
}
