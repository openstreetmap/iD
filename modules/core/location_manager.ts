import type { HasLocationSet } from '@rapideditor/location-conflation';
import { LocationConflation } from '@rapideditor/location-conflation';

declare module '@rapideditor/location-conflation' {
    interface LocationConflation {
        /** Version of the location data - incremented whenever it changes. */
        version(): number;
    }
}

const _loco = new LocationConflation();    // instance of a location-conflation resolver

const _origAddFeatures = _loco.addFeatures.bind(_loco);
const _origRegisterLocationSets = _loco.registerLocationSets.bind(_loco);
const _origRemoveFeatures = _loco.removeFeatures.bind(_loco);
const _origClearFeatures = _loco.clearFeatures.bind(_loco);

// `version()` increments whenever the location data changes, so callers
// (e.g. the display label cache) can invalidate derived results.
// All four mutators are wrapped so the version stays accurate even for
// call sites added later (iD currently only calls `addFeatures` and
// `registerLocationSets`).
let _version = 0;

_loco.addFeatures = (fc) => {
    _version++;
    return _origAddFeatures(fc);
};
_loco.registerLocationSets = <T extends HasLocationSet>(objects: T[]) => {
    _version++;
    return _origRegisterLocationSets(objects);
};
_loco.removeFeatures = (...ids: string[]) => {
    _version++;
    return _origRemoveFeatures(...ids);
};
_loco.clearFeatures = () => {
    _version++;
    return _origClearFeatures();
};
_loco.version = () => _version;

export { _loco as locationManager };
