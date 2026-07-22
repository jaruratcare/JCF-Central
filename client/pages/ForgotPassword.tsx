import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/utils/supabase";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phase, setPhase] = useState<"request" | "verify">("request");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to request a password reset code.");
      }

      setMessage(
        data.message || `A password reset request was accepted for ${trimmedEmail}. If delivery is configured, the code should arrive shortly.`,
      );
      setPhase("verify");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to send the confirmation code.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const trimmedEmail = email.trim();
    const trimmedOtp = otp.trim();

    if (!trimmedEmail || !trimmedOtp) {
      setError("Please enter both your email and the verification code");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: trimmedOtp,
        type: "email",
      });

      if (verifyError) {
        throw verifyError;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setMessage("Password updated successfully. You can sign in with your new password.");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setPhase("request");

      window.setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to reset your password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary">JCF</h1>
        <p className="text-xs opacity-80 mt-1">Central Hub</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="rounded-xl shadow-lg p-8 bg-card border border-border">
            <h2 className="text-2xl font-bold mb-2 text-foreground">
              {phase === "request" ? "Forgot Password?" : "Reset Your Password"}
            </h2>
            <p className="text-sm mb-6 text-muted-foreground">
              {phase === "request"
                ? "Enter your email to receive a one-time password code."
                : "Enter the code sent to your inbox and choose a new password."}
            </p>

            {error && (
              <div className="mb-6 p-3 rounded-lg flex items-start gap-3 bg-destructive/10 border border-destructive">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {message && (
              <div className="mb-6 p-3 rounded-lg flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30">
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-600" />
                <p className="text-sm text-emerald-700">{message}</p>
              </div>
            )}

            <form
              onSubmit={phase === "request" ? handleSendOtp : handleResetPassword}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2 text-foreground"
                >
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full"
                />
              </div>

              {phase === "verify" && (
                <>
                  <div>
                    <label
                      htmlFor="otp"
                      className="block text-sm font-medium mb-2 text-foreground"
                    >
                      Verification Code
                    </label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium mb-2 text-foreground"
                    >
                      New Password
                    </label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium mb-2 text-foreground"
                    >
                      Confirm Password
                    </label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full font-medium py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-90 bg-primary text-primary-foreground"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {phase === "request" ? "Sending code..." : "Updating password..."}
                  </>
                ) : phase === "request" ? (
                  "Send Code"
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-sm text-muted-foreground">
              <Link to="/login" className="font-medium text-primary hover:underline">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border p-6 text-center">
        <p className="text-xs text-muted-foreground">
          © 2024 Jarurat Care Foundation. All rights reserved.
        </p>
      </div>
    </div>
  );
}
