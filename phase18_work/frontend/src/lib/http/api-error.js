import axios from "axios";

export class ApiError extends Error {
  constructor({ message, status, code, details }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function normalizeApiError(error) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    return new ApiError({
      message: data?.message || error.message || "Request failed",
      status,
      code: data?.code || error.code,
      details: data?.errors || data,
    });
  }

  return new ApiError({
    message: error instanceof Error ? error.message : "Unknown API error",
  });
}
