import { axiosInstance } from "@/helpers/axios/axiosInstance";
import {
  useMutation,
  UseMutationResult,
  UseMutationOptions,
  MutationMeta,
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
interface UsePostOptions<TResponse, TBody, TContext = unknown>
  extends Omit<
    UseMutationOptions<TResponse, ApiError, TBody, TContext>,
    "mutationFn"
  > {
  config?: AxiosRequestConfig;
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  errorMessage?: string;
  successMessage?: string;
}

/**
 * Custom hook for POST requests using React Query
 *
 * @param endpoint - API endpoint to post to
 * @param options - Additional options for the mutation
 * @returns React Query mutation result
 *
 * @example
 * const createUser = usePost<User, CreateUserRequest>(
 *   '/users',
 *   {
 *     successMessage: 'User created successfully',
 *     onSuccess: (data) => {
 *       // Handle success
 *     }
 *   }
 * );
 *
 * createUser.mutate({ name: 'John', email: 'john@example.com' });
 */
export const usePost = <TResponse, TBody = unknown, TContext = unknown>(
  endpoint: string,
  options?: UsePostOptions<TResponse, TBody, TContext>
): UseMutationResult<TResponse, ApiError, TBody, TContext> => {
  const {
    config,
    showErrorToast = true,
    showSuccessToast = false,
    errorMessage,
    successMessage,
    onSuccess,
    onError,
    ...mutationOptions
  } = options || {};

  return useMutation<TResponse, ApiError, TBody, TContext>({
    mutationFn: async (body: TBody) => {
      // axiosInstance already returns response.data directly
      const data = await axiosInstance.post<TResponse>(endpoint, body, config);
      return data as TResponse;
    },
    onSuccess: (data, variables, context, mutationMeta) => {
      // Show success toast if enabled
      if (showSuccessToast && successMessage) {
        toast.success(successMessage);
      }

      // Call user-provided onSuccess
      if (onSuccess) {
        onSuccess(data, variables, context, mutationMeta);
      }
    },
    onError: (error, variables, context, mutationMeta) => {
      // Show error toast if enabled
      if (showErrorToast) {
        const message = errorMessage || error.message || "Failed to post data";
        toast.error(message);

        // Show validation errors if present
        if (error.errors) {
          Object.entries(error.errors).forEach(([field, messages]) => {
            messages.forEach((msg) => {
              toast.error(`${field}: ${msg}`);
            });
          });
        }
      }

      // Call user-provided onError
      if (onError) {
        onError(error, variables, context, mutationMeta);
      }
    },
    ...mutationOptions,
  });
};

/**
 * Hook for PUT requests (updates)
 *
 * @example
 * const updateUser = usePut<User, UpdateUserRequest>(
 *   '/users/123',
 *   { successMessage: 'User updated successfully' }
 * );
 */
export const usePut = <TResponse, TBody = unknown, TContext = unknown>(
  endpoint: string,
  options?: UsePostOptions<TResponse, TBody, TContext>
): UseMutationResult<TResponse, ApiError, TBody, TContext> => {
  const {
    config,
    showErrorToast = true,
    showSuccessToast = false,
    errorMessage,
    successMessage,
    onSuccess,
    onError,
    ...mutationOptions
  } = options || {};

  return useMutation<TResponse, ApiError, TBody, TContext>({
    mutationFn: async (body: TBody) => {
      const data = await axiosInstance.put<TResponse>(endpoint, body, config);
      return data as TResponse;
    },
    onSuccess: (data, variables, context, mutationMeta) => {
      if (showSuccessToast && successMessage) {
        toast.success(successMessage);
      }
      if (onSuccess) {
        onSuccess(data, variables, context, mutationMeta);
      }
    },
    onError: (error, variables, context, mutationMeta) => {
      if (showErrorToast) {
        const message =
          errorMessage || error.message || "Failed to update data";
        toast.error(message);

        if (error.errors) {
          Object.entries(error.errors).forEach(([field, messages]) => {
            messages.forEach((msg) => {
              toast.error(`${field}: ${msg}`);
            });
          });
        }
      }
      if (onError) {
        onError(error, variables, context, mutationMeta);
      }
    },
    ...mutationOptions,
  });
};

/**
 * Hook for PATCH requests (partial updates)
 *
 * @example
 * const patchUser = usePatch<User, Partial<User>>(
 *   '/users/123',
 *   { successMessage: 'User updated successfully' }
 * );
 */
export const usePatch = <TResponse, TBody = unknown, TContext = unknown>(
  endpoint: string,
  options?: UsePostOptions<TResponse, TBody, TContext>
): UseMutationResult<TResponse, ApiError, TBody, TContext> => {
  const {
    config,
    showErrorToast = true,
    showSuccessToast = false,
    errorMessage,
    successMessage,
    onSuccess,
    onError,
    ...mutationOptions
  } = options || {};

  return useMutation<TResponse, ApiError, TBody, TContext>({
    mutationFn: async (body: TBody) => {
      const data = await axiosInstance.patch<TResponse>(endpoint, body, config);
      return data as TResponse;
    },
    onSuccess: (data, variables, context, mutationMeta) => {
      if (showSuccessToast && successMessage) {
        toast.success(successMessage);
      }
      if (onSuccess) {
        onSuccess(data, variables, context, mutationMeta);
      }
    },
    onError: (error, variables, context, mutationMeta) => {
      if (showErrorToast) {
        const message =
          errorMessage || error.message || "Failed to update data";
        toast.error(message);

        if (error.errors) {
          Object.entries(error.errors).forEach(([field, messages]) => {
            messages.forEach((msg) => {
              toast.error(`${field}: ${msg}`);
            });
          });
        }
      }
      if (onError) {
        onError(error, variables, context, mutationMeta);
      }
    },
    ...mutationOptions,
  });
};

/**
 * Hook for DELETE requests
 *
 * @example
 * const deleteUser = useDelete<void>(
 *   '/users/123',
 *   { successMessage: 'User deleted successfully' }
 * );
 */
export const useDelete = <TResponse = void, TContext = unknown>(
  endpoint: string,
  options?: Omit<UsePostOptions<TResponse, void, TContext>, "config"> & {
    config?: Omit<AxiosRequestConfig, "data">;
  }
): UseMutationResult<TResponse, ApiError, void, TContext> => {
  const {
    config,
    showErrorToast = true,
    showSuccessToast = false,
    errorMessage,
    successMessage,
    onSuccess,
    onError,
    ...mutationOptions
  } = options || {};

  return useMutation<TResponse, ApiError, void, TContext>({
    mutationFn: async () => {
      const data = await axiosInstance.delete<TResponse>(endpoint, config);
      return data as TResponse;
    },
    onSuccess: (data, variables, context, mutationMeta) => {
      if (showSuccessToast && successMessage) {
        toast.success(successMessage);
      }
      if (onSuccess) {
        onSuccess(data, variables, context, mutationMeta);
      }
    },
    onError: (error, variables, context, mutationMeta) => {
      if (showErrorToast) {
        const message =
          errorMessage || error.message || "Failed to delete data";
        toast.error(message);
      }
      if (onError) {
        onError(error, variables, context, mutationMeta);
      }
    },
    ...mutationOptions,
  });
};
