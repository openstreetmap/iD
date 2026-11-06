import { utilCleanTags } from './clean_tags';

/** A point of a pasted GeoJSON text, to add as a node */
export interface GeojsonPoint {
  /** `[longitude, latitude]` */
  loc: [number, number];
  /** OSM tags: the non-empty string properties of the feature, cleaned by `utilCleanTags` */
  tags: Tags;
}

/**
 * Points of a GeoJSON text (a FeatureCollection or a Feature), each with the string properties of its feature as
 * OSM tags, e.g. the addresses copied from an address validation tool. The features which are not points, out of
 * the longitude and latitude ranges or without any non-empty string property are skipped.
 * @param text Text of the clipboard
 * @returns The points, empty when the text is not GeoJSON
 */
export function utilGeojsonPoints(text: string): GeojsonPoint[] {
  let geojson: any;
  try {
    geojson = JSON.parse(text);
  } catch {
    return [];
  }
  const features: any[] = geojson?.type === 'FeatureCollection' ? (geojson.features ?? [])
    : geojson?.type === 'Feature' ? [geojson] : [];
  const points: GeojsonPoint[] = [];
  for (const feature of features) {
    const [lon, lat] = feature?.geometry?.type === 'Point' ? feature.geometry.coordinates ?? [] : [];
    if (!Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lon) > 180 || Math.abs(lat) > 90) continue;
    const strings = Object.entries(feature.properties ?? {})
      .filter(([, value]) => typeof value === 'string');
    const tags = utilCleanTags(Object.fromEntries(strings) as Tags);
    for (const key of Object.keys(tags)) {
      if (!tags[key]) delete tags[key];
    }
    if (Object.keys(tags).length) {
      points.push({ loc: [lon, lat], tags });
    }
  }
  return points;
}
