import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { useRegisterOrg } from "../hooks";
import { getApiErrorMessage } from "../../../lib/api";

const schema = z.object({
  organizationName: z.string().min(2, "Organization name is required"),
  adminFullName: z.string().min(2, "Your name is required"),
  adminEmail: z.string().email("Enter a valid email"),
  adminPassword: z.string().min(8, "At least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

export function RegisterOrgPage() {
  const registerOrg = useRegisterOrg();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <div className="flex min-h-screen items-center justify-center bg-shell px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-panel">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-sm font-bold text-white">
            T
          </span>
          <span className="text-xl font-extrabold tracking-tight text-ink">Traky</span>
        </div>

        <h1 className="text-2xl font-extrabold text-ink">Create your organization</h1>
        <p className="mt-1 text-sm text-muted">You'll be set up as the organization admin.</p>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={handleSubmit((values) => registerOrg.mutate(values))}
        >
          <Input
            label="Organization name"
            placeholder="Acme Inc"
            error={errors.organizationName?.message}
            {...register("organizationName")}
          />
          <Input
            label="Your full name"
            placeholder="Ava Admin"
            error={errors.adminFullName?.message}
            {...register("adminFullName")}
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            error={errors.adminEmail?.message}
            {...register("adminEmail")}
          />
          <Input
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            error={errors.adminPassword?.message}
            {...register("adminPassword")}
          />

          {registerOrg.isError ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
              {getApiErrorMessage(registerOrg.error, "Unable to create organization")}
            </p>
          ) : null}

          <Button type="submit" className="mt-2 w-full" isLoading={registerOrg.isPending}>
            Create organization
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have a workspace?{" "}
          <Link to="/login" className="font-semibold text-accent hover:text-accent-hover">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
