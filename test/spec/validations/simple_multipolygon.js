describe('iD.validations.simple_multipolygon', function() {
    const CLOSED_NODES = ['n1', 'n2', 'n3', 'n1'];
    const OPEN_NODES = ['n1', 'n2', 'n3'];

    function makeGraph({ wayNodes = CLOSED_NODES, wayTags = {}, relationTags = { type: 'multipolygon', landuse: 'grass' }, extraMembers = [] }) {
        return new iD.coreGraph([
            new iD.osmNode({ id: 'n1', loc: [0, 0] }),
            new iD.osmNode({ id: 'n2', loc: [0, 1] }),
            new iD.osmNode({ id: 'n3', loc: [1, 1] }),
            new iD.osmWay({ id: 'w1', nodes: wayNodes, tags: wayTags }),
            new iD.osmWay({ id: 'w2', nodes: ['n2', 'n3'] }),
            new iD.osmRelation({
                id: 'r1',
                tags: relationTags,
                members: [{ id: 'w1', type: 'way', role: 'outer' }, ...extraMembers]
            })
        ]);
    }

    function validate(graph, entityId) {
        return iD.validationSimpleMultipolygon()(graph.entity(entityId), graph);
    }

    describe('checkSimpleMultipolygon', function() {
        it.each(['r1', 'w1'])('flags the multipolygon with a single closed way, from %s', function(entityId) {
            const issues = validate(makeGraph({}), entityId);
            expect(issues).toHaveLength(1);
            expect(issues[0]).toMatchObject({
                type: 'simple_multipolygon',
                severity: 'warning',
                entityIds: ['r1', 'w1']
            });
        });

        it('gives the same issue id from the relation and from the way', function() {
            const graph = makeGraph({});
            expect(validate(graph, 'r1')[0].id).toEqual(validate(graph, 'w1')[0].id);
        });

        it.each([
            { description: 'an unclosed way', graph: { wayNodes: OPEN_NODES } },
            { description: 'two members', graph: { extraMembers: [{ id: 'w2', type: 'way', role: 'inner' }] } },
            { description: 'a way tag conflicting with the relation', graph: { wayTags: { landuse: 'meadow' } } },
            { description: 'a relation that is not a multipolygon', graph: { relationTags: { type: 'route', route: 'bus' } } }
        ])('ignores $description', function({ graph }) {
            const built = makeGraph(graph);
            expect(validate(built, 'r1')).toHaveLength(0);
            expect(validate(built, 'w1')).toHaveLength(0);
        });
    });

    describe('fix', function() {
        let savedAreaKeys;

        beforeEach(function() {
            savedAreaKeys = iD.osmAreaKeys;
            iD.osmSetAreaKeys({ landuse: {} });
        });

        afterEach(function() {
            iD.osmSetAreaKeys(savedAreaKeys);
        });

        it('updates the existing way with the relation tags and deletes the relation, without creating anything', function() {
            const context = iD.coreContext().assetPath('../dist/').init();
            context.history().merge(Object.values(makeGraph({ wayTags: { name: 'Parc' } }).base().entities));
            const issue = validate(context.graph(), 'r1')[0];

            issue.fixes(context)[0].onClick(context);

            const difference = context.history().difference();
            expect(difference.created()).toEqual([]);
            expect(difference.modified().map((entity) => entity.id)).toEqual(['w1']);
            expect(difference.deleted().map((entity) => entity.id)).toEqual(['r1']);
            expect(context.graph().entity('w1').tags).toEqual({ landuse: 'grass', name: 'Parc' });
        });
    });
});
