export const SITE_NAME = "Auton Futures";

const SITE_URL =
  import.meta.env.VITE_SITE_URL?.replace(/\/$/, "") ??
  "https://app.autonairh.xyz";
const OG_IMAGE_PATH = "/hero-section.jpg";

export function pageTitle(page?: string) {
  return page ? `${page} — ${SITE_NAME}` : SITE_NAME;
}

export function getOgImageUrl() {
  return SITE_URL ? `${SITE_URL}${OG_IMAGE_PATH}` : OG_IMAGE_PATH;
}

export function ogMeta({
  title,
  description,
  path = "",
}: {
  title: string;
  description: string;
  path?: string;
}) {
  const image = getOgImageUrl();
  const url = SITE_URL ? `${SITE_URL}${path}` : undefined;

  return [
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: SITE_NAME },
    ...(url ? [{ property: "og:url", content: url }] : []),
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];
}
