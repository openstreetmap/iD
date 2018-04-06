export { wikipedia as dataWikipedia } from 'wmf-sitematrix';
export { default as dataSuggestions } from 'name-suggestion-index/name-suggestions.json';

export { dataAddressFormats } from './address-formats.json';
export { dataDeprecated } from './deprecated.json';
export { dataDiscarded } from './discarded.json';
export { dataLocales } from './locales.json';
export { dataPhoneFormats } from './phone-formats.json';
export { dataShortcuts } from './shortcuts.json';

export { default as dataImperial } from './imperial.json';
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

import maki from '@mapbox/maki';
export var dataFeatureIcons = maki.layouts.all.all;

import _values from 'lodash-es/values';
import whichPolygon from 'which-polygon';

// workaround for which-polygon
// only supports `properties`, not `id`
// https://github.com/mapbox/which-polygon/pull/6
var features = _values(ociFeatures).map(function(feature) {
    feature.properties = { id: feature.id };
    return feature;
});

export var data = {
    community: {
        features: ociFeatures,
        resources: ociResources,
        query: whichPolygon({
            type: 'FeatureCollection',
            features: features
        })
    },
    imagery: dataImagery,
    presets: {
        presets: presets,
        defaults: defaults,
        categories: categories,
        fields: fields
    }
};
