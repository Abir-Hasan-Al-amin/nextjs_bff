"use client";
import { axiosInstance } from "@/helpers/axios/axiosInstance";
import { usePost } from "@/hooks/useMutations";
import { useEffect } from "react";

const Home = () => {
  const { mutate: logout, isPending, error, isError } = usePost("/auth/logout");

  // useEffect(() => {
  //   axiosInstance
  //     .post("/auth/me")
  //     .then(() => console.log("Token refreshed"))
  //     .catch((err) => console.log("Refresh failed:", err));
  // }, []);

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        console.log("Logged out successfully");
        window.location.href = "/login";
      },
      onError: (err) => {
        console.error("Logout failed:", err);
      },
    });
  };

  return (
    <div className="p-4">
      <button
        onClick={handleLogout}
        disabled={isPending}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        {isPending ? "Logging out..." : "Logout"}
      </button>
      {isError && <p className="text-red-500 mt-2">{error?.message}</p>}
    </div>
  );
};

export default Home;
