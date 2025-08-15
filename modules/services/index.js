import serviceKartaview from './kartaview';
import serviceKeepRight from './keepRight';
import serviceMapilio from './mapilio';
import serviceMapillary from './mapillary';
import serviceMapRules from './maprules';
import serviceNominatim from './nominatim';
import serviceNsi from './nsi';
import serviceOsm from './osm';
import serviceOsmWikibase from './osm_wikibase';
import serviceOsmose from './osmose';
import servicePanoramax from './panoramax';
import serviceStreetside from './streetside';
import serviceTaginfo from './taginfo';
import serviceVectorTile from './vector_tile';
import serviceVegbilder from './vegbilder';
import serviceWikidata from './wikidata';
import serviceWikipedia from './wikipedia';

export let services = {
    geocoder: serviceNominatim,
    keepRight: serviceKeepRight,
    osmose: serviceOsmose,
    mapillary: serviceMapillary,
    nsi: serviceNsi,
    kartaview: serviceKartaview,
    vegbilder: serviceVegbilder,
    osm: serviceOsm,
    osmWikibase: serviceOsmWikibase,
    maprules: serviceMapRules,
    streetside: serviceStreetside,
    taginfo: serviceTaginfo,
    vectorTile: serviceVectorTile,
    wikidata: serviceWikidata,
    wikipedia: serviceWikipedia,
    mapilio: serviceMapilio,
    panoramax: servicePanoramax,
};

export {
    serviceKartaview,
    serviceKeepRight,
    serviceMapRules,
    serviceMapilio,
    serviceMapillary,
    serviceNominatim,
    serviceNsi,
    serviceOsm,
    serviceOsmWikibase,
    serviceOsmose,
    servicePanoramax,
    serviceStreetside,
    serviceTaginfo,
    serviceVectorTile,
    serviceVegbilder,
    serviceWikidata,
    serviceWikipedia,
};
