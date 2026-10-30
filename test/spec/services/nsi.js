describe('iD.serviceNsi', function () {
    var context;
    const world = [0, 0];

    beforeEach(() => {
        iD.services.nsi = iD.serviceNsi;
        iD.fileFetcher.cache().nsi_data = {
            nsi: {
                'brands/shop/supermarket': {
                    properties: { path: 'brands/shop/supermarket' },
                    items: [
                        {
                            id: 'example1',
                            displayName: 'Examplestan',
                            locationSet: { include: ['001'] },
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
              mainTag: 'brand:wikidata'
            }
          }
        };
        iD.fileFetcher.cache().nsi_generics = {
          genericWords: []
        };
        iD.fileFetcher.cache().preset_presets = {
        };
    });

    beforeEach(async () => {
        context = iD.coreContext().assetPath('../dist/').init();
        await vi.waitFor(() => {
            if (iD.services.nsi.status() === 'loading') throw new Error('NSI still loading');
        }, { timeout: 1000, interval: 50 });
    });

    afterEach(() => {
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
            expect(iD.services.nsi.upgradeTags({ highway: 'residential', name: 'Aldi' }, world)).toBeNull();
        });

        it('adds missing brand tags', () => {
            const result = iD.services.nsi.upgradeTags({ shop: 'supermarket', name: 'Examplestan' }, world);
            expect(result.matched.id).toBe('example1');
            expect(result.newTags).toEqual({
                shop: 'supermarket', name: 'Examplestan', brand: 'Examplestan', 'brand:wikidata': 'Q99999999999999'
            });
        });
    });

    function validate(validator) {
        var changes = context.history().changes();
        var entities = changes.modified.concat(changes.created);
        var issues = [];
        entities.forEach(function(entity) {
            issues = issues.concat(validator(entity, context.graph()));
        });
        return issues;
    }

    it('has no errors on init', () => {
        var validator = iD.validationSuspiciousName(context);

        var issues = validate(validator);
        expect(issues).toHaveLength(0);
    });
});
