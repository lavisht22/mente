import { Button, Input, InputOtp } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import Logo from "@/components/logo";
import supabase from "@/lib/supabase";
import { LucideArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: RouteComponent,
});

function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });

      if (error) {
        throw error;
      }

      setError(null);
      setOtpSent(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, [email]);

  const verifyOtp = useCallback(
    async (otpValue: string) => {
      if (otpValue.length !== 6) {
        return;
      }

      setLoading(true);

      try {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: otpValue,
          type: "email",
        });

        if (error) {
          throw error;
        }

        await navigate({ to: "/" });
        setError(null);
        setOtp("");
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
      } finally {
        setLoading(false);
      }
    },
    [email, navigate],
  );

  if (otpSent) {
    return (
      <>
        <div className="space-y-1 w-full">
          <h2 className="text-2xl font-bold">Enter code</h2>
          <p className="text-default-600">We sent a 6-digit code to {email}</p>
        </div>

        <InputOtp
          size="sm"
          autoFocus
          length={6}
          value={otp}
          onValueChange={(value) => {
            setOtp(value);
            if (value.length === 6) {
              verifyOtp(value);
            }
          }}
          isInvalid={!!error}
          errorMessage={error || undefined}
        />

        <div className="flex gap-2 w-full">
          <Button
            variant="flat"
            startContent={<LucideArrowLeft className="size-4" />}
            fullWidth
            onPress={() => {
              setOtpSent(false);
              setOtp("");
              setError(null);
            }}
            isDisabled={loading}
          >
            Change Email
          </Button>
          <Button
            color="primary"
            fullWidth
            isLoading={loading}
            onPress={() => verifyOtp(otp)}
            isDisabled={otp.length !== 6}
          >
            Continue
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-1 w-full">
        <h2 className="text-2xl font-bold">Sign in</h2>
        <p className="text-default-600">
          Enter your email to receive a one-time code.
        </p>
      </div>
      <Input
        placeholder="Email"
        value={email}
        onValueChange={setEmail}
        disabled={loading}
        isInvalid={!!error}
        errorMessage={error || undefined}
      />
      <Button color="primary" fullWidth isLoading={loading} onPress={sendOtp}>
        Continue
      </Button>
    </>
  );
}

function RouteComponent() {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 w-full max-w-md p-4 -mt-32">
        <div className="flex justify-center items-center gap-2 mb-8 border-b border-default-200 p-4 w-fit">
          <Logo size={5} />
          <h1 className="text-3xl">mente</h1>
        </div>

        <Auth />
      </div>
    </div>
  );
}
