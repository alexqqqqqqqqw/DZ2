"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { useSession } from "@/components/shell";
import { Field, TextInput } from "@/components/states";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { safeNextPath } from "@/lib/domain";
import type { PublicUser } from "@/lib/types";

export function AuthScreen({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const session = useSession();
  const next = safeNextPath(params.get("next"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setErrors({});
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login" ? { email, password } : { name, email, password, phone };
      await api<{ user: PublicUser }>(path, { method: "POST", body: JSON.stringify(body) });
      await session.refresh();
      router.push(next);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFormError(caught.message);
        setErrors(caught.fields ?? {});
      } else {
        setFormError("Не удалось выполнить запрос.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const title = mode === "login" ? "Вход" : "Регистрация";

  return (
    <form className="mx-auto max-w-md space-y-4" onSubmit={(event) => void submit(event)}>
      <h1 className="font-heading text-4xl">{title}</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        {mode === "login"
          ? "Сессия хранится 7 дней в httpOnly-cookie. Для проверки есть демо-аккаунт demo@norma.test, пароль Demo12345."
          : "Пароль от 8 символов, с буквой и цифрой. Почта станет логином."}
      </p>
      {formError ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}
      {mode === "register" ? (
        <Field error={errors.name} htmlFor="name" label="Имя">
          <TextInput
            autoComplete="name"
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
      ) : null}
      <Field error={errors.email} htmlFor="email" label="Почта">
        <TextInput
          autoComplete="email"
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>
      <Field error={errors.password} htmlFor="password" label="Пароль">
        <TextInput
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>
      {mode === "register" ? (
        <Field error={errors.phone} htmlFor="phone" label="Телефон">
          <TextInput
            autoComplete="tel"
            id="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </Field>
      ) : null}
      <Button className="h-12 w-full" disabled={submitting} type="submit">
        {submitting ? "Проверяем" : mode === "login" ? "Войти" : "Создать аккаунт"}
      </Button>
      {mode === "login" ? (
        <p className="text-sm">
          Нет аккаунта?{" "}
          <Link className="underline" href={`/register?next=${encodeURIComponent(next)}`}>
            Зарегистрироваться
          </Link>
        </p>
      ) : (
        <p className="text-sm">
          Уже регистрировались?{" "}
          <Link className="underline" href={`/login?next=${encodeURIComponent(next)}`}>
            Войти
          </Link>
        </p>
      )}
    </form>
  );
}
