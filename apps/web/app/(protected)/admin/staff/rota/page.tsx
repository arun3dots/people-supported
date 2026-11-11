"use client";

import dynamic from "next/dynamic";

const RotaContainer = dynamic(
  () => import("./components/RotaContainer").then((mod) => mod.RotaContainer),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6 font-sans animate-pulse">
        <div className="h-20 bg-slate-100 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="h-24 bg-slate-100 rounded-2xl" />
          <div className="h-24 bg-slate-100 rounded-2xl" />
          <div className="h-24 bg-slate-100 rounded-2xl" />
          <div className="h-24 bg-slate-100 rounded-2xl" />
        </div>
        <div className="h-96 bg-slate-100 rounded-2xl" />
      </div>
    ),
  }
);

export default function RotaPage() {
  return <RotaContainer />;
}
