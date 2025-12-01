import { axiosInstance } from "@/helpers/axios/axiosInstance";
import {
  useQuery,
  UseQueryResult,
  UseQueryOptions,
} from "@tanstack/react-query";
import type { AxiosRequestConfig } from "axios";
import { toast } from "react-toastify";

// Type definition for API errors (from your axios instance)
interface ApiError {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}

// Options type for the hook
interface UseGetOptions<T>
  extends Omit<UseQueryOptions<T, ApiError>, "queryKey" | "queryFn"> {
  config?: AxiosRequestConfig;
  showErrorToast?: boolean;
  errorMessage?: string;
}

/**
 * Custom hook for GET requests using React Query
 *
 * @param endpoint - API endpoint to fetch from
 * @param queryKey - Unique key for the query
 * @param options - Additional options for the query
 * @returns React Query result
 *
 * @example
 * const { data, isLoading, error } = useGet<User[]>(
 *   '/users',
 *   ['users'],
 *   { enabled: true, showErrorToast: true }
 * );
 */
export const useGet = <T>(
  endpoint: string,
  queryKey: string[],
  options?: UseGetOptions<T>
): UseQueryResult<T, ApiError> => {
  const {
    config,
    showErrorToast = true,
    errorMessage,
    enabled = true,
    ...queryOptions
  } = options || {};

  return useQuery<T, ApiError>({
    queryKey,
    queryFn: async () => {
      try {
        // axiosInstance already returns response.data directly
        const data = await axiosInstance.get<T>(endpoint, config);
        return data as T;
      } catch (error) {
        const apiError = error as ApiError;

        // Show error toast if enabled
        if (showErrorToast) {
          const message =
            errorMessage || apiError.message || "Failed to fetch data";
          toast.error(message);
        }

        // Re-throw error for React Query to handle
        throw apiError;
      }
    },
    enabled,
    ...queryOptions,
  });
};

/**
 * Extended version with automatic refetching and stale time configuration
 *
 * @example
 * const { data } = useGetWithRefetch<Dashboard>(
 *   '/dashboard',
 *   ['dashboard'],
 *   { refetchInterval: 30000 } // Refetch every 30 seconds
 * );
 */
export const useGetWithRefetch = <T>(
  endpoint: string,
  queryKey: string[],
  options?: UseGetOptions<T> & {
    refetchInterval?: number;
    staleTime?: number;
  }
): UseQueryResult<T, ApiError> => {
  const {
    refetchInterval = 0,
    staleTime = 5 * 60 * 1000, // 5 minutes default
    ...restOptions
  } = options || {};

  return useGet<T>(endpoint, queryKey, {
    ...restOptions,
    refetchInterval,
    staleTime,
    refetchOnWindowFocus: true,
  });
};


//? How to use 

// Basic : 
// const { data, isLoading, error } = useGet<User[]>("/users", ["users"]);


// With options:

// const { data, isLoading } = useGet<User>(
//   '/user/123',
//   ['user', '123'],
//   {
//     enabled: !!userId,
//     showErrorToast: false, // Disable automatic toast
//     errorMessage: "Failed to load user profile",
//     retry: 3,
//     staleTime: 10000,
//   }
// );


// With refetching:
// const { data } = useGetWithRefetch<Dashboard>(
//   '/dashboard/stats',
//   ['dashboard-stats'],
//   {
//     refetchInterval: 30000, // Refetch every 30 seconds
//     staleTime: 5000,
//   }
// );
// With axios config:
// const { data } = useGet<SearchResults>(
//   '/search',
//   ['search', query],
//   {
//     config: {
//       params: { q: query, limit: 20 },
//       headers: { 'X-Custom-Header': 'value' },
//     },
//   }
// );
