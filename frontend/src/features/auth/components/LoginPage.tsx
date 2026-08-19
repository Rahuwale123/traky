import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { useLogin } from "../hooks";
import { getApiErrorMessage } from "../../../lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const login = useLogin();
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

        <h1 className="text-2xl font-extrabold text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to your workspace to continue.</p>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={handleSubmit((values) => login.mutate(values))}
        >
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <div className="flex flex-col gap-1.5">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
            <Link to="/forgot-password" className="self-end text-xs font-medium text-accent hover:text-accent-hover">
              Forgot password?
            </Link>
          </div>

          {login.isError ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
              {getApiErrorMessage(login.error, "Unable to sign in")}
            </p>
          ) : null}

          <Button type="submit" className="mt-2 w-full" isLoading={login.isPending}>
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          New to Traky?{" "}
          <Link to="/register" className="font-semibold text-accent hover:text-accent-hover">
            Create your organization
          </Link>
        </p>
      </div>
    </div>
  );
}
