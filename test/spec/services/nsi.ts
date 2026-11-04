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
                'transit/railway/station': {
                    properties: { path: 'transit/railway/station' },
                    items: [
                        {
                            mainTag: 'network:wikidata',
                            tkv: '',
                            id: 'london-elizabeth-line',
                            displayName: 'Elizabeth line',
                            locationSet: { include: ['Q2'] },
                            tags: {
                                railway: 'station',
                                public_transport: 'station',
                                network: 'Elizabeth line',
                                'network:wikidata': 'Q111297173',
                                operator: 'Transport for London',
                                'operator:wikidata': 'Q682520'
                            }
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
                transit: {
                    emoji: '',
                    nameTags: { primary: '', alternate: '' },
                    mainTag: 'network:wikidata'
                },
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

        it('does not replace an existing transit network based only on a shared operator', () => {
            const originalTags = {
                railway: 'station',
                public_transport: 'station',
                station: 'subway',
                network: 'London Underground',
                operator: 'Transport for London'
            };
            const result = iD.services.nsi.upgradeTags(originalTags, nullIslandLocation);
            expect(result).toBeNull();
        });

        it('can still match a transit network using its operator when network is absent', () => {
            const originalTags = {
                railway: 'station',
                public_transport: 'station',
                operator: 'Transport for London'
            };
            const result = iD.services.nsi.upgradeTags(originalTags, nullIslandLocation);
            expect(result?.newTags.network).toBe('Elizabeth line');
            expect(result?.matched?.id).toBe('london-elizabeth-line');
        });

    });
});
