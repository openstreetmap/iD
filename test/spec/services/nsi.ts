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
                'operators/power/transformer': {
                    properties: { path: 'operators/power/transformer' },
                    items: [
                        {
                            mainTag: '',
                            tkv: '',
                            id: 'sydneytrains-17e0e3',
                            displayName: 'Sydney Trains',
                            locationSet: { include: ['Q2'] },
                            tags: {
                                operator: 'Sydney Trains',
                                'operator:wikidata': 'Q7660181',
                                power: 'transformer'
                            }
                        }
                    ]
                },
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
                    emoji: '💼',
                    mainTag: 'operator:wikidata',
                    sourceTags: ['operator'],
                    nameTags: {
                        primary: '^(name|name:[\\w-]+|operator|operator:[\\w-]+)$',
                        alternate: '^(brand|brand:[\\w-]+|brand:short:[\\w-]+|operator:short:[\\w-]+|\\w+_name|\\w+_name:[\\w-]+)$'
                    }
                },
                transit: undefined as never,
                flags: undefined as never,
            }
        };
        iD.fileFetcher.cache().nsi_generics = {
          genericWords: []
        };
        iD.fileFetcher.cache().preset_presets = {
            'building/office': {
                name: 'Office',
                geometry: ['area'],
                tags: {
                    building: 'office'
                }
            }
        };
    });

    beforeEach(async () => {
        await iD.presetManager.ensureLoaded(true);
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

        it('does not suggest unrelated feature tags for the Sydney Trains HQ office building', () => {
            const originalTags = {
                building: 'office',
                wikidata: 'Q7660181',
                name: 'Sydney Trains HQ'
            };
            const result = iD.services.nsi.upgradeTags(originalTags, nullIslandLocation);
            expect(result).not.toBeNull();
            expect(result?.newTags).toEqual({
                building: 'office',
                name: 'Sydney Trains HQ',
                operator: 'Sydney Trains',
                'operator:wikidata': 'Q7660181'
            });
            expect(result?.newTags).not.toHaveProperty('power');
        });
    });
});
