import { AxiosError, AxiosRequestConfig } from "axios";
import { NextResponse } from "next/server";
import { apiClient } from "./apiClient";

export async function apiGet<T>(endpoint: string, config?: AxiosRequestConfig) {
  try {
    const response = await apiClient.get<T>(endpoint, config);
    return NextResponse.json({ data: response.data });
  } catch (error) {
    const err = error as AxiosError;
    return NextResponse.json(
      { error: err.message || "Failed to fetch data" },
      { status: err.response?.status || 500 }
    );
  }
}

export async function apiPost<TResponse, TBody>(
  endpoint: string,
  body: TBody,
  config?: AxiosRequestConfig
) {
  try {
    const response = await apiClient.post<TResponse>(endpoint, body, config);

    return NextResponse.json({
      data: response.data,
    });
  } catch (error) {
    const err = error as AxiosError;

    return NextResponse.json(
      {
        error: err.message || "Failed to perform POST request",
      },
      { status: err.response?.status ?? 500 }
    );
  }
}
