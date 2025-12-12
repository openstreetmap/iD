import type { Dispatch } from 'd3-dispatch';
import type { coreContext } from '../core';

export type StreetSideEventMap = {
    loadedImages: [];
}

export interface IStreetSide {
    event?: Pick<Dispatch<any, StreetSideEventMap>, 'on'>;
    on: Dispatch<any, StreetSideEventMap>['on'];
    init(): void;
    reset(): void;
    cachedImage(imageKey: string): unknown;
    ensureViewerLoaded(context: coreContext): Promise<unknown>;
}
