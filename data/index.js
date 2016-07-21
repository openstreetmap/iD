export { wikipedia } from 'wmf-sitematrix';
export { default as featureIcons } from 'maki/www/maki-sprite.json';
export { default as suggestions } from 'name-suggestion-index/name-suggestions.json';

export { default as deprecated } from './deprecated.json';
export { default as discarded } from './discarded.json';
export { default as imperial } from './imperial.json';
export { default as locales } from './locales.json';
export { default as addressFormats } from './address-formats.json';
export { default as phoneFormats } from './phone-formats.json';
export { default as driveLeft } from './drive-left.json';
export { default as imagery } from './imagery.json';
export { default as en } from '../dist/locales/en.json';

import { default as presetsData } from './presets/presets.json';
import { default as defaults } from './presets/defaults.json';
import { default as categories } from './presets/categories.json';
import { default as fields } from './presets/fields.json';

export var presets = {
    presets: presetsData,
    defaults: defaults,
    categories: categories,
    fields: fields
};
