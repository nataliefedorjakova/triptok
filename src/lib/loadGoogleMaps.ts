import { Loader } from "@googlemaps/js-api-loader";

export const loadGoogleMaps = async () => {
  const loader = new Loader({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  });

  return loader.load();
};