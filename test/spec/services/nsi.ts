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
                operators: undefined as never,
                transit: undefined as never,
                flags: undefined as never,
            }
        };
        iD.fileFetcher.cache().nsi_generics = {
          genericWords: []
        };
        iD.fileFetcher.cache().preset_presets = {
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
    });
});
