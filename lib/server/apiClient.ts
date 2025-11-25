import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.MAIN_API_URL,
  timeout: 30000,
});
