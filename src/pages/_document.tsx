import { Html, Head, Main, NextScript, type DocumentProps } from "next/document";

export default function Document({ __NEXT_DATA__ }: DocumentProps) {
  const locale = __NEXT_DATA__.locale ?? "ru";

  return (
    <Html lang={locale}>
      <Head />
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
