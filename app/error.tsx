"use client";

import { useEffect } from "react";
import { Button } from "@heroui/react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    // Silent fail
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <Button
        onClick={() => reset()}
        color="primary"
        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      >
        Try again
      </Button>
    </div>
  );
}
