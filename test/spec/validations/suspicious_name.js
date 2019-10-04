describe('iD.validations.suspicious_name', function () {
    var context;

    beforeEach(function() {
        context = iD.coreContext();
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
        var validator = iD.validationSuspiciousName(context);
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

    it('ignores way with no tags', function() {
        createWay({});
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores feature with no name', function() {
        createWay({ shop: 'supermarket' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores feature with a specific name', function() {
        createWay({ shop: 'supermarket', name: 'Lou\'s' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores feature with a specific name that includes a generic name', function() {
        createWay({ shop: 'supermarket', name: 'Lou\'s Store' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('flags feature with a known generic name', function() {
        createWay({ shop: 'supermarket', name: 'Store' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('suspicious_name');
        expect(issue.subtype).to.eql('generic_name');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('flags feature with a name that is just a defining tag key', function() {
        createWay({ amenity: 'drinking_water', name: 'Amenity' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('suspicious_name');
        expect(issue.subtype).to.eql('generic_name');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('flags feature with a name that is just a defining tag value', function() {
        createWay({ shop: 'red_bicycle_emporium', name: 'Red Bicycle Emporium' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('suspicious_name');
        expect(issue.subtype).to.eql('generic_name');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('ignores feature with a non-matching `not:name` tag', function() {
        createWay({ shop: 'supermarket', name: 'Lou\'s', 'not:name': 'Lous' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('flags feature with a matching `not:name` tag', function() {
        createWay({ shop: 'supermarket', name: 'Lous', 'not:name': 'Lous' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('suspicious_name');
        expect(issue.subtype).to.eql('not_name');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('flags feature with a matching a semicolon-separated `not:name` tag', function() {
        createWay({ shop: 'supermarket', name: 'Lous', 'not:name': 'Louis\';Lous;Louis\'s' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('suspicious_name');
        expect(issue.subtype).to.eql('not_name');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

});
