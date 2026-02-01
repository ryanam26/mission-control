"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const convex = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) return null;
    return new ConvexReactClient(url);
  }, []);

  if (!convex) {
    return (
      <div style={{ padding: "2rem", color: "#888", textAlign: "center" }}>
        Missing NEXT_PUBLIC_CONVEX_URL. Check environment variables.
      </div>
    );
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
