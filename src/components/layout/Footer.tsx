import { useTranslation } from "@/locales";

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <p>
          © {year} {t.common.appName}. {t.footer.rights}.
        </p>
        <p>{t.footer.madeWith}</p>
      </div>
    </footer>
  );
}
