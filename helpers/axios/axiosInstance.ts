import axios from "axios";

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 60000,
});

instance.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject({ statusCode: 0, message: "Network error" });
    }

    const status = error.response.status;
    const message = error.response.data?.message || "";

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await instance.get("/auth/refresh-token");
        return instance(originalRequest);
      } catch (e) {
        window.location.href = "/login";
        return Promise.reject({
          statusCode: 401,
          message: "Session expired",
        });
      }
    }

    if (status === 403) {
      return Promise.reject({ statusCode: 403, message: "Forbidden" });
    }

    return Promise.reject({
      statusCode: status,
      message,
      errors: error.response.data?.errors,
    });
  }
);

export { instance as axiosInstance };
