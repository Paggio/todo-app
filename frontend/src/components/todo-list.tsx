import { TodoItem } from "@/components/todo-item"
import { useDeleteTodo, useUpdateTodo } from "@/hooks/use-todos"
import type { Todo } from "@/types"

type TodoListProps = {
  todos: Todo[]
}

/**
 * Renders the active (incomplete) todos section.
 * Expects pre-filtered active todos from the parent.
 */
export function TodoList({ todos }: TodoListProps) {
  const updateTodo = useUpdateTodo()
  const deleteTodo = useDeleteTodo()

  return (
    <div role="list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={() =>
            updateTodo.mutate({ id: todo.id, isCompleted: !todo.isCompleted })
          }
          onDelete={() => deleteTodo.mutate({ id: todo.id })}
        />
      ))}
    </div>
  )
}
