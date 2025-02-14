describe('iD.validations.mutually_exclusive_tags', function () {
    var context;

    beforeEach(function() {
        context = iD.coreContext().init();
    });

    function createNode(tags) {
        context.perform(
            iD.actionAddEntity({id: 'n-1', loc: [4,4], tags: tags})
        );
    }

    function validate(validator) {
        var changes = context.history().changes();
        var entities = changes.modified.concat(changes.created);
        var issues = [];
        entities.forEach(function(entity) {
            issues = issues.concat(validator(entity, context.graph()));
        });
        return issues;
    }


    it('has no errors on init', function(done) {
        var validator = iD.validationMutuallyExclusiveTags(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(0);
            done();
        }, 20);
    });

    it('has no errors on good tags', function(done) {
        createNode({'name': 'Trader Joe', 'not:name': 'Trader Jane'});
        var validator = iD.validationMutuallyExclusiveTags(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(0);
            done();
        }, 20);
    });

    it('flags mutually exclusive tags', function(done) {
        createNode({'name': 'Trader Joe', 'noname': 'yes'});
        var validator = iD.validationMutuallyExclusiveTags(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(1);
            var issue = issues[0];
            expect(issue.type).to.eql('mutually_exclusive_tags');
            expect(issue.subtype).to.eql('default');
            expect(issue.severity).to.eql('warning');
            expect(issue.entityIds).to.have.lengthOf(1);
            expect(issue.entityIds[0]).to.eql('n-1');
            done();
        }, 20);
    });

    it('flags feature with a mutually exclusive `not:name` value', function(done) {
        createNode({ shop: 'supermarket', name: 'Lous', 'not:name': 'Lous' });
        var validator = iD.validationMutuallyExclusiveTags(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(1);
            var issue = issues[0];
            expect(issue.type).to.eql('mutually_exclusive_tags');
            expect(issue.subtype).to.eql('same_value');
            expect(issue.severity).to.eql('warning');
            expect(issue.entityIds).to.have.lengthOf(1);
            expect(issue.entityIds[0]).to.eql('n-1');
            done();
        }, 20);
    });


    it('flags feature with a mutually exclusive semicolon-separated `not:name` value', function(done) {
        createNode({ shop: 'supermarket', name: 'Lous', 'not:name': 'Louis\';Lous;Louis\'s' });
        var validator = iD.validationMutuallyExclusiveTags(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(1);
            var issue = issues[0];
            expect(issue.type).to.eql('mutually_exclusive_tags');
            expect(issue.subtype).to.eql('same_value');
            expect(issue.severity).to.eql('warning');
            expect(issue.entityIds).to.have.lengthOf(1);
            expect(issue.entityIds[0]).to.eql('n-1');
            done();
        }, 20);
    });
});
