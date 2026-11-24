import type { Drawable } from '.';
import type { geoExtent } from '../geo';

export interface DrawImages extends Drawable {
    supported(): boolean;
    rendered(zoom: number): boolean;
    validHere?(extent: geoExtent, zoom: number): boolean;
}
