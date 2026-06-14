export function decodePostcardUri(uri: string): { image: string; name: string } | null {
  try {
    if (!uri.startsWith("data:application/json;base64,")) return null;
    const jsonB64 = uri.slice("data:application/json;base64,".length);
    const json = JSON.parse(atob(jsonB64)) as { name?: string; image?: string };
    if (!json.image) return null;

    let image = json.image;
    if (image.startsWith("data:image/svg+xml;base64,")) {
      const svgB64 = image.slice("data:image/svg+xml;base64,".length);
      image = `data:image/svg+xml;base64,${svgB64}`;
    }

    return { image, name: json.name ?? "Postcard" };
  } catch {
    return null;
  }
}
