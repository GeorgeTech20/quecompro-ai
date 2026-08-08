import { PageShell } from "@/components/shell/PageHeader";
import { Card, Skeleton } from "@/components/ui";

/** Esqueleto de la despensa: primero aparece la forma del mueble, luego el dato. */
export default function DespensaLoading() {
  return (
    <PageShell>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Card key={index} padding="md" className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-40" />
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="flex flex-col gap-6 p-6">
          {[0, 1, 2, 3].map((shelf) => (
            <div key={shelf} className="flex items-center gap-4">
              <Skeleton className="h-3 w-16 shrink-0" />
              <Skeleton className="h-14 flex-1" />
            </div>
          ))}
        </Card>
        <Card padding="md" className="hidden flex-col gap-3 lg:flex">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </Card>
      </div>
    </PageShell>
  );
}
