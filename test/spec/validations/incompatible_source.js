describe('iD.validations.incompatible_source', function () {
    let context;

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
    });

    function createWay(tags) {
        const n1 = iD.osmNode({id: 'n-1', loc: [4,4]});
        const n2 = iD.osmNode({id: 'n-2', loc: [4,5]});
        const n3 = iD.osmNode({id: 'n-3', loc: [5,5]});
        const w = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2', 'n-3'], tags: tags});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w)
        );
    }

    function validate() {
        const validator = iD.validationIncompatibleSource(context);
        const changes = context.history().changes();
        const entities = changes.modified.concat(changes.created);
        let issues = [];
        entities.forEach(function(entity) {
            issues = issues.concat(validator(entity, context.graph()));
        });
        return issues;
    }

    it('has no errors on init', function() {
        const issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores way with no source tag', function() {
        createWay({ amenity: 'cafe', building: 'yes', name: 'Key Largo Café'});
        const issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores way with okay source tag', function() {
        createWay({ amenity: 'cafe', building: 'yes', name: 'Key Largo Café', source: 'survey'});
        const issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores way with excepted source tag', function() {
        createWay({ amenity: 'cafe', building: 'yes', name: 'Key Largo Café', source: 'Google drive'});
        const issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('flags way with incompatible source tag', function() {
        createWay({ amenity: 'cafe', building: 'yes', name: 'Key Largo Café', source: 'Google Maps'});
        const issues = validate();
        expect(issues).to.have.lengthOf(1);
        const issue = issues[0];
        expect(issue.type).to.eql('incompatible_source');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('does not flag buildings in the google-africa-buildings dataset', function() {
        createWay({ building: 'yes', source: 'esri/Google_Africa_Buildings' });
        const issues = validate();
        expect(issues).to.have.lengthOf(0);
    });
});
