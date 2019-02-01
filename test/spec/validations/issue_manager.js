describe('iD.validations.coreValidator', function () {
    var context;

    beforeEach(function() {
        context = iD.Context();
    });

    function createInvalidWay() {
        var n1 = iD.Node({id: 'n-1', loc: [4,4]});
        var n2 = iD.Node({id: 'n-2', loc: [4,5]});

        var w = iD.Way({id: 'w-1', nodes: ['n-1', 'n-2']});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w)
        );
    }

    it('has no issues on init', function() {
        var validator = new iD.coreValidator(context);
        var issues = validator.getIssues();
        expect(issues).to.have.lengthOf(0);
    });

    it('populates issues on validate', function() {
        createInvalidWay();
        var validator = new iD.coreValidator(context);
        var issues = validator.getIssues();
        expect(issues).to.have.lengthOf(0);

        validator.validate();
        issues = validator.getIssues();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql(iD.ValidationIssueType.missing_tag);
        expect(issue.entities).to.have.lengthOf(1);
        expect(issue.entities[0].id).to.eql('w-1');
    });


});
