describe('iD.validations.deprecated_tag', function () {
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

    function validate() {
        var validator = iD.validationDeprecatedTag(context);
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

    it('finds deprecated tags', function() {
        createWay({'highway': 'ford'});
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql(iD.ValidationIssueType.deprecated_tags);
        expect(issue.entities).to.have.lengthOf(1);
        expect(issue.entities[0].id).to.eql('w-1');
    });


});
