describe('iD.validations.tag_suggests_area', function () {
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

    function createPoint(tags) {
        var n1 = iD.Node({id: 'n-1', loc: [4,4], tags: tags});
        context.perform(
            iD.actionAddEntity(n1)
        );
    }

    function validate() {
        var validator = iD.validationTagSuggestsArea(context);
        var changes = context.history().changes();
        return validator(changes, context.graph());
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

    it('ignores points', function() {
        createPoint({'building': 'yes'});
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('finds tags that suggest area', function() {
        createWay({'building': 'yes'});
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql(iD.ValidationIssueType.tag_suggests_area);
        expect(issue.severity).to.eql(iD.ValidationIssueSeverity.warning);
        expect(issue.entities).to.have.lengthOf(1);
        expect(issue.entities[0].id).to.eql('w-1');
    });


});
