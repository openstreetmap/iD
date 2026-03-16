describe('iD.validations.invalid_format', function () {
    var context;

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
    });

    function createPointWithTags(tags) {
        var n = iD.osmNode({id: 'n-1', loc: [4,4], tags: tags});
        context.perform(iD.actionAddEntity(n));
        return n;
    }

    function validate(entity) {
        var validator = iD.validationFormatting(context);
        return validator(entity, context.graph());
    }

    describe('URL validation', function() {
        it('should not flag valid URLs', function() {
            var entity = createPointWithTags({
                website: 'https://example.com',
                'contact:website': 'http://test.org',
                url: 'https://www.valid-site.net/path?query=1'
            });
            var issues = validate(entity);
            expect(issues).to.have.lengthOf(0);
        });

        it('should flag URLs missing scheme', function() {
            var entity = createPointWithTags({
                website: 'example.com'
            });
            var issues = validate(entity);
            expect(issues).to.have.lengthOf(1);
            expect(issues[0].type).to.eql('invalid_format');
            expect(issues[0].subtype).to.eql('website');
        });

        it('should flag malformed URLs', function() {
            var entity = createPointWithTags({
                website: 'not-a-url',
                url: 'invalid://bad url with spaces'
            });
            var issues = validate(entity);
            expect(issues).to.have.lengthOf(2);
            issues.forEach(function(issue) {
                expect(issue.type).to.eql('invalid_format');
                expect(issue.subtype).to.eql('website');
            });
        });

        it('should handle multiple URLs separated by semicolons', function() {
            var entity = createPointWithTags({
                website: 'https://example.com;invalid-url;http://valid.org'
            });
            var issues = validate(entity);
            expect(issues).to.have.lengthOf(1);
            expect(issues[0].type).to.eql('invalid_format');
            expect(issues[0].subtype).to.eql('website');
            expect(issues[0].data.count).to.eql(1);
        });

        it('should handle multiple invalid URLs', function() {
            var entity = createPointWithTags({
                website: 'bad-url1;bad-url2'
            });
            var issues = validate(entity);
            expect(issues).to.have.lengthOf(1);
            expect(issues[0].type).to.eql('invalid_format');
            expect(issues[0].subtype).to.eql('website');
            expect(issues[0].data.count).to.eql(2);
        });

        it('should validate all URL tags', function() {
            var entity = createPointWithTags({
                website: 'bad-url',
                url: 'another-bad-url',
                'contact:website': 'yet-another-bad',
                'source:url': 'still-bad'
            });
            var issues = validate(entity);
            expect(issues).to.have.lengthOf(4);
            issues.forEach(function(issue) {
                expect(issue.type).to.eql('invalid_format');
                expect(issue.subtype).to.eql('website');
            });
        });

        it('should not flag empty URL fields', function() {
            var entity = createPointWithTags({
                website: '',
                url: undefined
            });
            var issues = validate(entity);
            expect(issues).to.have.lengthOf(0);
        });

        it('should not flag URLs with accented characters', function() {
            var entity = createPointWithTags({
                website: 'https://www.rando92.fr/randonner/itinéraires/'
            });
            var issues = validate(entity);
            expect(issues).to.have.lengthOf(0);
        });

        it('should not flag internationalized domain names', function() {
            var entity = createPointWithTags({
                website: 'https://teaomārama.school.nz'
            });
            var issues = validate(entity);
            expect(issues).to.have.lengthOf(0);
        });

        it('should not flag URLs with uppercase letters in domain', function() {
            var entity = createPointWithTags({
                website: 'https://www.TownChronicle.com'
            });
            var issues = validate(entity);
            expect(issues).to.have.lengthOf(0);
        });
    });

    describe('Email validation', function() {
        it('should not flag valid emails', function() {
            var entity = createPointWithTags({
                email: 'test@example.com'
            });
            var issues = validate(entity);
            expect(issues).to.have.lengthOf(0);
        });

        it('should flag invalid emails', function() {
            var entity = createPointWithTags({
                email: 'not-an-email'
            });
            var issues = validate(entity);
            expect(issues).to.have.lengthOf(1);
            expect(issues[0].type).to.eql('invalid_format');
            expect(issues[0].subtype).to.eql('email');
        });
    });
});
