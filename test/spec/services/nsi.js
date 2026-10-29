describe('iD.serviceNsi', function () {
    var context;
    const world = [0, 0];

    beforeEach(() => {
        iD.services.nsi = iD.serviceNsi;
        iD.fileFetcher.cache().nsi_data = {
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
          genericWords: ['^stores?$']
        };
        iD.fileFetcher.cache().preset_presets = {
            'preset1': { tags: { craft: 'sailmaker' }, geometry: ['line'], name: 'Velero', aliases: ['Velaio'] },
            'preset2': { tags: { craft: 'boatbuilder' }, geometry: ['line'], name: 'Constructor de barco' },
            '__test__ignored_preset': { tags: { foo: 'bar' }, geometry: ['line'], name: 'Foo Bar' },
        };
    });

    afterEach(() => {
        delete iD.services.nsi;
    });

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
    });

    describe('#init', () => {
        it('loads the data', () => {
            expect(iD.services.nsi.status()).toBe('ok');
            expect(iD.services.nsi.cache().ids.has('aldi-test')).toBe(true);
        });
    });

    describe('#upgradeTags', () => {
        it('returns null for features which are not covered by NSI', () => {
            expect(iD.services.nsi.upgradeTags({ highway: 'residential', name: 'Aldi' }, world)).toBeNull();
        });

        it('adds missing brand tags [SHOULD FAIL]', () => {
            const result = iD.services.nsi.upgradeTags({ shop: 'supermarket', name: 'Aldi' }, world);
            expect(result.matched.id).toBe('aldi-test');
            expect(result.newTags).toEqual({
                shop: 'supermarket', name: 'Aldi', brand: 'Aldi', 'brand:wikidata': 'Q125054'
            });
        });

        it('adds missing brand tags [SHOULD NOT FAIL]', () => {
            const result = iD.services.nsi.upgradeTags({ shop: 'supermarket', name: 'Examplestan' }, world);
            expect(result.matched.id).toBe('example1');
            expect(result.newTags).toEqual({
                shop: 'supermarket', name: 'Examplestan', brand: 'Examplestan', 'brand:wikidata': 'Q99999999999999'
            });
        });
    });

    function createWay(tags) {
        var n1 = new iD.osmNode({id: 'n-1', loc: [4,4]});
        var n2 = new iD.osmNode({id: 'n-2', loc: [4,5]});
        var n3 = new iD.osmNode({id: 'n-3', loc: [5,5]});
        var w = new iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2', 'n-3'], tags: tags});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w)
        );
    }

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
