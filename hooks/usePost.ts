import { axiosInstance } from "@/helpers/axios/axiosInstance"; // your main axios
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import type { AxiosError, AxiosRequestConfig } from "axios";
import { toast } from "react-toastify";

export const usePost = <TResponse, TBody = unknown>(
  endpoint: string,
  config?: AxiosRequestConfig
): UseMutationResult<TResponse, AxiosError, TBody> => {
  return useMutation<TResponse, AxiosError, TBody>({
    mutationFn: async (body: TBody) => {
      try {
        const response = await axiosInstance.post<TResponse>(
          endpoint,
          body,
          config
        );
        return response.data;
      } catch (error) {
        const err = error as AxiosError;
        toast.error(err.message || "Failed to post data.");
        throw err;
      }
    },
  });
};
