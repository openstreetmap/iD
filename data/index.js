export { dataLocales } from './locales.json';
export { en as dataEn } from '../dist/locales/en.json';

import { presets } from './presets/presets.json';
import { defaults } from './presets/defaults.json';
import { categories } from './presets/categories.json';
import { fields } from './presets/fields.json';

export let data = {
  presets: {
    presets: presets,
    defaults: defaults,
    categories: categories,
    fields: fields
  }
};
