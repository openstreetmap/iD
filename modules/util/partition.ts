import { geoScaleToZoom } from '../geo';
import { utilTiler } from './tiler';
import type { Projection } from '../geo/raw_mercator';
import type RBush from 'rbush';
import type { BBox } from 'rbush';

export interface WithBbox<T> extends BBox {
  data: T;
}

export function partitionViewport(projection: Projection) {
  let z = geoScaleToZoom(projection.scale());
  let z2 = (Math.ceil(z * 2) / 2) + 2.5;   // round to next 0.5 and add 2.5
  let tiler = utilTiler().zoomExtent([z2, z2]);

  return (tiler.getTiles(projection) || []).map(tile => tile.extent);
}


/** no more than `limit` results per partition */
export function searchLimited<T>(limit: number | undefined, projection: Projection, rtree: RBush<WithBbox<T>>): T[] {
  limit ||= 5;

  return partitionViewport(projection)
    .flatMap((extent) => rtree.search(extent.bbox()).slice(0, limit))
    .map(result => result.data);
}
