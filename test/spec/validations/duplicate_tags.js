describe('iD.validations.duplicate_tags', function () {
    var context;

    beforeEach(function() {
        context = iD.coreContext();
    });

    function createWays(tags1, tags2) {
        var n1 = iD.osmNode({id: 'n-1', loc: [4,4]});
        var n2 = iD.osmNode({id: 'n-2', loc: [4,5]});
        var n3 = iD.osmNode({id: 'n-3', loc: [3,4]});
        var n4 = iD.osmNode({id: 'n-4', loc: [3,5]});
        
        var w1 = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2'], tags: tags1});
        var w2 = iD.osmWay({id: 'w-2', nodes: ['n-3', 'n-4'], tags: tags2});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(n4),
            iD.actionAddEntity(w1),
            iD.actionAddEntity(w2)
        );
    }

    function validate() {
        var validator = iD.validationDuplicateTags();
        var changes = context.history().changes();
        var entities = changes.modified.concat(changes.created);
        var issues = [];
        
        entities.forEach(function(entity) {
            issues = issues.concat(validator(entity, context));
        });
        
        return issues;
    }

    it('has no errors on init', function() {
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('flags both ways having the same name', function() {
        createWays({ name: 'Park Street' }, { name: 'Park Street' });
        var issues = validate();
        expect(issues).to.have.lengthOf(2);

        expect(issues[0].type).to.eql('duplicate_tags');
        expect(issues[0].entities).to.have.lengthOf(1);
        expect(issues[0].entities[0].id).to.eql('w-1');

        expect(issues[1].type).to.eql('duplicate_tags');
        expect(issues[1].entities).to.have.lengthOf(1);
        expect(issues[1].entities[0].id).to.eql('w-2');
    });

    it('flags both ways having the same name (case insensitive)', function() {
        createWays({ name: 'Park Street' }, { name: 'park street' });
        var issues = validate();
        expect(issues).to.have.lengthOf(2);

        expect(issues[0].type).to.eql('duplicate_tags');
        expect(issues[0].entities).to.have.lengthOf(1);
        expect(issues[0].entities[0].id).to.eql('w-1');

        expect(issues[1].type).to.eql('duplicate_tags');
        expect(issues[1].entities).to.have.lengthOf(1);
        expect(issues[1].entities[0].id).to.eql('w-2');
    });

    it('ignores ways having different name', function() {
        createWays({ name: 'Tree Street' }, { name: 'Park Street' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('flags both ways having same start of address (without unit)', function() {
        createWays({ 'addr:housenumber': '23', 'addr:street': 'Park Street' },
                   { 'addr:housenumber': '23', 'addr:street': 'Park Street' });
        var issues = validate();
        expect(issues).to.have.lengthOf(2);

        expect(issues[0].type).to.eql('duplicate_tags');
        expect(issues[0].entities).to.have.lengthOf(1);
        expect(issues[0].entities[0].id).to.eql('w-1');

        expect(issues[1].type).to.eql('duplicate_tags');
        expect(issues[1].entities).to.have.lengthOf(1);
        expect(issues[1].entities[0].id).to.eql('w-2');
    });

    it('flags both ways having same start of address (without unit) (case-insensitive)', function() {
        createWays({ 'addr:housenumber': '23', 'addr:street': 'Park Street' },
                   { 'addr:housenumber': '23', 'addr:street': 'park street' });
        var issues = validate();
        expect(issues).to.have.lengthOf(2);

        expect(issues[0].type).to.eql('duplicate_tags');
        expect(issues[0].entities).to.have.lengthOf(1);
        expect(issues[0].entities[0].id).to.eql('w-1');

        expect(issues[1].type).to.eql('duplicate_tags');
        expect(issues[1].entities).to.have.lengthOf(1);
        expect(issues[1].entities[0].id).to.eql('w-2');
    });

    it('flags both ways having same start of address (with unit)', function() {
        createWays({ 'addr:unit': '6', 'addr:housenumber': '23', 'addr:street': 'Park Street' },
                   { 'addr:unit': '6', 'addr:housenumber': '23', 'addr:street': 'Park Street' });
        var issues = validate();
        expect(issues).to.have.lengthOf(2);

        expect(issues[0].type).to.eql('duplicate_tags');
        expect(issues[0].entities).to.have.lengthOf(1);
        expect(issues[0].entities[0].id).to.eql('w-1');

        expect(issues[1].type).to.eql('duplicate_tags');
        expect(issues[1].entities).to.have.lengthOf(1);
        expect(issues[1].entities[0].id).to.eql('w-2');
    });

    it('flags both ways having same start of address (with unit) (case-insensitive)', function() {
        createWays({ 'addr:unit': '6B', 'addr:housenumber': '23', 'addr:street': 'Park Street' },
                   { 'addr:unit': '6b', 'addr:housenumber': '23', 'addr:street': 'park street' });
        var issues = validate();
        expect(issues).to.have.lengthOf(2);

        expect(issues[0].type).to.eql('duplicate_tags');
        expect(issues[0].entities).to.have.lengthOf(1);
        expect(issues[0].entities[0].id).to.eql('w-1');

        expect(issues[1].type).to.eql('duplicate_tags');
        expect(issues[1].entities).to.have.lengthOf(1);
        expect(issues[1].entities[0].id).to.eql('w-2');
    });

    it('ignores ways having different house number, same street', function() {
        createWays({ 'addr:housenumber': '22', 'addr:street': 'Park Street' },
                   { 'addr:housenumber': '23', 'addr:street': 'Park Street' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores ways having same house number, different street', function() {
        createWays({ 'addr:housenumber': '22', 'addr:street': 'Park Street' },
                   { 'addr:housenumber': '22', 'addr:street': 'Tree Street' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores ways having different unit, same house number, same street', function() {
        createWays({ 'addr:unit': '6', 'addr:housenumber': '22', 'addr:street': 'Park Street' },
                   { 'addr:unit': '7', 'addr:housenumber': '22', 'addr:street': 'Tree Street' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores ways having no tags', function() {
        createWays({ }, { });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });
});
