import serviceStreetside from './streetside';
import serviceMapillary from './mapillary';
import serviceNominatim from './nominatim';
import serviceOpenstreetcam from './openstreetcam';
import serviceOsm from './osm';
import serviceTaginfo from './taginfo';
import serviceWikidata from './wikidata';
import serviceWikipedia from './wikipedia';

export var services = {
    geocoder: serviceNominatim,
    streetside: serviceStreetside,
    mapillary: serviceMapillary,
    openstreetcam: serviceOpenstreetcam,
    osm: serviceOsm,
    taginfo: serviceTaginfo,
    wikidata: serviceWikidata,
    wikipedia: serviceWikipedia
};

export {
    serviceStreetside,
    serviceMapillary,
    serviceNominatim,
    serviceOpenstreetcam,
    serviceOsm,
    serviceTaginfo,
    serviceWikidata,
    serviceWikipedia
};
