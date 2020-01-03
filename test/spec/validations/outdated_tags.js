describe('iD.validations.outdated_tags', function () {
    var context;

    beforeEach(function() {
        context = iD.coreContext();
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

    function createRelation(wayTags, relationTags) {
        var n1 = iD.osmNode({id: 'n-1', loc: [4,4]});
        var n2 = iD.osmNode({id: 'n-2', loc: [4,5]});
        var n3 = iD.osmNode({id: 'n-3', loc: [5,5]});
        var w = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2', 'n-3', 'n-1'], tags: wayTags});
        var r = iD.osmRelation({id: 'r-1', members: [{id: 'w-1'}], tags: relationTags});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w),
            iD.actionAddEntity(r)
        );
    }

    function validate() {
        var validator = iD.validationOutdatedTags(context);
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

    it('has no errors on good tags', function() {
        createWay({'highway': 'unclassified'});
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('flags deprecated tag with replacement', function() {
        createWay({'highway': 'ford'});
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('outdated_tags');
        expect(issue.subtype).to.eql('deprecated_tags');
        expect(issue.severity).to.eql('warning');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('flags deprecated tag with no replacement', function() {
        createWay({'highway': 'no'});
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('outdated_tags');
        expect(issue.subtype).to.eql('deprecated_tags');
        expect(issue.severity).to.eql('warning');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('ignores way with no relations', function() {
        createWay({});
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores multipolygon tagged on the relation', function() {
        createRelation({}, { type: 'multipolygon', building: 'yes' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('flags multipolygon tagged on the outer way', function() {
        createRelation({ building: 'yes' }, { type: 'multipolygon' });
        var issues = validate();
        expect(issues).to.not.have.lengthOf(0);
        var issue = issues[0];
        expect(issue.type).to.eql('outdated_tags');
        expect(issue.subtype).to.eql('old_multipolygon');
        expect(issue.entityIds).to.have.lengthOf(2);
        expect(issue.entityIds[0]).to.eql('w-1');
        expect(issue.entityIds[1]).to.eql('r-1');
    });

});
