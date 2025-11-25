"use client";
import { useGet } from "@/hooks/useGet";

type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

export default function TodosPage() {
  const { data, isLoading, isError } = useGet<Todo[]>("/api/todos", ["todos"]);
  if (isLoading) return <div>Loading todos...</div>;
  if (isError) return <div>Error loading todos!</div>;

  return (
    <div>
      <h1>Todos via BFF</h1>

      <ul>
        {data?.map((todo) => (
          <li key={todo.id}>
            {todo.title} - {todo.completed ? "✅" : "❌"}
          </li>
        ))}
      </ul>
    </div>
  );
}
