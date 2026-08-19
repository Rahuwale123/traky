import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { useForgotPassword } from "../hooks";
import { getApiErrorMessage } from "../../../lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const {
    register,
    handleSubmit,
    getValues,
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

        {forgotPassword.isSuccess ? (
          <>
            <h1 className="text-2xl font-extrabold text-ink">Check your email</h1>
            <p className="mt-2 text-sm text-muted">
              If an account exists for <span className="font-medium text-ink-soft">{getValues("email")}</span>, we've
              sent a link to reset your password. It expires in 30 minutes.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-ink">Reset your password</h1>
            <p className="mt-1 text-sm text-muted">Enter your email and we'll send you a reset link.</p>

            <form
              className="mt-6 flex flex-col gap-4"
              onSubmit={handleSubmit((values) => forgotPassword.mutate(values.email))}
            >
              <Input
                label="Email"
                type="email"
                placeholder="you@company.com"
                error={errors.email?.message}
                {...register("email")}
              />

              {forgotPassword.isError ? (
                <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
                  {getApiErrorMessage(forgotPassword.error, "Unable to send reset link")}
                </p>
              ) : null}

              <Button type="submit" className="mt-2 w-full" isLoading={forgotPassword.isPending}>
                Send reset link
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
