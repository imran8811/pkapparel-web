import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LogoMark } from "@/components/brand/logo";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <main className="twill-texture grid min-h-svh place-items-center bg-denim-900 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-white">
          <LogoMark className="h-14 w-auto" />
          <span className="font-mono text-[10px] tracking-[0.25em] text-cotton-50/60 uppercase">Staff admin</span>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-2xl shadow-denim-950/40 sm:p-8">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Log in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use the email and password of your staff account.</p>
          <Suspense fallback={<div className="mt-6 h-60" />}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-cotton-50/60 hover:text-white">
            ← Back to the website
          </Link>
        </p>
      </div>
    </main>
  );
}
