describe('iD.validations.unknown_road', function () {
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

    function validate() {
        var validator = iD.validationUnknownRoad();
        var changes = context.history().changes();
        var entities = changes.modified.concat(changes.created);
        var issues = [];
        entities.forEach(function(entity) {
            issues = issues.concat(validator(entity, context));
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
        expect(issue.type).to.eql('unknown_road');
        expect(issue.entities).to.have.lengthOf(1);
        expect(issue.entities[0].id).to.eql('w-1');
    });

});
