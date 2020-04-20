describe('iD.validations.missing_tag', function () {
    var context;

    beforeEach(function() {
        context = iD.coreContext().init();
    });

    function createWay(tags) {
        var n1 = iD.osmNode({id: 'n-1', loc: [4,4]});
        var n2 = iD.osmNode({id: 'n-2', loc: [4,5]});
        var w = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2'], tags: tags});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w)
        );
    }

    function createRelation(tags) {
        var n1 = iD.osmNode({id: 'n-1', loc: [4,4]});
        var n2 = iD.osmNode({id: 'n-2', loc: [4,5]});
        var n3 = iD.osmNode({id: 'n-3', loc: [5,5]});
        var w = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2', 'n-3', 'n-1']});
        var r = iD.osmRelation({id: 'r-1', members: [{id: 'w-1'}], tags: tags});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w),
            iD.actionAddEntity(r)
        );
    }

    function validate() {
        var validator = iD.validationMissingTag(context);
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

    it('ignores way with descriptive tags', function() {
        createWay({ leisure: 'park' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores multipolygon with descriptive tags', function() {
        createRelation({ leisure: 'park', type: 'multipolygon' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('flags no tags', function() {
        createWay({});
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('missing_tag');
        expect(issue.subtype).to.eql('any');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('flags no descriptive tags', function() {
        createWay({ name: 'Main Street', source: 'Bing' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('missing_tag');
        expect(issue.subtype).to.eql('descriptive');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('flags no descriptive tags on multipolygon', function() {
        createRelation({ name: 'City Park', source: 'Bing', type: 'multipolygon' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('missing_tag');
        expect(issue.subtype).to.eql('descriptive');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('r-1');
    });

    it('flags no type tag on relation', function() {
        createRelation({ name: 'City Park', source: 'Bing', leisure: 'park' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('missing_tag');
        expect(issue.subtype).to.eql('relation_type');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('r-1');
    });

    it('ignores highway with classification', function() {
        createWay({ highway: 'primary' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('flags highway=road', function() {
        createWay({ highway: 'road' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('missing_tag');
        expect(issue.subtype).to.eql('highway_classification');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

});
