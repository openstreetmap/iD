describe('iD.validations.duplicate_address', function () {
    var context;

    beforeEach(function() {
        context = iD.coreContext();
    });

    function createPair(tags1, tags2, loc1, loc2) {
        loc1 = loc1 || [0, 0];
        loc2 = loc2 || [0.000001, 0.000001];

        entities = [
            iD.osmNode({ tags: tags1, loc: loc1 }),
            iD.osmNode({ tags: tags2, loc: loc2 })
        ];
        context.perform(
            iD.actionAddEntity(entities[0]),
            iD.actionAddEntity(entities[1])
        );
        return entities;
    }


    function validate(entities) {
        var validator = iD.validationDuplicateAddress(context);
        var issues = [];
        entities.forEach(function(entity) {
            issues = issues.concat(validator(entity, context.graph()));
        });
        return issues;
    }


    it('raises no issues if different housenumbers', function() {
        var entities = createPair(
            { 'name': 'Foo', 'addr:housenumber': '1' },
            { 'name': 'Bar', 'addr:housenumber': '2' }
        );
        var issues = validate(entities);
        expect(issues).to.have.lengthOf(0);
    });

    it('raises issue if same housenumbers', function() {
        var entities = createPair(
            { 'name': 'Foo', 'addr:housenumber': '1' },
            { 'name': 'Bar', 'addr:housenumber': '1' }
        );
        var issues = validate(entities);
        expect(issues).to.have.lengthOf(2);
        var issue = issues[0];
        expect(issue.type).to.eql('duplicate_address');
        expect(issue.severity).to.eql('warning');
        expect(issue.entityIds).to.have.lengthOf(2);
    });

    it('raises no issues if identical addresses, but far apart', function() {
        var entities = createPair(
            { 'name': 'Foo', 'addr:housenumber': '1' },
            { 'name': 'Bar', 'addr:housenumber': '2' }
            [0, 0],
            [0.01, 0.01]
        );
        var issues = validate(entities);
        expect(issues).to.have.lengthOf(0);
    });

    it('raises issue if housenumbers overlap in a semicolon-delimited list', function() {
        var entities = createPair(
            { 'name': 'Foo', 'addr:housenumber': '1;2' },
            { 'name': 'Bar', 'addr:housenumber': '2;3' }
        );
        var issues = validate(entities);
        expect(issues).to.have.lengthOf(2);
        var issue = issues[0];
        expect(issue.type).to.eql('duplicate_address');
        expect(issue.severity).to.eql('warning');
        expect(issue.entityIds).to.have.lengthOf(2);
    });

    it('raises issue if housenumbers overlap in comma-delimited list', function() {
        var entities = createPair(
            { 'name': 'Foo', 'addr:housenumber': '1,2' },
            { 'name': 'Bar', 'addr:housenumber': '2,3' }
        );
        var issues = validate(entities);
        expect(issues).to.have.lengthOf(2);
        var issue = issues[0];
        expect(issue.type).to.eql('duplicate_address');
        expect(issue.severity).to.eql('warning');
        expect(issue.entityIds).to.have.lengthOf(2);
    });


    // both must be present for comparison
    ['addr:street', 'addr:place', 'addr:block', 'addr:city', 'addr:postcode'].forEach(function (k) {
        describe('compares ' + k + ' (both must be present)', function() {
            it('raises no issues if different ' + k, function() {
                var t1 = { 'name': 'Foo', 'addr:housenumber': '1' };  t1[k] = 'Abbey Road';
                var t2 = { 'name': 'Bar', 'addr:housenumber': '1' };  t2[k] = 'Penny Lane';
                var entities = createPair(t1, t2);
                var issues = validate(entities);
                expect(issues).to.have.lengthOf(0);
            });

            it('raises issue if identical ' + k + ' with both present', function() {
                var t1 = { 'name': 'Foo', 'addr:housenumber': '1' };  t1[k] = 'Abbey Road';
                var t2 = { 'name': 'Bar', 'addr:housenumber': '1' };  t2[k] = 'Abbey Road';
                var entities = createPair(t1, t2);
                var issues = validate(entities);
                expect(issues).to.have.lengthOf(2);
                var issue = issues[0];
                expect(issue.type).to.eql('duplicate_address');
                expect(issue.severity).to.eql('warning');
                expect(issue.entityIds).to.have.lengthOf(2);
            });

            it('raises issue if case-dissimilar ' + k + ' with both present', function() {
                var t1 = { 'name': 'Foo', 'addr:housenumber': '1' };  t1[k] = 'Abbey Road';
                var t2 = { 'name': 'Bar', 'addr:housenumber': '1' };  t2[k] = 'abbey road';
                var entities = createPair(t1, t2);
                var issues = validate(entities);
                expect(issues).to.have.lengthOf(2);
                var issue = issues[0];
                expect(issue.type).to.eql('duplicate_address');
                expect(issue.severity).to.eql('warning');
                expect(issue.entityIds).to.have.lengthOf(2);
            });

            it('raises issue if one ' + k + ' present and one missing', function() {
                var t1 = { 'name': 'Foo', 'addr:housenumber': '1' };  t1[k] = 'Abbey Road';
                var t2 = { 'name': 'Bar', 'addr:housenumber': '1' };
                var entities = createPair(t1, t2);
                var issues = validate(entities);
                expect(issues).to.have.lengthOf(2);
                var issue = issues[0];
                expect(issue.type).to.eql('duplicate_address');
                expect(issue.severity).to.eql('warning');
                expect(issue.entityIds).to.have.lengthOf(2);
            });
        });
    });

    // one must be present for comparison
    ['addr:door', 'addr:unit', 'addr:flats', 'addr:floor'].forEach(function (k) {
        describe('compares ' + k + ' (one must be present)', function() {
            it('raises no issues if different ' + k, function() {
                var t1 = { 'name': 'Foo', 'addr:housenumber': '1' };  t1[k] = '1B';
                var t2 = { 'name': 'Bar', 'addr:housenumber': '1' };  t2[k] = '2B';
                var entities = createPair(t1, t2);
                var issues = validate(entities);
                expect(issues).to.have.lengthOf(0);
            });

            it('raises issue if identical ' + k + ' with both present', function() {
                var t1 = { 'name': 'Foo', 'addr:housenumber': '1' };  t1[k] = '1B';
                var t2 = { 'name': 'Bar', 'addr:housenumber': '1' };  t2[k] = '1B';
                var entities = createPair(t1, t2);
                var issues = validate(entities);
                expect(issues).to.have.lengthOf(2);
                var issue = issues[0];
                expect(issue.type).to.eql('duplicate_address');
                expect(issue.severity).to.eql('warning');
                expect(issue.entityIds).to.have.lengthOf(2);
            });

            it('raises issue if case-dissimilar ' + k + ' with both present', function() {
                var t1 = { 'name': 'Foo', 'addr:housenumber': '1' };  t1[k] = '1B';
                var t2 = { 'name': 'Bar', 'addr:housenumber': '1' };  t2[k] = '1b';
                var entities = createPair(t1, t2);
                var issues = validate(entities);
                expect(issues).to.have.lengthOf(2);
                var issue = issues[0];
                expect(issue.type).to.eql('duplicate_address');
                expect(issue.severity).to.eql('warning');
                expect(issue.entityIds).to.have.lengthOf(2);
            });

            it('raises no issue if one ' + k + ' present and one missing', function() {
                var t1 = { 'name': 'Foo', 'addr:housenumber': '1' };  t1[k] = '1B';
                var t2 = { 'name': 'Bar', 'addr:housenumber': '1' };
                var entities = createPair(t1, t2);
                var issues = validate(entities);
                expect(issues).to.have.lengthOf(0);
            });
        });
    });

});
