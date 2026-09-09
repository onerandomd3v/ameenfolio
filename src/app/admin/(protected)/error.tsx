"use client";

import { AlertCircle, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { reset: () => void }) {
  const [retrying, setRetrying] = useState(false);

  function retry() {
    setRetrying(true);
    reset();
  }

  return (
    <div className="grid min-h-[50vh] w-full place-items-center px-5">
      <div className="flex w-full max-w-lg flex-col gap-4">
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Admin request failed</AlertTitle>
          <AlertDescription>
            The operation was logged on the server. Try the request again.
          </AlertDescription>
        </Alert>
        <Button className="self-center" onClick={retry} disabled={retrying}>
          {retrying ? <LoaderCircle className="animate-spin" /> : null}
          {retrying ? "Retrying…" : "Retry"}
        </Button>
      </div>
    </div>
  );
}
