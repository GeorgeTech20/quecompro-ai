import { PageShell } from "@/components/shell/PageHeader";
import { Card, Skeleton } from "@/components/ui";

/** Esqueleto genérico de `/app/*`: la forma de la página aparece antes que el dato. */
export default function AppLoading() {
  return (
    <PageShell>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Card key={index} padding="md" className="flex flex-col gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-2.5 w-full" />
          </Card>
        ))}
      </div>

      <Card padding="md" className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </Card>
    </PageShell>
  );
}
