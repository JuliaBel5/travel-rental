import Image from "next/image";

import { cn } from "@/lib/utils";

export function Gallery({
  images,
  alt,
  className,
}: {
  images: string[];
  alt: string;
  className?: string;
}) {
  const [hero, ...rest] = images;
  const thumbnails = rest.slice(0, 4);

  return (
    <div
      className={cn(
        "grid gap-2 overflow-hidden rounded-2xl lg:h-[26rem] lg:grid-cols-4 lg:grid-rows-2",
        className,
      )}
    >
      <div className="relative aspect-[4/3] bg-muted lg:col-span-2 lg:row-span-2 lg:aspect-auto">
        <Image
          src={hero}
          alt={alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {thumbnails.map((src, index) => (
        <div key={src} className="relative hidden aspect-[4/3] bg-muted lg:block lg:aspect-auto">
          <Image
            src={src}
            alt={`${alt} — ${index + 2}`}
            fill
            sizes="25vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
