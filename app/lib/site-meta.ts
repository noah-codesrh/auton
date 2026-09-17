const SITE_URL = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "") ?? "";
const OG_IMAGE_PATH = "/og-image.png";

export function getOgImageUrl() {
  return SITE_URL ? `${SITE_URL}${OG_IMAGE_PATH}` : OG_IMAGE_PATH;
}

export function siteMeta({
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
    { title },
    { name: "description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Auton" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: "Auton — derivatives for decentralized compute" },
    ...(url ? [{ property: "og:url", content: url }] : []),
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];
}
