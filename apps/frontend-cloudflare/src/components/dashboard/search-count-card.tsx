"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { QuickStatCard } from "@/components/dashboard/quick-stat-card";

async function fetchTodayCount(): Promise<number> {
  const res = await fetch("/api/users/me/recent-assets/today-count");

  if (!res.ok) {
    return 0;
  }

  const payload = (await res.json()) as { data: { count: number } };
  return payload.data.count;
}

interface SearchCountCardProps {
  initialCount: number;
}

export function SearchCountCard({ initialCount }: SearchCountCardProps) {
  const [count, setCount] = useState(initialCount);
  const pathname = usePathname();

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    fetchTodayCount().then(setCount).catch(() => undefined);
  }, [pathname]);

  return <QuickStatCard label="Buscas Hoje" value={count} icon="search" />;
}
