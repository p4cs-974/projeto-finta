"use client";

import { useDeferredValue, useId, useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Facehash } from "facehash";
import Link from "next/link";

const avatarColors = ["#FF3366", "#00D9FF", "#7FFF00", "#FF6B35", "#9D00FF"];

interface RegisterSuccessResponse {
  data: {
    user: {
      id: number;
      name: string;
      email: string;
      createdAt: string;
    };
    token: string;
    tokenType: "Bearer";
    expiresIn: number;
  };
}

interface RegisterErrorResponse {
  error: {
    code: string;
    message: string;
    details?: {
      fieldErrors?: Record<string, string[] | undefined>;
    };
  };
}

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"name" | "email" | "password" | "confirmPassword", string[]>>
  >({});
  const fallbackId = useId();
  const avatarSeed = useDeferredValue(
    [fullName.trim(), email.trim().toLowerCase()].filter(Boolean).join(" | ") ||
      fallbackId,
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFormError(null);
    setFormSuccess(null);
    setFieldErrors({});

    if (password !== confirmPassword) {
      setFieldErrors({
        confirmPassword: ["Passwords do not match."],
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: fullName,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as RegisterErrorResponse;
        const nextFieldErrors = payload.error.details?.fieldErrors ?? {};

        setFieldErrors({
          name: nextFieldErrors.name,
          email: nextFieldErrors.email,
          password: nextFieldErrors.password,
        });
        setFormError(payload.error.message);
        return;
      }

      (await response.json()) as RegisterSuccessResponse;
      setFormSuccess("Account created. You are authenticated on this device.");
      router.push("/");
      router.refresh();
    } catch {
      setFormError("Could not reach the server. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Enter your email below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <p className="text-xs font-medium text-muted-foreground">
                  Avatar Preview
                </p>
                <Facehash
                  aria-label="Live FaceHash avatar preview"
                  className="shadow-[0_12px_24px_-18px_rgba(15,23,42,0.7)]"
                  colors={avatarColors}
                  enableBlink
                  intensity3d="subtle"
                  name={avatarSeed}
                  size={88}
                  variant="gradient"
                />
              </div>
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={fieldErrors.name?.length ? true : undefined}
                  required
                />
                <FieldError
                  errors={fieldErrors.name?.map((message) => ({ message }))}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={fieldErrors.email?.length ? true : undefined}
                  required
                />
                <FieldError
                  errors={fieldErrors.email?.map((message) => ({ message }))}
                />
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={isSubmitting}
                      aria-invalid={
                        fieldErrors.password?.length ? true : undefined
                      }
                      required
                    />
                    <FieldError
                      errors={fieldErrors.password?.map((message) => ({
                        message,
                      }))}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Confirm Password
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      disabled={isSubmitting}
                      aria-invalid={
                        fieldErrors.confirmPassword?.length ? true : undefined
                      }
                      required
                    />
                    <FieldError
                      errors={fieldErrors.confirmPassword?.map((message) => ({
                        message,
                      }))}
                    />
                  </Field>
                </Field>
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </Button>
                {formError ? <FieldError>{formError}</FieldError> : null}
                {formSuccess ? (
                  <FieldDescription className="text-center text-foreground">
                    {formSuccess}
                  </FieldDescription>
                ) : null}
                <FieldDescription className="text-center">
                  Already have an account? <Link href="/login">Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      {/*<FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>*/}
    </div>
  );
}
