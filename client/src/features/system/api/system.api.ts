import { apiClient } from "@/lib/api-client";

export interface HealthResponse {
  message: string;
  database: string;
}

export function getHealth() {
  return apiClient<HealthResponse>("/");
}