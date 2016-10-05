export { wikipedia as dataWikipedia } from 'wmf-sitematrix';
export { default as dataFeatureIcons } from 'maki/www/maki-sprite.json';
export { default as dataSuggestions } from 'name-suggestion-index/name-suggestions.json';

export { default as dataDeprecated } from './deprecated.json';
export { default as dataDiscarded } from './discarded.json';
export { default as dataImperial } from './imperial.json';
export { default as dataLocales } from './locales.json';
export { default as dataAddressFormats } from './address-formats.json';
export { default as dataPhoneFormats } from './phone-formats.json';
export { default as dataDriveLeft } from './drive-left.json';
export { default as dataImagery } from './imagery.json';
export { default as dataEn } from '../dist/locales/en.json';

import { default as presets } from './presets/presets.json';
import { default as defaults } from './presets/defaults.json';
import { default as categories } from './presets/categories.json';
import { default as fields } from './presets/fields.json';

export var dataPresets = {
    presets: presets,
    defaults: defaults,
    categories: categories,
    fields: fields
};
