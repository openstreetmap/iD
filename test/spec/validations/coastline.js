describe('iD.validations.coastline', function() {
    var context;

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
    });

    function perform(actions) {
        context.perform.apply(context, actions);
    }

    function createOpenWay(tags) {
        var n1 = new iD.osmNode({ id: 'n-1', loc: [0, 0] });
        var n2 = new iD.osmNode({ id: 'n-2', loc: [0.01, 0] });
        var w = new iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: tags });

        perform([
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w)
        ]);
    }

    function createClosedRing(tags, clockwise) {
        // a simple square ring in lon/lat.  The closing node is the first
        // node again so that the way counts as closed.
        // counterclockwise: land (interior) on the left - correct
        // clockwise: land on the right - wrong
        var nodeLocs = clockwise
            ? [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]
            : [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
        var nodeIds = ['n-1', 'n-2', 'n-3', 'n-4', 'n-1'];

        var nodes = nodeLocs.map(function(loc, index) {
            return new iD.osmNode({ id: nodeIds[index], loc: loc });
        });
        var w = new iD.osmWay({
            id: 'w-1',
            nodes: nodes.map(function(node) { return node.id; }),
            tags: tags
        });

        perform(nodes.map(function(node) { return iD.actionAddEntity(node); })
            .concat([iD.actionAddEntity(w)]));
    }

    function createCoastlineChain(direction) {
        // three nodes along a west-east coast
        var n1 = new iD.osmNode({ id: 'n-1', loc: [0, 0] });
        var n2 = new iD.osmNode({ id: 'n-2', loc: [0.01, 0] });
        var n3 = new iD.osmNode({ id: 'n-3', loc: [0.02, 0] });
        var w1 = new iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: { natural: 'coastline' } });

        // direction 'same' - w2 continues east; direction 'opposite' - w2 doubles back west
        var w2 = direction === 'same'
            ? new iD.osmWay({ id: 'w-2', nodes: ['n-2', 'n-3'], tags: { natural: 'coastline' } })
            : new iD.osmWay({ id: 'w-2', nodes: ['n-3', 'n-2'], tags: { natural: 'coastline' } });

        perform([
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w1),
            iD.actionAddEntity(w2)
        ]);
    }

    function createClosedCoastlineRing() {
        // a square island ring made of four ways, drawn counterclockwise so
        // that every way is connected and all directions are consistent
        var nodes = [
            new iD.osmNode({ id: 'n-1', loc: [0, 0] }),
            new iD.osmNode({ id: 'n-2', loc: [0, 0.01] }),
            new iD.osmNode({ id: 'n-3', loc: [0.01, 0.01] }),
            new iD.osmNode({ id: 'n-4', loc: [0.01, 0] })
        ];
        var ways = [
            new iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: { natural: 'coastline' } }),
            new iD.osmWay({ id: 'w-2', nodes: ['n-2', 'n-3'], tags: { natural: 'coastline' } }),
            new iD.osmWay({ id: 'w-3', nodes: ['n-3', 'n-4'], tags: { natural: 'coastline' } }),
            new iD.osmWay({ id: 'w-4', nodes: ['n-4', 'n-1'], tags: { natural: 'coastline' } })
        ];

        perform(nodes.map(function(node) { return iD.actionAddEntity(node); })
            .concat(ways.map(function(way) { return iD.actionAddEntity(way); })));
    }

    function validate() {
        var validator = iD.validationCoastline(context);
        var changes = context.history().changes();
        var entities = changes.modified.concat(changes.created);
        var issues = [];
        entities.forEach(function(entity) {
            issues = issues.concat(validator(entity, context.graph()));
        });
        return issues;
    }

    function issuesOfType(subtype) {
        return validate().filter(function(issue) {
            return issue.subtype === subtype;
        });
    }

    it('has no errors on init', function() {
        var issues = validate();
        expect(issues).toHaveLength(0);
    });

    it('ignores non-coastline ways', function() {
        createOpenWay({ highway: 'unclassified' });
        expect(validate()).toHaveLength(0);
    });

    it('flags a coastline way not connected to another coastline way', function() {
        createOpenWay({ natural: 'coastline' });
        var issues = issuesOfType('disconnect');
        expect(issues).toHaveLength(1);
        var issue = issues[0];
        expect(issue.type).toEqual('coastline');
        expect(issue.severity).toEqual('warning');
        expect(issue.entityIds).toEqual(['w-1']);
    });

    it('does not flag a closed coastline ring as disconnected', function() {
        createClosedRing({ natural: 'coastline' }, true);
        expect(issuesOfType('disconnect')).toHaveLength(0);
    });

    it('does not flag a loop of connected coastline ways', function() {
        createClosedCoastlineRing();
        expect(issuesOfType('disconnect')).toHaveLength(0);
        expect(issuesOfType('direction')).toHaveLength(0);
    });

    it('does not flag a counterclockwise closed ring', function() {
        createClosedRing({ natural: 'coastline' }, false);
        expect(issuesOfType('orientation')).toHaveLength(0);
    });

    it('flags a clockwise closed ring', function() {
        createClosedRing({ natural: 'coastline' }, true);
        var issues = issuesOfType('orientation');
        expect(issues).toHaveLength(1);
        var issue = issues[0];
        expect(issue.type).toEqual('coastline');
        expect(issue.severity).toEqual('warning');
        expect(issue.entityIds).toEqual(['w-1']);
    });

    it('does not flag a clockwise closed ring tagged as an area', function() {
        createClosedRing({ natural: 'coastline', area: 'yes' }, true);
        expect(issuesOfType('orientation')).toHaveLength(0);
    });

    it('does not flag coastline ways drawn in the same direction', function() {
        createCoastlineChain('same');
        expect(issuesOfType('direction')).toHaveLength(0);
    });

    it('flags coastline ways drawn in opposite directions', function() {
        createCoastlineChain('opposite');
        var issues = issuesOfType('direction');
        expect(issues).toHaveLength(1);
        var issue = issues[0];
        expect(issue.type).toEqual('coastline');
        expect(issue.severity).toEqual('warning');
        expect(issue.entityIds).toContain('w-1');
        expect(issue.entityIds).toContain('w-2');
    });
});