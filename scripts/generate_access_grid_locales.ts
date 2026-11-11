/**
 * Write the names and search terms of the access grid presets
 * (data/custom-tagging/src/presets/highway/access_categories.ts) to
 * data/locales/custom_presets/{en,fr}.json. Other keys of an entry (aliases) are kept.
 */
import fs from 'node:fs';
import {
    footwayGridEntries,
    gridPresetName,
    gridPresetTerms,
    serviceGridEntries,
    type GridLocale
} from '../data/custom-tagging/src/presets/highway/access_grid';

const LOCALES: GridLocale[] = ['en', 'fr'];
const entries = [...serviceGridEntries(), ...footwayGridEntries()];

for (const locale of LOCALES) {
    const file = `data/locales/custom_presets/${locale}.json`;
    const strings = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const entry of entries) {
        strings[entry.id] = {
            ...strings[entry.id],
            name: gridPresetName(entry, locale),
            terms: gridPresetTerms(entry, locale)
        };
    }
    fs.writeFileSync(file, JSON.stringify(strings, null, 4) + '\n');
}
