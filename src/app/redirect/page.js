"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      router.push("/login");
      return;
    }

    if (role === "creator") {
      router.push("/creator/dashboard");
    } else {
      router.push("/dashboard");
    }
  }, [router]);

  return <p className="text-center mt-10">Redirecting...</p>;
}
