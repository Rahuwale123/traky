import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { useResetPassword } from "../hooks";
import { getApiErrorMessage } from "../../../lib/api";

const schema = z
  .object({
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const resetPassword = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <div className="flex min-h-screen items-center justify-center bg-shell px-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-panel">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-sm font-bold text-white">
            T
          </span>
          <span className="text-xl font-extrabold tracking-tight text-ink">Traky</span>
        </div>

        {!token ? (
          <>
            <h1 className="text-2xl font-extrabold text-ink">Invalid reset link</h1>
            <p className="mt-2 text-sm text-muted">
              This link is missing its reset token. Request a new one from the sign-in page.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-ink">Set a new password</h1>
            <p className="mt-1 text-sm text-muted">Choose a new password for your account.</p>

            <form
              className="mt-6 flex flex-col gap-4"
              onSubmit={handleSubmit((values) => resetPassword.mutate({ token, newPassword: values.newPassword }))}
            >
              <Input
                label="New password"
                type="password"
                placeholder="At least 8 characters"
                error={errors.newPassword?.message}
                {...register("newPassword")}
              />
              <Input
                label="Confirm new password"
                type="password"
                placeholder="Re-enter your new password"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              {resetPassword.isError ? (
                <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
                  {getApiErrorMessage(resetPassword.error, "Unable to reset password")}
                </p>
              ) : null}

              <Button type="submit" className="mt-2 w-full" isLoading={resetPassword.isPending}>
                Reset password
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          <Link to="/login" className="font-semibold text-accent hover:text-accent-hover">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
