import type { Layer } from '.';
import type { geoExtent } from '../geo';

export interface DrawImages extends Layer {
    supported(): boolean;
    rendered(zoom: number): boolean;
    validHere?(extent: geoExtent, zoom: number): boolean;
}
