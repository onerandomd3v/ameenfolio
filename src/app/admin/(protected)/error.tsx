"use client";

import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { GenerativeInlineLoader } from "@/components/ui/generative-loader";

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
          {retrying ? <GenerativeInlineLoader label="Retrying" /> : null}
          {retrying ? "Retrying…" : "Retry"}
        </Button>
      </div>
    </div>
  );
}
