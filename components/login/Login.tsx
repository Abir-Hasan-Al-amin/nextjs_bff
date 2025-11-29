"use client";
import { usePost } from "@/hooks/usePost";
import { LoginRequest, LoginResponse } from "@/types/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Login = () => {
  const router = useRouter();
  const [form, setForm] = useState<LoginRequest>({
    email: "",
    password: "",
  });

  const { mutate: login, isPending } = usePost<LoginResponse, LoginRequest>(
    "/auth/login",
    { headers: { "x-with-credentials": "false" } }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    login(form, {
      onSuccess: () => {
        router.push("/");
      },
      onError: (err) => {
        console.error("Login failed:", err);
      },
    });
  };

  return (
    <div className="max-w-sm mx-auto mt-20 p-4 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <button
          type="submit"
          disabled={isPending}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          {isPending ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
