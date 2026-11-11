import presetLocalesEn from '../../../../data/locales/custom_presets/en.json';
import presetLocalesFr from '../../../../data/locales/custom_presets/fr.json';
import { ACCESS_CATEGORIES } from '../../../../data/custom-tagging/src/presets/highway/access_categories';
import {
    accessCategoryTagSets,
    footwayGridEntries,
    gridPresetName,
    gridPresetTerms,
    serviceGridEntries
} from '../../../../data/custom-tagging/src/presets/highway/access_grid';

const LOCALES = [['en', presetLocalesEn], ['fr', presetLocalesFr]];
const ENTRIES = [...serviceGridEntries(), ...footwayGridEntries()];

/** Whether every tag of `subset` is in `tags`. */
const includesTags = (tags, subset) => Object.entries(subset).every(([key, value]) => tags[key] === value);

describe('access grid', function() {
    LOCALES.forEach(function([locale, strings]) {
        it(`has up-to-date ${locale} names and terms (npm run generate:locales:access-grid)`, function() {
            const stale = ENTRIES.filter((entry) =>
                strings[entry.id]?.name !== gridPresetName(entry, locale) ||
                strings[entry.id]?.terms !== gridPresetTerms(entry, locale)
            );
            expect(stale.map((entry) => entry.id)).to.eql([]);
        });
    });

    it('has unique preset ids', function() {
        expect(new Set(ENTRIES.map((entry) => entry.id)).size).to.equal(ENTRIES.length);
    });

    ACCESS_CATEGORIES.forEach(function(category, index) {
        it(`lists ${category.id} before the categories whose tags are a subset of its own`, function() {
            const earlierSubsets = ACCESS_CATEGORIES.slice(0, index)
                .filter((earlier) =>
                    accessCategoryTagSets(category).some((tags) =>
                        accessCategoryTagSets(earlier).some((earlierTags) => includesTags(tags, earlierTags))
                    )
                )
                .map((earlier) => earlier.id);
            expect(earlierSubsets).to.eql([]);
        });
    });

    [
        ['highway/service/private_property_driveway', 'en', 'Driveway private ownership no transit'],
        ['highway/service/business_driveway', 'fr', 'Entrée charretière commerciale sans transit'],
        ['highway/service/destination_drive_through', 'fr', 'Service au volant public sans transit'],
        ['highway/service/customers_unpaved_parking_aisle', 'fr', 'Allée de stationnement clients seulement, non revêtue'],
        ['highway/footway/destination', 'fr', 'Chemin piéton public sans transit'],
        ['highway/service/private_sidewalk_both', 'en', 'Service road strictly private (separate sidewalk, both sides)']
    ].forEach(function([id, locale, name]) {
        it(`names ${id} "${name}" in ${locale}`, function() {
            const entry = ENTRIES.find((candidate) => candidate.id === id);
            expect(gridPresetName(entry, locale)).to.equal(name);
        });
    });
});
