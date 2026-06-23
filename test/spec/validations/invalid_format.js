describe('iD.validations.invalid_format', function () {
    var context;

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
    });

    function createPointWithTags(tags) {
        var n = new iD.osmNode({id: 'n-1', loc: [4,4], tags: tags});
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

        it('should only flag well known tags containing URLs', function() {
            var entity = createPointWithTags({
                'website:source': 'survey',
                'wikimedia_commons': 'File:photo.jpg'
            });
            var issues = validate(entity);
            expect(issues).to.have.lengthOf(0);
        });

        it('should add a protocol in the suggested fix', function() {
            var entity = createPointWithTags({
                website: 'example.com'
            });
            var issues = validate(entity);
            expect(issues).to.have.lengthOf(1);
            expect(issues[0].type).to.eql('invalid_format');
            expect(issues[0].subtype).to.eql('website');
            const fixes = issues[0].dynamicFixes(context);
            expect(fixes).to.have.lengthOf.above(0);
            issues[0].fixes(context)[0].onClick(context);
            const fixedEntity = context.entity(entity.id);
            expect(fixedEntity.tags.website).to.eql(`https://${entity.tags.website}`);
        });

        it('should not offer to add a protocol for a URL without TLD', function() {
            var entity = createPointWithTags({
                website: 'none'
            });
            var issues = validate(entity);
            expect(issues).to.have.lengthOf(1);
            expect(issues[0].type).to.eql('invalid_format');
            expect(issues[0].subtype).to.eql('website');
            const fixes = issues[0].dynamicFixes(context);
            expect(fixes).to.have.lengthOf(0);
        });
    });

    describe('Wikimedia Commons validation', function() {
        it.each([
            'File:OpenStreetMap-Editor iD Logo.svg',
            'File:100%.svg',
        ])('should suggest moving image URLs to Wikimedia Commons', function(value) {
            const entity = createPointWithTags({
                image: value
            });
            var issues = validate(entity);
            expect(issues).to.have.lengthOf(1);
            expect(issues[0].type).to.eql('invalid_format');
            expect(issues[0].subtype).to.eql('wikimedia_commons');
            const fixes = issues[0].dynamicFixes(context);
            expect(fixes).to.have.lengthOf(1);
            issues[0].fixes(context)[0].onClick(context);
            const fixedEntity = context.entity(entity.id);
            expect(fixedEntity.tags.image).to.be.undefined;
            expect(fixedEntity.tags.wikimedia_commons).to.eql(entity.tags.image);
        });

        it('should not suggest moving tag when image tag contains a semicolon', function() {
            const entity = createPointWithTags({
                image: 'https://example.com;File:OpenStreetMap-Editor iD Logo.svg'
            });
            var issues = validate(entity);
            expect(issues).to.have.lengthOf(1);
            expect(issues[0].type).to.eql('invalid_format');
            expect(issues[0].subtype).to.eql('website'); // still an invalid URL in the tag
            const fixes = issues[0].dynamicFixes(context);
            expect(fixes).to.have.lengthOf(0);
        });

        it('should not suggest moving tag when wikimedia_commons tag is already present', function() {
            const entity = createPointWithTags({
                image: 'File:OpenStreetMap-Editor iD Logo.svg',
                wikimedia_commons: 'Category:OpenStreetMap'
            });
            var issues = validate(entity);
            expect(issues).to.have.lengthOf(1);
            expect(issues[0].subtype).to.eql('website'); // still an invalid URL in the tag
            const fixes = issues[0].dynamicFixes(context);
            expect(fixes).to.have.lengthOf(0);
        });

        it.each([
            // URL with hash
            'https://commons.wikimedia.org/wiki/File:OpenStreetMap-Editor_iD_Logo.svg#mw-jump-to-license',
            // percent-encoded URLs -> should be decoded
            'https://commons.wikimedia.org/wiki/File:Guidepost_%2863202%29.jpg',
            'https://commons.wikimedia.org/wiki/File:OSM_%EA%B2%80%ED%86%A0_%EC%9A%94%EC%B2%AD_%EB%B3%B5%EC%82%AC.png',
            'https://commons.wikimedia.org/wiki/File%3ARed_Spiral_Bike_Rack.jpg',
        ])('should propose to remove URL from Wikimedia Commons tag', function(url) {
            var entity = createPointWithTags({
                'wikimedia_commons': url
            });
            var issues = validate(entity);
            expect(issues).to.have.lengthOf(1);
            expect(issues[0].type).to.eql('invalid_format');
            expect(issues[0].subtype).to.eql('wikimedia_commons');
            const fixes = issues[0].dynamicFixes(context);
            expect(fixes).to.have.lengthOf(1);
            issues[0].fixes(context)[0].onClick(context);
            const fixedEntity = context.entity(entity.id);
            const expected = decodeURIComponent(url)
                .replace('https://commons.wikimedia.org/wiki/', '')
                .replace(/#.*/, '')
                .replace(/_/g, ' ');
            expect(fixedEntity.tags.wikimedia_commons).to.eql(expected);
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
