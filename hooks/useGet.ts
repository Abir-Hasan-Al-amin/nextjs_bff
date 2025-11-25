import { axiosInstance } from "@/helpers/axios/axiosInstance";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import type { AxiosError, AxiosRequestConfig } from "axios";
import { toast } from "react-toastify";

export const useGet = <T>(
  endpoint: string,
  queryKey: string[],
  enabled: boolean = true,
  config?: AxiosRequestConfig
): UseQueryResult<T, AxiosError> => {
  return useQuery<T, AxiosError>({
    queryKey,
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<T>(endpoint, config);
        return response?.data;
      } catch (error) {
        const err = error as AxiosError;
        toast.error(err.message || "Failed to fetch data.");
        throw err;
      }
    },
    enabled,
  });
};
