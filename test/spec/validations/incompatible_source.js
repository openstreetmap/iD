describe('iD.validations.incompatible_source', function () {
    var context;

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
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

    function validate() {
        var validator = iD.validationIncompatibleSource(context);
        var changes = context.history().changes();
        var entities = changes.modified.concat(changes.created);
        var issues = [];
        entities.forEach(function(entity) {
            issues = issues.concat(validator(entity, context.graph()));
        });
        return issues;
    }

    it('has no errors on init', function() {
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores way with no source tag', function() {
        createWay({ amenity: 'cafe', building: 'yes', name: 'Key Largo Café'});
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores way with okay source tag', function() {
        createWay({ amenity: 'cafe', building: 'yes', name: 'Key Largo Café', source: 'survey'});
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores way with excepted source tag', function() {
        createWay({ amenity: 'cafe', building: 'yes', name: 'Key Largo Café', source: 'Google drive'});
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('flags way with incompatible source tag', function() {
        createWay({ amenity: 'cafe', building: 'yes', name: 'Key Largo Café', source: 'Google Maps'});
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).toEqual('incompatible_source');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).toEqual('w-1');
    });

    it('does not flag buildings in the google-africa-buildings dataset', function() {
        createWay({ building: 'yes', source: 'esri/Google_Africa_Buildings' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('does not flag buildings in the google-open-buildings dataset', function() {
        createWay({ building: 'yes', source: 'esri/Google_Open_Buildings' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });
});
