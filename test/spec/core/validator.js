describe('iD.coreValidator', function () {
    var context;

    beforeEach(function() {
        context = iD.coreContext().init();
    });

    function createInvalidWay() {
        var n1 = iD.osmNode({id: 'n-1', loc: [4,4]});
        var n2 = iD.osmNode({id: 'n-2', loc: [4,5]});
        var w = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2']});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w)
        );
    }

    it('has no issues on init', function() {
        var validator = new iD.coreValidator(context);
        validator.init();
        var issues = validator.getIssues();
        expect(issues).to.have.lengthOf(0);
    });

    it('populates issues on validate', function() {
        createInvalidWay();
        var validator = new iD.coreValidator(context);
        validator.init();
        var issues = validator.getIssues();
        expect(issues).to.have.lengthOf(0);

        validator.validate();
        issues = validator.getIssues();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('missing_tag');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

});
