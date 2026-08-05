describe('iD.validations.disconnected_way', function() {
    var context;

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
    });

    function createWay(tags) {
        var n1 = new iD.osmNode({ id: 'n-1', loc: [4, 4] });
        var n2 = new iD.osmNode({ id: 'n-2', loc: [4, 5] });
        var w = new iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: tags });

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w)
        );
    }

    function createConnectingWays(tags1, tags2) {
        var n1 = new iD.osmNode({ id: 'n-1', loc: [4, 4] });
        var n2 = new iD.osmNode({ id: 'n-2', loc: [4, 5] });
        var n3 = new iD.osmNode({ id: 'n-3', loc: [5, 5] });
        var w = new iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: tags1 });
        var w2 = new iD.osmWay({ id: 'w-2', nodes: ['n-1', 'n-3'], tags: tags2 });

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w),
            iD.actionAddEntity(w2)
        );
    }

    function createNoExitWays(wayNodes, nodeTags, wayTags) {
        var nodes = [
            new iD.osmNode({ id: 'n-1', loc: [4, 4], tags: { entrance: 'yes' } }),
            new iD.osmNode({ id: 'n-2', loc: [4, 5], tags: nodeTags }),
            new iD.osmNode({ id: 'n-3', loc: [4, 6], tags: { entrance: 'yes' } })
        ];
        var ways = wayNodes.map(function(nodeIDs, index) {
            return new iD.osmWay({ id: 'w-' + (index + 1), nodes: nodeIDs,
                tags: wayTags && wayTags[index] || { highway: 'residential' } });
        });

        context.perform(
            ...nodes.map(function(node) { return iD.actionAddEntity(node); }),
            ...ways.map(function(way) { return iD.actionAddEntity(way); })
        );

        return nodes[1];
    }

    function validateEntity(entity) { return iD.validationDisconnectedWay(context)(entity, context.graph()); }

    function validate() {
        var validator = iD.validationDisconnectedWay(context);
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

    it('flags disconnected highway', function() {
        createWay({ 'highway': 'unclassified' });
        var issues = validate();
        expect(issues).toHaveLength(1);
        var issue = issues[0];
        expect(issue.type).toEqual('disconnected_way');
        expect(issue.subtype).toEqual('highway');
        expect(issue.severity).toEqual('warning');
        expect(issue.entityIds).toHaveLength(1);
        expect(issue.entityIds[0]).toEqual('w-1');
    });

    it('flags highway connected only to service area', function() {
        createConnectingWays({ 'highway': 'unclassified' }, { 'highway': 'services' });
        var issues = validate();
        expect(issues).toHaveLength(1);
        var issue = issues[0];
        expect(issue.type).toEqual('disconnected_way');
        expect(issue.subtype).toEqual('highway');
        expect(issue.severity).toEqual('warning');
        expect(issue.entityIds).toHaveLength(1);
        expect(issue.entityIds[0]).toEqual('w-1');
    });

    it('flags disconnected highway multipolygon', function() {
        createWay({});
        const r = new iD.osmRelation({ id: 'r-1', members: [{
            type: 'way',
            id: 'w-1',
            role: 'outer'
        }], tags: {
            highway: 'pedestrian',
            type: 'multipolygon'
        } });

        context.perform(iD.actionAddEntity(r));
        var issues = validate();
        expect(issues).toHaveLength(1);
        var issue = issues[0];
        expect(issue.type).toEqual('disconnected_way');
        expect(issue.subtype).toEqual('highway');
        expect(issue.severity).toEqual('warning');
        expect(issue.entityIds).toHaveLength(1);
        expect(issue.entityIds[0]).toEqual('r-1');
    });

    it('ignores highway with connected entrance vertex', function() {
        var n1 = new iD.osmNode({ id: 'n-1', loc: [4, 4], tags: { 'entrance': 'yes' } });
        var n2 = new iD.osmNode({ id: 'n-2', loc: [4, 5] });
        var n3 = new iD.osmNode({ id: 'n-3', loc: [5, 5] });
        var w = new iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: { 'highway': 'unclassified' } });
        var w2 = new iD.osmWay({ id: 'w-2', nodes: ['n-1', 'n-3'] });

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w),
            iD.actionAddEntity(w2)
        );

        var issues = validate();
        expect(issues).toHaveLength(0);
    });

    it('ignores disconnected golf walking path', function () {
        createWay({ 'highway': 'footway', 'golf': 'path' });
        expect(validate()).toHaveLength(0);
    });

    it('ignores disconnected golf cartpath', function () {
        createWay({ 'highway': 'path', 'golf': 'cartpath' });
        expect(validate()).toHaveLength(0);
    });

    it('considers golf path as routable when checking connectivity of other paths', function () {
        createWay();

        const n1 = new iD.osmNode({ id: 'n-1', loc: [4, 4], tags: { 'entrance': 'yes' } });
        const n2 = new iD.osmNode({ id: 'n-2', loc: [4, 5] });
        const n3 = new iD.osmNode({ id: 'n-3', loc: [5, 5] });
        const w = new iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: { 'highway': 'path', 'golf': 'cartpath' } });
        const w2 = new iD.osmWay({ id: 'w-2', nodes: ['n-2', 'n-3'], tags: { 'highway': 'unclassified' } });

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w),
            iD.actionAddEntity(w2)
        );

        expect(validate()).toHaveLength(0);
    });

    it('ignores disconnected aerialway', function () {
        createWay({ 'aerialway': 'gondola' });
        expect(validate()).toHaveLength(0);
    });

    it('considers aerialway as routable when checking connectivity of other paths', function () {
        createWay();

        const n1 = new iD.osmNode({ id: 'n-1', loc: [4, 4], tags: { 'entrance': 'yes' } });
        const n2 = new iD.osmNode({ id: 'n-2', loc: [4, 5] });
        const n3 = new iD.osmNode({ id: 'n-3', loc: [5, 5] });
        const w = new iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: { 'aerialway': ' 	gondola' } });
        const w2 = new iD.osmWay({ id: 'w-2', nodes: ['n-2', 'n-3'], tags: { 'highway': 'corridor' } });

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w),
            iD.actionAddEntity(w2)
        );

        expect(validate()).toHaveLength(0);
    });

    it('allows noexit at the endpoint of one highway', function() {
        var node = createNoExitWays([['n-1', 'n-2']], { noexit: 'yes' });
        expect(validateEntity(node)).toHaveLength(0);
    });

    it('flags noexit at a node joining two highways', function() {
        var node = createNoExitWays([
            ['n-1', 'n-2'],
            ['n-2', 'n-3']
        ], { noexit: 'yes' });
        expect(validateEntity(node)).toEqual([expect.objectContaining({ type: 'disconnected_way', subtype: 'invalid_noexit', severity: 'warning', entityIds: ['n-2'] })]);
    });
    it('flags noexit at an interior node', function() {
        var node = createNoExitWays([['n-1', 'n-2', 'n-3']], { noexit: 'yes' });
        expect(validateEntity(node)).toEqual([expect.objectContaining({ type: 'disconnected_way', subtype: 'invalid_noexit', severity: 'warning', entityIds: ['n-2'] })]);
    });
    it('flags noexit in closed and repeated topology', function() {
        var node = createNoExitWays([['n-2', 'n-1', 'n-3', 'n-2', 'n-1', 'n-2']], { noexit: 'yes' });
        expect(validateEntity(node)).toEqual([expect.objectContaining({ type: 'disconnected_way', subtype: 'invalid_noexit', severity: 'warning', entityIds: ['n-2'] })]);
    });
    it('ignores way-tagged noexit', function() {
        var node = createNoExitWays([['n-1', 'n-2']], {}, [{ highway: 'residential', noexit: 'yes' }]);
        expect(validateEntity(node)).toHaveLength(0);
    });
    it('ignores non-yes noexit values', function() {
        var node = createNoExitWays([['n-1', 'n-2']], { noexit: 'no' });
        expect(validateEntity(node)).toHaveLength(0);
    });

    it('removes noexit without losing other current tags', function() {
        var node = createNoExitWays([['n-1', 'n-2'], ['n-2', 'n-3']], {
            noexit: 'yes',
            source: 'survey'
        });
        var issue = validateEntity(node)[0];

        context.perform(iD.actionChangeTags(node.id, {
            noexit: 'yes',
            source: 'survey',
            surface: 'asphalt'
        }));

        var fix = issue.fixes(context)[0];
        fix.onClick(context);
        expect(context.entity(node.id).tags).toEqual({
            source: 'survey',
            surface: 'asphalt'
        });
    });
});
