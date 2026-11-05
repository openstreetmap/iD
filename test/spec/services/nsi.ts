import type { Vec2 } from '../../../modules/geo/vector';

describe('iD.serviceNsi', function () {
    const nullIslandLocation: Vec2 = [0, 0];

    beforeEach(() => {
        iD.services.nsi = iD.serviceNsi;
        iD.fileFetcher.cache().nsi_data = {
            nsi: {
                'brands/shop/supermarket': {
                    properties: { path: 'brands/shop/supermarket' },
                    items: [
                        {
                            mainTag: '',
                            tkv: '',
                            id: 'example1',
                            displayName: 'Examplestan',
                            locationSet: { include: ['world'] },
                            tags: { brand: 'Examplestan', 'brand:wikidata': 'Q99999999999999', name: 'Examplestan', shop: 'supermarket' }
                        }
                    ]
                },
                'operators/amenity/toilets': {
                    properties: { path: 'operators/amenity/toilets' },
                    items: [
                        {
                            mainTag: '',
                            tkv: '',
                            id: 'example2',
                            displayName: 'Example Trains',
                            locationSet: { include: ['world'] },
                            tags: { amenity: 'toilets', operator: 'Example Trains', 'operator:wikidata': 'Q88888888888888' }
                        }
                    ]
                }
            }
        };
        iD.fileFetcher.cache().nsi_features = { type: 'FeatureCollection', features: [] };
        iD.fileFetcher.cache().nsi_dissolved = { dissolved: {} };
        iD.fileFetcher.cache().nsi_replacements = { replacements: {} };
        iD.fileFetcher.cache().nsi_wikidata = { wikidata: {} };

        iD.fileFetcher.cache().nsi_trees = {
            trees: {
                brands: {
                    emoji: '',
                    nameTags: { primary: '', alternate: '' },
                    mainTag: 'brand:wikidata'
                },
                operators: {
                    emoji: '',
                    nameTags: { primary: '', alternate: '' },
                    mainTag: 'operator:wikidata'
                },
                transit: undefined as never,
                flags: undefined as never,
            }
        };
        iD.fileFetcher.cache().nsi_generics = {
          genericWords: []
        };
        iD.fileFetcher.cache().preset_presets = {
            'building/office': { tags: { building: 'office' }, geometry: ['area'], name: 'Office Building' }
        };
    });

    beforeEach(async () => {
        await iD.coreContext().assetPath('../dist/').init(true);
    });

    afterEach(() => {
        // @ts-expect-error -- deleting a required prop
        delete iD.services.nsi;
    });

    describe('#init', () => {
        it('loads the data', () => {
            expect(iD.services.nsi.status()).toBe('ok');
            expect(iD.services.nsi.cache().ids.has('example1')).toBe(true);
        });
    });

    describe('#upgradeTags', () => {
        it('returns null for features which are not covered by NSI', () => {
            expect(iD.services.nsi.upgradeTags({ highway: 'residential', name: 'Aldi' }, nullIslandLocation)).toBeNull();
        });

        it('adds missing brand tags', () => {
            const result = iD.services.nsi.upgradeTags({ shop: 'supermarket', name: 'Examplestan' }, nullIslandLocation);
            expect(result?.matched?.id).toBe('example1');
            expect(result?.newTags).toEqual({
                shop: 'supermarket', name: 'Examplestan', brand: 'Examplestan', 'brand:wikidata': 'Q99999999999999'
            });
        });

        it('does not match a building to an unrelated category based on its wikidata tag (#13077)', () => {
            expect(iD.services.nsi.upgradeTags({ building: 'office', wikidata: 'Q88888888888888', name: 'Example Trains HQ' }, nullIslandLocation)).toBeNull();
        });

        it('swaps a mistagged wikidata tag if the feature has a matching category tag', () => {
            const result = iD.services.nsi.upgradeTags({ amenity: 'toilets', wikidata: 'Q88888888888888' }, nullIslandLocation);
            expect(result?.matched?.id).toBe('example2');
            expect(result?.newTags).toEqual({
                amenity: 'toilets', operator: 'Example Trains', 'operator:wikidata': 'Q88888888888888'
            });
        });
    });
});
