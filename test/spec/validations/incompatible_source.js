describe('iD.validations.incompatible_source', function () {
    var context;

    beforeEach(function() {
        context = iD.coreContext().init();
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
        expect(issue.type).to.eql('incompatible_source');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

});
