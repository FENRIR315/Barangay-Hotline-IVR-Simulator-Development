import { Phone } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Sign In" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-900 text-white">
            <Phone className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">BarangayConnect Hotline</h1>
          <p className="mt-1 text-sm text-gray-500">Official Dashboard — sign in to continue</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <LoginForm />
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Barangay Automated Hotline and Emergency Assistance System
        </p>
      </div>
    </div>
  );
}