describe('iD.validations.disconnected_highway', function () {
    var context;

    beforeEach(function() {
        context = iD.Context();
    });

    function createWay(tags) {
        var n1 = iD.Node({id: 'n-1', loc: [4,4]});
        var n2 = iD.Node({id: 'n-2', loc: [4,5]});

        var w = iD.Way({id: 'w-1', nodes: ['n-1', 'n-2'], tags: tags});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w)
        );
    }

    function createConnectingWays() {
        var n1 = iD.Node({id: 'n-1', loc: [4,4]});
        var n2 = iD.Node({id: 'n-2', loc: [4,5]});
        var n3 = iD.Node({id: 'n-3', loc: [5,5]});

        var w = iD.Way(
            {id: 'w-1', nodes: ['n-1', 'n-2'],
            tags: {'highway': 'unclassified'}});
        var w2 = iD.Way({
            id: 'w-2', nodes: ['n-1', 'n-3'],
            tags: {'highway': 'unclassified'}});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w),
            iD.actionAddEntity(w2)
        );
    }

    function validate() {
        var validator = iD.validationDisconnectedHighway(context);
        var changes = context.history().changes();
        return validator(changes, context.graph());
    }

    it('has no errors on init', function() {
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('finds disconnected highway', function() {
        createWay({'highway': 'unclassified'});
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql(iD.ValidationIssueType.disconnected_highway);
        expect(issue.entities).to.have.lengthOf(1);
        expect(issue.entities[0].id).to.eql('w-1');
    });

    it('ignores roads that are connected', function() {
        createConnectingWays();
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });


});
