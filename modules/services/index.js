import serviceKeepRight from './keepRight';
import serviceImproveOSM from './improveOSM';
import serviceOsmose from './osmose';
import serviceMapillary from './mapillary';
import serviceMapRules from './maprules';
import serviceNominatim from './nominatim';
import serviceOpenstreetcam from './openstreetcam';
import serviceOsm from './osm';
import serviceOsmWikibase from './osm_wikibase';
import serviceStreetside from './streetside';
import serviceTaginfo from './taginfo';
import serviceVectorTile from './vector_tile';
import serviceWikidata from './wikidata';
import serviceWikipedia from './wikipedia';


export var services = {
    geocoder: serviceNominatim,
    keepRight: serviceKeepRight,
    improveOSM: serviceImproveOSM,
    osmose: serviceOsmose,
    mapillary: serviceMapillary,
    openstreetcam: serviceOpenstreetcam,
    osm: serviceOsm,
    osmWikibase: serviceOsmWikibase,
    maprules: serviceMapRules,
    streetside: serviceStreetside,
    taginfo: serviceTaginfo,
    vectorTile: serviceVectorTile,
    wikidata: serviceWikidata,
    wikipedia: serviceWikipedia
};

export {
    serviceKeepRight,
    serviceImproveOSM,
    serviceOsmose,
    serviceMapillary,
    serviceMapRules,
    serviceNominatim,
    serviceOpenstreetcam,
    serviceOsm,
    serviceOsmWikibase,
    serviceStreetside,
    serviceTaginfo,
    serviceVectorTile,
    serviceWikidata,
    serviceWikipedia
};