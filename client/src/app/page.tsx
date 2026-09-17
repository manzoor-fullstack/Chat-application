"use client";

import { useHealth } from "@/features/system/hooks/use-health";

export default function Home() {
  const {
    data,
    isLoading,
    isError,
    error,
  } = useHealth();

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">
          SyncSpace
        </h1>

        {isLoading && (
          <p>Connecting to API...</p>
        )}

        {isError && (
          <p>
            API Error: {error.message}
          </p>
        )}

        {data && (
          <div>
            <p>{data.message}</p>

            <p>
              Database: {data.database}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}