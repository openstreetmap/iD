describe('iD.validations.missing_tag', function () {
    var context;

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
    });

    function createWay(tags) {
        var n1 = new iD.osmNode({id: 'n-1', loc: [4,4]});
        var n2 = new iD.osmNode({id: 'n-2', loc: [4,5]});
        var w = new iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2'], tags: tags});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w)
        );
    }

    function createRelation(tags) {
        var n1 = new iD.osmNode({id: 'n-1', loc: [4,4]});
        var n2 = new iD.osmNode({id: 'n-2', loc: [4,5]});
        var n3 = new iD.osmNode({id: 'n-3', loc: [5,5]});
        var w = new iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2', 'n-3', 'n-1']});
        var r = new iD.osmRelation({id: 'r-1', members: [{id: 'w-1'}], tags: tags});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w),
            iD.actionAddEntity(r)
        );
    }

    function validate() {
        var validator = iD.validationMissingTag(context);
        var changes = context.history().changes();
        var entities = changes.modified.concat(changes.created);
        var issues = [];
        entities.forEach(function(entity) {
            issues = issues.concat(validator(entity, context.graph()));
        });
        return issues;
    }

    it('has no errors on init', function() {
        var issues = validate();
        expect(issues).toHaveLength(0);
    });

    it('ignores way with descriptive tags', function() {
        createWay({ leisure: 'park' });
        var issues = validate();
        expect(issues).toHaveLength(0);
    });

    it('ignores multipolygon with descriptive tags', function() {
        createRelation({ leisure: 'park', type: 'multipolygon' });
        var issues = validate();
        expect(issues).toHaveLength(0);
    });

    it('flags no tags', function() {
        createWay({});
        var issues = validate();
        expect(issues).toHaveLength(1);
        var issue = issues[0];
        expect(issue.type).toEqual('missing_tag');
        expect(issue.subtype).toEqual('any');
        expect(issue.entityIds).toHaveLength(1);
        expect(issue.entityIds[0]).toEqual('w-1');
    });

    it('flags no descriptive tags', function() {
        createWay({ name: 'Main Street', source: 'Bing' });
        var issues = validate();
        expect(issues).toHaveLength(1);
        var issue = issues[0];
        expect(issue.type).toEqual('missing_tag');
        expect(issue.subtype).toEqual('descriptive');
        expect(issue.entityIds).toHaveLength(1);
        expect(issue.entityIds[0]).toEqual('w-1');
    });

    it('flags no descriptive tags on multipolygon', function() {
        createRelation({ name: 'City Park', source: 'Bing', type: 'multipolygon' });
        var issues = validate();
        expect(issues).toHaveLength(1);
        var issue = issues[0];
        expect(issue.type).toEqual('missing_tag');
        expect(issue.subtype).toEqual('descriptive');
        expect(issue.entityIds).toHaveLength(1);
        expect(issue.entityIds[0]).toEqual('r-1');
    });

    it('flags no type tag on relation', function() {
        createRelation({ name: 'City Park', source: 'Bing', leisure: 'park' });
        var issues = validate();
        expect(issues).toHaveLength(1);
        var issue = issues[0];
        expect(issue.type).toEqual('missing_tag');
        expect(issue.subtype).toEqual('relation_type');
        expect(issue.entityIds).toHaveLength(1);
        expect(issue.entityIds[0]).toEqual('r-1');
    });

    it('ignores highway with classification', function() {
        createWay({ highway: 'primary' });
        var issues = validate();
        expect(issues).toHaveLength(0);
    });

    it('flags highway=road', function() {
        createWay({ highway: 'road' });
        var issues = validate();
        expect(issues).toHaveLength(1);
        var issue = issues[0];
        expect(issue.type).toEqual('missing_tag');
        expect(issue.subtype).toEqual('highway_classification');
        expect(issue.entityIds).toHaveLength(1);
        expect(issue.entityIds[0]).toEqual('w-1');
    });

    describe('existing relation without a type tag', function() {
        beforeEach(function() {
            context.history().merge([
                new iD.osmNode({ id: 'n1', loc: [4, 4], version: '1' }),
                new iD.osmNode({ id: 'n2', loc: [4, 5], version: '1' }),
                new iD.osmNode({ id: 'n3', loc: [5, 5], version: '1' }),
                new iD.osmWay({ id: 'w1', nodes: ['n1', 'n2'], tags: { highway: 'path' }, version: '1' }),
                new iD.osmWay({ id: 'w2', nodes: ['n2', 'n3'], tags: { highway: 'path' }, version: '1' }),
                new iD.osmRelation({ id: 'r1', members: [{ id: 'w1', type: 'way' }], tags: { 'disused:type': 'route', route: 'foot' }, version: '1' })
            ]);
        });

        it('flags the missing type tag as an error if the user edited its tags', function() {
            context.perform(iD.actionChangeTags('r1', { 'disused:type': 'route', route: 'foot', name: 'Foo' }));
            var issues = validate();
            expect(issues).toHaveLength(1);
            expect(issues[0].subtype).toEqual('relation_type');
            expect(issues[0].severity).toEqual('error');
        });

        it('flags the missing type tag only as a warning if the user just changed its members', function() {
            context.perform(iD.actionAddMember('r1', { id: 'w2', type: 'way' }));
            var issues = validate();
            expect(issues).toHaveLength(1);
            expect(issues[0].subtype).toEqual('relation_type');
            expect(issues[0].severity).toEqual('warning');
        });
    });

});
