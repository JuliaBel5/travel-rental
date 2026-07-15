import { cn } from "@/lib/utils";

/** Initials from a name (first + last) or the email's first character. */
export function userInitials(name?: string | null, email?: string | null): string {
  const source = (name ?? "").trim();
  if (source) {
    const parts = source.split(/\s+/).filter(Boolean);
    const first = parts[0]?.charAt(0) ?? "";
    const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : "";
    return (first + last).toUpperCase();
  }
  const trimmedEmail = (email ?? "").trim();
  return trimmedEmail ? trimmedEmail.charAt(0).toUpperCase() : "?";
}

/**
 * Round avatar: shows the base64 photo when present, otherwise a muted circle
 * with the user's initials. Rendered with a plain <img> because next/image
 * refuses base64 data-URLs. Size/typography can be overridden via className.
 */
export function UserAvatar({
  image,
  name,
  email,
  className,
}: {
  image?: string | null;
  name?: string | null;
  email?: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-medium text-muted-foreground select-none",
        className,
      )}
    >
      {image ? (
        // next/image rejects base64 data-URLs; a plain <img> is the correct tool here.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={name ?? email ?? ""} className="size-full object-cover" />
      ) : (
        <span aria-hidden>{userInitials(name, email)}</span>
      )}
    </div>
  );
}
