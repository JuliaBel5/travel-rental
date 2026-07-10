import Head from "next/head";
import { useRouter } from "next/router";

/** Placeholder canonical origin for the demo. */
const SITE_URL = "https://wanderstay.example";

export function Seo({
  title,
  description,
  image,
}: {
  title: string;
  description: string;
  image?: string;
}) {
  const router = useRouter();
  const locale = router.locale === "en" ? "en" : "ru";

  // Path without query/hash — locale prefix is not part of asPath in i18n mode.
  const path = (router.asPath || "/").split("?")[0].split("#")[0];
  const ruUrl = `${SITE_URL}${path}`;
  const enUrl = `${SITE_URL}/en${path === "/" ? "" : path}`;
  const canonical = locale === "en" ? enUrl : ruUrl;
  const ogLocale = locale === "en" ? "en_US" : "ru_RU";
  const absoluteImage = image
    ? image.startsWith("http")
      ? image
      : `${SITE_URL}${image}`
    : undefined;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} key="description" />
      <link rel="canonical" href={canonical} key="canonical" />

      <meta property="og:title" content={title} key="og:title" />
      <meta property="og:description" content={description} key="og:description" />
      <meta property="og:type" content="website" key="og:type" />
      <meta property="og:locale" content={ogLocale} key="og:locale" />
      <meta property="og:url" content={canonical} key="og:url" />
      {absoluteImage && <meta property="og:image" content={absoluteImage} key="og:image" />}

      <meta
        name="twitter:card"
        content={absoluteImage ? "summary_large_image" : "summary"}
        key="twitter:card"
      />
      <meta name="twitter:title" content={title} key="twitter:title" />
      <meta name="twitter:description" content={description} key="twitter:description" />
      {absoluteImage && <meta name="twitter:image" content={absoluteImage} key="twitter:image" />}

      <link rel="alternate" hrefLang="ru" href={ruUrl} key="alt-ru" />
      <link rel="alternate" hrefLang="en" href={enUrl} key="alt-en" />
      <link rel="alternate" hrefLang="x-default" href={ruUrl} key="alt-default" />
    </Head>
  );
}
