describe('iD.validations.overlapping_ways', function () {
    var context;

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
    });

    function createWaysWithOverlappingSegment(tags1, tags2, reverseOrder) {
        var n1 = new iD.osmNode({id: 'n-1', loc: [1, 1]});
        var n2 = new iD.osmNode({id: 'n-2', loc: [2, 2]});
        var w1 = new iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2'], tags: tags1});
        var w2 = new iD.osmWay({id: 'w-2', nodes: reverseOrder ? ['n-2', 'n-1'] : ['n-1', 'n-2'], tags: tags2});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w1),
            iD.actionAddEntity(w2),
        );
    }

    function validate() {
        var validator = iD.validationOverlappingWays(context);
        var changes = context.history().changes();
        var entities = changes.modified.concat(changes.created);
        var issues = [];
        entities.forEach(function(entity) {
            issues = issues.concat(validator(entity, context.graph()));
        });
        return issues;
    }

    function verifySingleOverlapIssue(issues) {
        // each entity must produce an identical issue
        expect(issues).toHaveLength(2);
        expect(issues[0].id).toEqual(issues[1].id);

        for (const issue of issues) {
            expect(issue.type).toEqual('overlapping_ways');
            expect(issue.severity).toEqual('warning');
        }
    }

    it('has no errors on init', function() {
        var issues = validate();
        expect(issues).toHaveLength(0);
    });

    it('ignores untagged line overlapping untagged line', function() {
        createWaysWithOverlappingSegment({}, {});
        var issues = validate();
        expect(issues).toHaveLength(0);
    });

    it('ignores untagged line overlapping road', function() {
        createWaysWithOverlappingSegment({ highway: 'residential' }, {});
        var issues = validate();
        expect(issues).toHaveLength(0);
    });

    it('ignores road and road connected at single vertex', function() {
        var n1 = new iD.osmNode({id: 'n-1', loc: [1, 1]});
        var n2 = new iD.osmNode({id: 'n-2', loc: [2, 2]});
        var n3 = new iD.osmNode({id: 'n-3', loc: [3, 3]});
        var w1 = new iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2'], tags: { highway: 'residential' }});
        var w2 = new iD.osmWay({id: 'w-2', nodes: ['n-2', 'n-3'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w1),
            iD.actionAddEntity(w2)
        );

        var issues = validate();
        expect(issues).toHaveLength(0);
    });


    it('ignores non-consecutive nodes overlap', function() {
        var n1 = new iD.osmNode({id: 'n-1', loc: [1, 1]});
        var n2 = new iD.osmNode({id: 'n-2', loc: [2, 2]});
        var n3 = new iD.osmNode({id: 'n-3', loc: [3, 3]});
        var w1 = new iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2', 'n-3'], tags: { highway: 'residential' }});
        var w2 = new iD.osmWay({id: 'w-2', nodes: ['n-1', 'n-3'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w1),
            iD.actionAddEntity(w2)
        );

        var issues = validate();
        expect(issues).toHaveLength(0);
    });

    it('flags road overlapping road in same direction', function() {
        createWaysWithOverlappingSegment({ highway: 'residential' }, { highway: 'tertiary' });
        verifySingleOverlapIssue(validate());
    });

    it('flags road overlapping road in reverse direction', function() {
        createWaysWithOverlappingSegment({ highway: 'residential' }, { highway: 'tertiary' }, true);
        verifySingleOverlapIssue(validate());
    });


    it('flags multiple overlapping segments between two ways', function() {
        var n1 = new iD.osmNode({id: 'n-1', loc: [1, 1]});
        var n2 = new iD.osmNode({id: 'n-2', loc: [2, 2]});
        var n3 = new iD.osmNode({id: 'n-3', loc: [3, 3]});
        var w1 = new iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2', 'n-3'], tags: { highway: 'residential' }});
        var w2 = new iD.osmWay({id: 'w-2', nodes: ['n-3', 'n-2', 'n-1'], tags: { highway: 'tertiary' }});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w1),
            iD.actionAddEntity(w2),
        );
        var issues = validate();
        // 2 segments * 2 entities = 4 issues total (2 unique issue ids)
        expect(issues).toHaveLength(4);
        var uniqueIds = new Set(issues.map(function(issue) { return issue.id; }));
        expect(uniqueIds.size).toEqual(2);
    });
});
