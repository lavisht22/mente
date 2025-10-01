import { Button, Input, addToast } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import supabase from "@/lib/supabase";

export const Route = createFileRoute("/auth")({
  component: RouteComponent,
});

function RouteComponent() {
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendMagicLink = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });

      if (error) {
        throw error;
      }

      setMagicLinkSent(true);
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to send magic link. Please try again.",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, [email]);

  if (magicLinkSent) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="flex flex-col gap-4 w-full max-w-md p-4">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p>
            We sent a magic link to {email}. Please check your inbox to
            continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="flex flex-col gap-4 w-full max-w-md p-4">
        <h1 className="text-2xl font-bold">Log In</h1>
        <Input
          placeholder="Email"
          value={email}
          onValueChange={setEmail}
          disabled={loading}
        />
        <Button
          color="primary"
          fullWidth
          isLoading={loading}
          onPress={sendMagicLink}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
