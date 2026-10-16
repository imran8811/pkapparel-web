import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder while an account page loads (every account page has a loading.tsx using it). */
export function AccountSkeleton({ label = "Loading your account" }: { label?: string }) {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label={label}>
      <Skeleton className="h-10 w-64 rounded-xl" />
      <Skeleton className="h-5 w-80 max-w-full rounded-lg" />
      <div className="grid gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    </div>
  );
}
