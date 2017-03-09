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

import { dataImagery } from './imagery.json';
import { presets } from './presets/presets.json';
import { defaults } from './presets/defaults.json';
import { categories } from './presets/categories.json';
import { fields } from './presets/fields.json';

import maki from '@mapbox/maki';
export var dataFeatureIcons = maki.layouts.all.all;

export var data = {
    imagery: dataImagery,
    presets: {
        presets: presets,
        defaults: defaults,
        categories: categories,
        fields: fields
    }
};
