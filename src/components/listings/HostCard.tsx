import Image from "next/image";
import { ShieldCheck } from "lucide-react";

import type { Host } from "@/types";
import { useTranslation } from "@/locales";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function HostCard({ host, className }: { host: Host; className?: string }) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border border-border bg-card p-5",
        className,
      )}
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-muted">
        <Image src={host.avatar} alt={host.name} fill sizes="64px" className="object-cover" />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-heading text-lg font-medium text-foreground">{host.name}</p>
          {host.isSuperhost && (
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="size-3" />
              {t.detail.superhost}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {t.detail.joinedIn} {host.joinedYear}
        </p>
      </div>
    </div>
  );
}
