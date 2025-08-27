"use client";
import { useEffect, useState } from "react";
import { AnalyticsContent } from "@/components/analytics-content";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/analytics")
      .then(res => res.json())
      .then(data => setAnalytics(data));
  }, []);

  if (!analytics) return <div>Loading...</div>;

  return <AnalyticsContent analytics={analytics} />;
} 