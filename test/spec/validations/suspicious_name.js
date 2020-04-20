describe('iD.validations.suspicious_name', function () {
    var context;

    before(function() {
        iD.fileFetcher.cache().nsi_filters = { discardNames: ['^stores?$'] };
    });

    after(function() {
        iD.fileFetcher.cache().nsi_filters = { discardNames: [] };
    });

    beforeEach(function() {
        context = iD.coreContext().init();
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
        var validator = iD.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(0);
            done();
        }, 20);
    });

    it('ignores way with no tags', function(done) {
        createWay({});
        var validator = iD.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(0);
            done();
        }, 20);
    });

    it('ignores feature with no name', function(done) {
        createWay({ shop: 'supermarket' });
        var validator = iD.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(0);
            done();
        }, 20);
    });

    it('ignores feature with a specific name', function(done) {
        createWay({ shop: 'supermarket', name: 'Lou\'s' });
        var validator = iD.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(0);
            done();
        }, 20);
    });

    it('ignores feature with a specific name that includes a generic name', function(done) {
        createWay({ shop: 'supermarket', name: 'Lou\'s Store' });
        var validator = iD.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(0);
            done();
        }, 20);
    });

    it('flags feature with a known generic name', function(done) {
        createWay({ shop: 'supermarket', name: 'Store' });
        var validator = iD.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(1);
            var issue = issues[0];
            expect(issue.type).to.eql('suspicious_name');
            expect(issue.subtype).to.eql('generic_name');
            expect(issue.entityIds).to.have.lengthOf(1);
            expect(issue.entityIds[0]).to.eql('w-1');
            done();
        }, 20);
    });

    it('flags feature with a name that is just a defining tag key', function(done) {
        createWay({ amenity: 'drinking_water', name: 'Amenity' });
        var validator = iD.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(1);
            var issue = issues[0];
            expect(issue.type).to.eql('suspicious_name');
            expect(issue.subtype).to.eql('generic_name');
            expect(issue.entityIds).to.have.lengthOf(1);
            expect(issue.entityIds[0]).to.eql('w-1');
            done();
        }, 20);
    });

    it('flags feature with a name that is just a defining tag value', function(done) {
        createWay({ shop: 'red_bicycle_emporium', name: 'Red Bicycle Emporium' });
        var validator = iD.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(1);
            var issue = issues[0];
            expect(issue.type).to.eql('suspicious_name');
            expect(issue.subtype).to.eql('generic_name');
            expect(issue.entityIds).to.have.lengthOf(1);
            expect(issue.entityIds[0]).to.eql('w-1');
            done();
        }, 20);
    });

    it('ignores feature with a non-matching `not:name` tag', function(done) {
        createWay({ shop: 'supermarket', name: 'Lou\'s', 'not:name': 'Lous' });
        var validator = iD.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(0);
            done();
        }, 20);
    });

    it('flags feature with a matching `not:name` tag', function(done) {
        createWay({ shop: 'supermarket', name: 'Lous', 'not:name': 'Lous' });
        var validator = iD.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(1);
            var issue = issues[0];
            expect(issue.type).to.eql('suspicious_name');
            expect(issue.subtype).to.eql('not_name');
            expect(issue.entityIds).to.have.lengthOf(1);
            expect(issue.entityIds[0]).to.eql('w-1');
            done();
        }, 20);
    });

    it('flags feature with a matching a semicolon-separated `not:name` tag', function(done) {
        createWay({ shop: 'supermarket', name: 'Lous', 'not:name': 'Louis\';Lous;Louis\'s' });
        window.setTimeout(function() {   // async, so data will be available
            var validator = iD.validationSuspiciousName(context);
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(1);
            var issue = issues[0];
            expect(issue.type).to.eql('suspicious_name');
            expect(issue.subtype).to.eql('not_name');
            expect(issue.entityIds).to.have.lengthOf(1);
            expect(issue.entityIds[0]).to.eql('w-1');
            done();
        }, 20);
    });

});
