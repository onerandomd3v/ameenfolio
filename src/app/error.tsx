"use client";

import { AlertCircle, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  const [retrying, setRetrying] = useState(false);

  function retry() {
    setRetrying(true);
    reset();
  }

  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="flex w-full max-w-lg flex-col gap-4">
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            The portfolio could not be loaded. Please try again.
          </AlertDescription>
        </Alert>
        <Button onClick={retry} disabled={retrying} className="self-center">
          {retrying ? <LoaderCircle className="animate-spin" /> : null}
          {retrying ? "Retrying…" : "Try again"}
        </Button>
      </div>
    </main>
  );
}
