import { setTimeout } from 'node:timers/promises';

describe('iD.validations.suspicious_name', function () {
    var context;

    before(function() {
        iD.services.nsi = iD.serviceNsi;
        iD.fileFetcher.cache().nsi_presets = { presets: {} };
        iD.fileFetcher.cache().nsi_features = { type: 'FeatureCollection', features: [] };
        iD.fileFetcher.cache().nsi_dissolved = { dissolved: {} };
        iD.fileFetcher.cache().nsi_replacements = { replacements: {} };

        iD.fileFetcher.cache().nsi_trees = {
          trees: {
            brands: {
              mainTag: 'brand:wikidata'
            }
          }
        };
        iD.fileFetcher.cache().nsi_data = {
          nsi: {
            'brands/shop/supermarket': {
              properties: {
                path: 'brands/shop/supermarket',
                exclude: {
                  generic: ['^(mini|super)?\\s?(market|mart|mercado)( municipal)?$' ],
                  named: ['^(famiglia cooperativa|семейный)$']
                }
              }
            }
          }
        };
        iD.fileFetcher.cache().nsi_generics = {
          genericWords: ['^stores?$']
        };
        iD.fileFetcher.cache().preset_presets = {
            'Velero': { tags: { craft: 'sailmaker' }, geometry: ['line'] },
            'Constructor de barco': { tags: { craft: 'boatbuilder' }, geometry: ['line'] },
        };
    });

    after(function() {
        delete iD.services.nsi;
    });

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
    });

    function createWay(tags) {
        var n1 = iD.osmNode({id: 'n-1', loc: [4,4]});
        var n2 = iD.osmNode({id: 'n-2', loc: [4,5]});
        var n3 = iD.osmNode({id: 'n-3', loc: [5,5]});
        var w = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2', 'n-3'], tags: tags});

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

    it('has no errors on init', async () => {
        var validator = iD.validationSuspiciousName(context);
        await setTimeout(20);
        var issues = validate(validator);
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores way with no tags', async () => {
        createWay({});
        var validator = iD.validationSuspiciousName(context);
        await setTimeout(20);
        var issues = validate(validator);
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores feature with no name', async () => {
        createWay({ shop: 'supermarket' });
        var validator = iD.validationSuspiciousName(context);
        await setTimeout(20);
        var issues = validate(validator);
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores feature with a specific name', async () => {
        createWay({ shop: 'supermarket', name: 'Lou\'s' });
        var validator = iD.validationSuspiciousName(context);
        await setTimeout(20);
        var issues = validate(validator);
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores feature with a specific name that includes a generic name', async () => {
        createWay({ shop: 'supermarket', name: 'Lou\'s Store' });
        var validator = iD.validationSuspiciousName(context);
        await setTimeout(20);
        var issues = validate(validator);
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores feature matching excludeNamed pattern in name-suggestion-index', async () => {
        createWay({ shop: 'supermarket', name: 'famiglia cooperativa' });
        var validator = iD.validationSuspiciousName(context);
        await setTimeout(20);
        var issues = validate(validator);
        expect(issues).to.have.lengthOf(0);
    });

    it('flags feature matching a excludeGeneric pattern in name-suggestion-index', async () => {
        createWay({ shop: 'supermarket', name: 'super mercado' });
        var validator = iD.validationSuspiciousName(context);
        await setTimeout(20);
        var issues = validate(validator);
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('suspicious_name');
        expect(issue.subtype).to.eql('generic_name');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('flags feature matching a global exclude pattern in name-suggestion-index', async () => {
        createWay({ shop: 'supermarket', name: 'store' });
        var validator = iD.validationSuspiciousName(context);
        await setTimeout(20);
        var issues = validate(validator);
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('suspicious_name');
        expect(issue.subtype).to.eql('generic_name');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('flags feature with a name that is just a defining tag key', async () => {
        createWay({ amenity: 'drinking_water', name: 'Amenity' });
        var validator = iD.validationSuspiciousName(context);
        await setTimeout(20);
        var issues = validate(validator);
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('suspicious_name');
        expect(issue.subtype).to.eql('generic_name');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('flags feature with a name that is just a defining tag value', async () => {
        createWay({ shop: 'red_bicycle_emporium', name: 'Red Bicycle Emporium' });
        var validator = iD.validationSuspiciousName(context);
        await setTimeout(20);
        var issues = validate(validator);
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('suspicious_name');
        expect(issue.subtype).to.eql('generic_name');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('flags feature with a name that matches the preset name', async () => {
        await iD.presetManager.ensureLoaded(true);
        createWay({ craft: 'sailmaker', 'name:ca': 'Velero' });
        const validator = iD.validationSuspiciousName(context);

        const issues = validate(validator);
        expect(issues).to.have.lengthOf(1);
        expect(issues[0].type).to.eql('suspicious_name');
        expect(issues[0].hash).to.eql('name:ca=Velero');
    });

    it('flags feature with a name that matches the preset name and tag name', async () => {
        await iD.presetManager.ensureLoaded(true);
        createWay({ craft: 'boatbuilder', 'name:mi': 'boatbuilder', name: 'cOnStRuCtOr de barco' });
        const validator = iD.validationSuspiciousName(context);

        const issues = validate(validator);
        expect(issues).to.have.lengthOf(2);
        expect(issues[0].type).to.eql('suspicious_name');
        expect(issues[0].hash).to.eql('name:mi=boatbuilder');

        expect(issues[1].type).to.eql('suspicious_name');
        expect(issues[1].hash).to.eql('name=cOnStRuCtOr de barco');
    });
});
