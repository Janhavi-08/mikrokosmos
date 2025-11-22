"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ className = "" }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className={"bg-white text-purple-600 px-3 py-1 rounded shadow mr-3 " + className}
      aria-label="Go back"
    >
      ← Back
    </button>
  );
}
