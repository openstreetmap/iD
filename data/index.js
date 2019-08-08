export { wikipedia as dataWikipedia } from 'wmf-sitematrix';

export { dataAddressFormats } from './address-formats.json';
export { dataDeprecated } from './deprecated.json';
export { dataDiscarded } from './discarded.json';
export { dataLanguages } from './languages.json';
export { dataLocales } from './locales.json';
export { dataPhoneFormats } from './phone-formats.json';
export { dataShortcuts } from './shortcuts.json';
export { dataTerritoryLanguages } from './territory-languages.json';

export { default as dataImperial } from './imperial.json';
export { default as dataMPH } from './mph.json';
export { default as dataDriveLeft } from './drive-left.json';
export { en as dataEn } from '../dist/locales/en.json';

import {
    features as ociFeatures,
    resources as ociResources
} from 'osm-community-index';

import { dataImagery } from './imagery.json';
import { presets } from './presets/presets.json';
import { defaults } from './presets/defaults.json';
import { categories } from './presets/categories.json';
import { fields } from './presets/fields.json';

import { geoArea as d3_geoArea } from 'd3-geo';
import whichPolygon from 'which-polygon';


// index the osm-community-index
var ociFeatureCollection = Object.values(ociFeatures).map(function(feature) {
    // workaround for which-polygon: only supports `properties`, not `id`
    // https://github.com/mapbox/which-polygon/pull/6
    feature.properties = {
        id: feature.id,
        area: d3_geoArea(feature)   // also precompute areas
    };
    return feature;
});


export var data = {
    community: {
        features: ociFeatures,
        resources: ociResources,
        query: whichPolygon({
            type: 'FeatureCollection',
            features: ociFeatureCollection
        })
    },
    imagery: dataImagery,  //legacy
    presets: {
        presets: presets,
        defaults: defaults,
        categories: categories,
        fields: fields
    }
};
