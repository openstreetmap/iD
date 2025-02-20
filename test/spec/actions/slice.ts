describe('iD.actionSlice', () => {

    describe('#disabled', () => {

        it('disabled when cutline has tags', () => {
            //
            // Situation:
            //    b ---> c
            //    ^ \    |
            //    |    \ v
            //    a <--- d
            //
            //    Area a-b-c-d-a
            //    Cut line b-d; has tags

            const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
            const b = new iD.osmNode({ id: 'n2', loc: [0, 1] });
            const c = new iD.osmNode({ id: 'n3', loc: [1, 1] });
            const d = new iD.osmNode({ id: 'n4', loc: [1, 0] });
            const graph = new iD.coreGraph([
                a, b, c, d,
                new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id], tags: { area: 'yes' } }),
                new iD.osmWay({ id: 'w2', nodes: [b.id, d.id], tags: { interesting: 'yes' } })
            ]);

            expect(iD.actionSlice(['w1', 'w2']).disabled!(graph)).toBe('cutline_tagged');
        });

        it('disabled when cutline is in a relation', () => {
            //
            // Situation:
            //    b ---> c
            //    ^ \    |
            //    |    \ v
            //    a <--- d
            //
            //    Area a-b-c-d-a
            //    Cut line b-d; in is relation

            const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
            const b = new iD.osmNode({ id: 'n2', loc: [0, 1] });
            const c = new iD.osmNode({ id: 'n3', loc: [1, 1] });
            const d = new iD.osmNode({ id: 'n4', loc: [1, 0] });
            const graph = new iD.coreGraph([
                a, b, c, d,
                new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id], tags: { area: 'yes' } }),
                new iD.osmWay({ id: 'w2', nodes: [b.id, d.id] }),
                new iD.osmRelation({ id: 'r1', members: [ { id: 'w2', type: 'way', role: '' } ]})
            ]);

            expect(iD.actionSlice(['w1', 'w2']).disabled!(graph)).toBe('cutline_in_relation');
        });

        it('disabled when cutline\'s inner node has tags', () => {
            //
            // Situation:
            //    b ------> c
            //    ^  \      |
            //    |    x    |
            //    |      \  v
            //    a <------ d
            //
            //    Area a-b-c-d-a
            //    Cut line b-x-d
            //    Node x has tags

            const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
            const b = new iD.osmNode({ id: 'n2', loc: [0, 2] });
            const c = new iD.osmNode({ id: 'n3', loc: [2, 2] });
            const d = new iD.osmNode({ id: 'n4', loc: [2, 0] });
            const x = new iD.osmNode({ id: 'n24', loc: [1, 1], tags: { interesting: 'yes' } });
            const graph = new iD.coreGraph([
                a, b, c, d, x,
                new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id], tags: { area: 'yes' } }),
                new iD.osmWay({ id: 'w2', nodes: [b.id, x.id, d.id] })
            ]);

            expect(iD.actionSlice(['w1', 'w2']).disabled!(graph)).toBe('cutline_nodes_tagged');
        });

        it('disabled when cutline\'s inner node is in a relation', () => {
            //
            // Situation:
            //    b ------> c
            //    ^  \      |
            //    |    x    |
            //    |      \  v
            //    a <------ d
            //
            //    Area a-b-c-d-a
            //    Cut line b-x-d
            //    Node x is in relation

            const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
            const b = new iD.osmNode({ id: 'n2', loc: [0, 2] });
            const c = new iD.osmNode({ id: 'n3', loc: [2, 2] });
            const d = new iD.osmNode({ id: 'n4', loc: [2, 0] });
            const x = new iD.osmNode({ id: 'n24', loc: [1, 1] });
            const graph = new iD.coreGraph([
                a, b, c, d, x,
                new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id], tags: { area: 'yes' } }),
                new iD.osmWay({ id: 'w2', nodes: [b.id, x.id, d.id] }),
                new iD.osmRelation({ id: 'r1', members: [ { id: 'n24', type: 'node', role: '' } ]})
            ]);

            expect(iD.actionSlice(['w1', 'w2']).disabled!(graph)).toBe('cutline_nodes_in_relation');
        });

        it('disabled when cutline\'s inner node connects to other ways', () => {
            //
            // Situation:
            //    b --------> c
            //    ^ \         |
            //    |   \   y   |
            //    |     x     |
            //    |       \   |
            //    |         \ v
            //    a <-------- d
            //
            //    Area a-b-c-d-a
            //    Cut line b-x-d
            //    Way x-y

            const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
            const b = new iD.osmNode({ id: 'n2', loc: [0, 2] });
            const c = new iD.osmNode({ id: 'n3', loc: [2, 2] });
            const d = new iD.osmNode({ id: 'n4', loc: [2, 0] });
            const x = new iD.osmNode({ id: 'n24', loc: [1, 1] });
            const y = new iD.osmNode({ id: 'n25', loc: [1.5, 1.5] });
            const graph = new iD.coreGraph([
                a, b, c, d, x, y,
                new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id], tags: { area: 'yes' } }),
                new iD.osmWay({ id: 'w2', nodes: [b.id, x.id, d.id] }),
                new iD.osmWay({ id: 'w3', nodes: [x.id, y.id] })
            ]);

            expect(iD.actionSlice(['w1', 'w2']).disabled!(graph)).toBe('cutline_connected_to_other');
        });

        it('disabled when cutline\'s inner node connect to parent way', () => {
            //
            // Situation:
            //    b -----> c
            //    ^  \     |
            //    |     \  |
            //    |        x
            //    |     /  |
            //    |  /     v
            //    a <----- d
            //
            //    Area a-b-c-x-d-a
            //    Cut line b-x-d
            //    Node x is shared
            //

            const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
            const b = new iD.osmNode({ id: 'n2', loc: [0, 4] });
            const c = new iD.osmNode({ id: 'n3', loc: [2, 4] });
            const x = new iD.osmNode({ id: 'n24', loc: [2, 2] });
            const d = new iD.osmNode({ id: 'n4', loc: [2, 0] });
            const graph = new iD.coreGraph([
                a, b, c, d, x,
                new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, x.id, d.id, a.id], tags: { area: 'yes' } }),
                new iD.osmWay({ id: 'w2', nodes: [b.id, x.id, a.id] })
            ]);

            expect(iD.actionSlice(['w1', 'w2']).disabled!(graph)).toBe('cutline_multiple_connection');
        });

        it('disabled when cutline\'s inner node is outside the parent way', () => {
            //
            // Situation:
            //
            //           __--- x
            //     ---```     /
            //    b ---> c   /
            //    ^      |  /
            //    |      v /
            //    a <--- d
            //
            //    Area a-b-c-d-a
            //    Cut line b-x-d
            //    Node x is outside area
            //

            const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
            const b = new iD.osmNode({ id: 'n2', loc: [0, 1] });
            const c = new iD.osmNode({ id: 'n3', loc: [1, 1] });
            const d = new iD.osmNode({ id: 'n4', loc: [1, 0] });
            const x = new iD.osmNode({ id: 'n24', loc: [2, 2] });
            const graph = new iD.coreGraph([
                a, b, c, d, x,
                new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id], tags: { area: 'yes' } }),
                new iD.osmWay({ id: 'w2', nodes: [b.id, x.id, d.id] })
            ]);

            expect(iD.actionSlice(['w1', 'w2']).disabled!(graph)).toBe('cutline_outside_area');
        });

        it('disabled when cutline intersects with another way in parent way\'s multipolygon relation', () => {
            //
            // Situation:
            //    b ------------> c
            //    ^ \             |
            //    |   \           |
            //    |  u -\ ---- w  |
            //    |  |    \    |  |
            //    |  y -----\- z  |
            //    |           \   |
            //    |             \ v
            //    a <------------ d
            //
            //    Area a-b-c-d-a
            //    Cut line b-d
            //    Inner area y-u-w-z-y
            //    Relation containing Area and Inner area

            const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
            const b = new iD.osmNode({ id: 'n2', loc: [0, 5] });
            const c = new iD.osmNode({ id: 'n3', loc: [5, 5] });
            const d = new iD.osmNode({ id: 'n4', loc: [5, 0] });
            const y = new iD.osmNode({ id: 'n25', loc: [1, 2] });
            const u = new iD.osmNode({ id: 'n21', loc: [1, 3] });
            const w = new iD.osmNode({ id: 'n23', loc: [4, 3] });
            const z = new iD.osmNode({ id: 'n26', loc: [4, 2] });
            const graph = new iD.coreGraph([
                a, b, c, d, y, u, w, z,
                new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id] }),
                new iD.osmWay({ id: 'w2', nodes: [b.id, d.id] }),
                new iD.osmWay({ id: 'w3', nodes: [y.id, u.id, w.id, z.id, y.id] }),
                new iD.osmRelation({ id: 'r1', tags: { type: 'multipolygon', area: 'yes' }, members: [
                    { id: 'w1', type: 'way', role: 'outer' },
                    { id: 'w3', type: 'way', role: 'inner' }
                ]})
            ]);

            expect(iD.actionSlice(['w1', 'w2']).disabled!(graph)).toBe('cutline_intersects_inner_members');
        });

        it('disabled when cutline is on a inner multipolygon way that is not an area', () => {
            //
            // Situation:
            //    u -------------- w
            //    |                |
            //    |    b ---> c    |
            //    |    ^ \    |    |
            //    |    |    \ v    |
            //    |    a <--- d    |
            //    |                |
            //    y -------------- z
            //
            //    Area a-b-c-d-a
            //    Cut line b-d
            //    Outside area y-u-w-z-y
            //    Relation containing Area and Outside area

            const a = new iD.osmNode({ id: 'n1', loc: [1, 1] });
            const b = new iD.osmNode({ id: 'n2', loc: [1, 2] });
            const c = new iD.osmNode({ id: 'n3', loc: [2, 2] });
            const d = new iD.osmNode({ id: 'n4', loc: [2, 1] });
            const y = new iD.osmNode({ id: 'n25', loc: [0, 0] });
            const u = new iD.osmNode({ id: 'n21', loc: [0, 3] });
            const w = new iD.osmNode({ id: 'n23', loc: [3, 3] });
            const z = new iD.osmNode({ id: 'n26', loc: [3, 0] });
            const graph = new iD.coreGraph([
                a, b, c, d, y, u, w, z,
                new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id] }),
                new iD.osmWay({ id: 'w2', nodes: [b.id, d.id] }),
                new iD.osmWay({ id: 'w3', nodes: [y.id, u.id, w.id, z.id, y.id] }),
                new iD.osmRelation({ id: 'r1', tags: { type: 'multipolygon', area: 'yes' }, members: [
                    { id: 'w1', type: 'way', role: 'inner' },
                    { id: 'w3', type: 'way', role: 'outer' }
                ]})
            ]);

            expect(iD.actionSlice(['w1', 'w2']).disabled!(graph)).toBe('area_not_outer_relation_member');
        });

    });


    it('slices a square', () => {
        //
        // Situation:
        //    b ---> c
        //    ^ \    |
        //    |    \ v
        //    a <--- d
        //
        //    Area a-b-c-d-a
        //    Cut line b-d

        const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
        const b = new iD.osmNode({ id: 'n2', loc: [0, 1] });
        const c = new iD.osmNode({ id: 'n3', loc: [1, 1] });
        const d = new iD.osmNode({ id: 'n4', loc: [1, 0] });
        const graph = new iD.coreGraph([
            a, b, c, d,
            new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id], tags: { area: 'yes' } }),
            new iD.osmWay({ id: 'w2', nodes: [b.id, d.id] })
        ]);

        const graph1 = iD.actionSlice(['w1', 'w2'], ['w-1'])(graph);
        expect(graph1.hasEntity('w2')).toBeUndefined();
        expect(graph1.entity('w1').nodes).to.eql([d.id, a.id, b.id, d.id]);
        expect(graph1.entity('w-1').nodes).to.eql([b.id, c.id, d.id, b.id]);

        const graph2 = iD.actionSlice(['w2'], ['w-1'])(graph);
        expect(graph2.hasEntity('w2')).toBeUndefined();
        expect(graph2.entity('w1').nodes).to.eql([d.id, a.id, b.id, d.id]);
        expect(graph2.entity('w-1').nodes).to.eql([b.id, c.id, d.id, b.id]);
    });

    it('slices with an extra node', () => {
        //
        // Situation:
        //    b ------> c
        //    ^  \      |
        //    |    x    |
        //    |      \  v
        //    a <------ d
        //
        //    Area a-b-c-d-a
        //    Cut line b-x-d

        const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
        const b = new iD.osmNode({ id: 'n2', loc: [0, 2] });
        const c = new iD.osmNode({ id: 'n3', loc: [2, 2] });
        const d = new iD.osmNode({ id: 'n4', loc: [2, 0] });
        const x = new iD.osmNode({ id: 'n24', loc: [1, 1] });
        const graph = new iD.coreGraph([
            a, b, c, d, x,
            new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id], tags: { area: 'yes' } }),
            new iD.osmWay({ id: 'w2', nodes: [b.id, x.id, d.id] })
        ]);

        const graph1 = iD.actionSlice(['w1', 'w2'], ['w-1'])(graph);
        expect(graph1.hasEntity('w2')).toBeUndefined();
        expect(graph1.entity('w1').nodes).to.eql([d.id, a.id, b.id, x.id, d.id]);
        expect(graph1.entity('w-1').nodes).to.eql([b.id, c.id, d.id, x.id, b.id]);

        const graph2 = iD.actionSlice(['w2'], ['w-1'])(graph);
        expect(graph2.hasEntity('w2')).toBeUndefined();
        expect(graph2.entity('w1').nodes).to.eql([d.id, a.id, b.id, x.id, d.id]);
        expect(graph2.entity('w-1').nodes).to.eql([b.id, c.id, d.id, x.id, b.id]);
    });

    it('slices when another way terminates at node', () => {
        //
        // Situation:
        //    b ---> c
        //    ^ \    |
        //    |    \ v
        //    a <--- d ---> y
        //
        //    Area a-b-c-d-a
        //    Way d-y
        //    Cut line b-d

        const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
        const b = new iD.osmNode({ id: 'n2', loc: [0, 1] });
        const c = new iD.osmNode({ id: 'n3', loc: [1, 1] });
        const d = new iD.osmNode({ id: 'n4', loc: [1, 0] });
        const y = new iD.osmNode({ id: 'n25', loc: [2, 0] });
        const graph = new iD.coreGraph([
            a, b, c, d, y,
            new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id], tags: { area: 'yes' } }),
            new iD.osmWay({ id: 'w2', nodes: [b.id, d.id] }),
            new iD.osmWay({ id: 'w3', nodes: [d.id, y.id] })
        ]);

        const graph1 = iD.actionSlice(['w1', 'w2'], ['w-1'])(graph);
        expect(graph1.hasEntity('w2')).toBeUndefined();
        expect(graph1.entity('w1').nodes).to.eql([d.id, a.id, b.id, d.id]);
        expect(graph1.entity('w-1').nodes).to.eql([b.id, c.id, d.id, b.id]);

        const graph2 = iD.actionSlice(['w2'], ['w-1'])(graph);
        expect(graph2.hasEntity('w2')).toBeUndefined();
        expect(graph2.entity('w1').nodes).to.eql([d.id, a.id, b.id, d.id]);
        expect(graph2.entity('w-1').nodes).to.eql([b.id, c.id, d.id, b.id]);
    });

    it('slices when another way passes through a node', () => {
        //
        // Situation:
        //    b ---> c
        //    ^ \    |
        //    |    \ v
        //    a <--- d ---- y
        //           |
        //           u
        //
        //    Area a-b-c-d-a
        //    Way u-d-y
        //    Cut line b-d

        const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
        const b = new iD.osmNode({ id: 'n2', loc: [0, 1] });
        const c = new iD.osmNode({ id: 'n3', loc: [1, 1] });
        const d = new iD.osmNode({ id: 'n4', loc: [1, 0] });
        const y = new iD.osmNode({ id: 'n25', loc: [2, 0] });
        const u = new iD.osmNode({ id: 'n21', loc: [1, -1] });
        const graph = new iD.coreGraph([
            a, b, c, d, y, u,
            new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id], tags: { area: 'yes' } }),
            new iD.osmWay({ id: 'w2', nodes: [b.id, d.id] }),
            new iD.osmWay({ id: 'w3', nodes: [u.id, d.id, y.id] })
        ]);

        const graph1 = iD.actionSlice(['w1', 'w2'], ['w-1'])(graph);
        expect(graph1.hasEntity('w2')).toBeUndefined();
        expect(graph1.entity('w1').nodes).to.eql([d.id, a.id, b.id, d.id]);
        expect(graph1.entity('w-1').nodes).to.eql([b.id, c.id, d.id, b.id]);

        const graph2 = iD.actionSlice(['w2'], ['w-1'])(graph);
        expect(graph2.hasEntity('w2')).toBeUndefined();
        expect(graph2.entity('w1').nodes).to.eql([d.id, a.id, b.id, d.id]);
        expect(graph2.entity('w-1').nodes).to.eql([b.id, c.id, d.id, b.id]);
    });

    it('slices when another area terminates at node', () => {
        //
        // Situation:
        //    b ---> c      u
        //    ^ \    |    / |
        //    |    \ v  /   |
        //    a <--- d ---- y
        //
        //    Area a-b-c-d-a
        //    Area d-y-u-d
        //    Cut line b-d

        const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
        const b = new iD.osmNode({ id: 'n2', loc: [0, 1] });
        const c = new iD.osmNode({ id: 'n3', loc: [1, 1] });
        const d = new iD.osmNode({ id: 'n4', loc: [1, 0] });
        const y = new iD.osmNode({ id: 'n25', loc: [2, 0] });
        const u = new iD.osmNode({ id: 'n21', loc: [2, 1] });
        const graph = new iD.coreGraph([
            a, b, c, d, y, u,
            new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id], tags: { area: 'yes' } }),
            new iD.osmWay({ id: 'w2', nodes: [b.id, d.id] }),
            new iD.osmWay({ id: 'w3', nodes: [d.id, y.id, u.id, d.id] })
        ]);

        const graph1 = iD.actionSlice(['w1', 'w2'], ['w-1'])(graph);
        expect(graph1.hasEntity('w2')).toBeUndefined();
        expect(graph1.entity('w1').nodes).to.eql([d.id, a.id, b.id, d.id]);
        expect(graph1.entity('w-1').nodes).to.eql([b.id, c.id, d.id, b.id]);

        const graph2 = iD.actionSlice(['w2'], ['w-1'])(graph);
        expect(graph2.hasEntity('w2')).toBeUndefined();
        expect(graph2.entity('w1').nodes).to.eql([d.id, a.id, b.id, d.id]);
        expect(graph2.entity('w-1').nodes).to.eql([b.id, c.id, d.id, b.id]);
    });

    it('slices when another way connects to both nodes', () => {
        //
        // Situation:
        //    w ----------- u
        //    |             |
        //    b ---> c      |
        //    ^ \    |      |
        //    |    \ v      |
        //    a <--- d ---- y
        //
        //    Area a-b-c-d-a
        //    Way d-y-u-w-b
        //    Cut line b-d

        const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
        const b = new iD.osmNode({ id: 'n2', loc: [0, 1] });
        const c = new iD.osmNode({ id: 'n3', loc: [1, 1] });
        const d = new iD.osmNode({ id: 'n4', loc: [1, 0] });
        const y = new iD.osmNode({ id: 'n25', loc: [2, 0] });
        const u = new iD.osmNode({ id: 'n21', loc: [2, 2] });
        const w = new iD.osmNode({ id: 'n23', loc: [0, 2] });
        const graph = new iD.coreGraph([
            a, b, c, d, y, u, w,
            new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id], tags: { area: 'yes' } }),
            new iD.osmWay({ id: 'w2', nodes: [b.id, d.id] }),
            new iD.osmWay({ id: 'w3', nodes: [d.id, y.id, u.id, w.id, b.id] })
        ]);

        const graph1 = iD.actionSlice(['w1', 'w2'], ['w-1'])(graph);
        expect(graph1.hasEntity('w2')).toBeUndefined();
        expect(graph1.entity('w1').nodes).to.eql([d.id, a.id, b.id, d.id]);
        expect(graph1.entity('w-1').nodes).to.eql([b.id, c.id, d.id, b.id]);

        const graph2 = iD.actionSlice(['w2'], ['w-1'])(graph);
        expect(graph2.hasEntity('w2')).toBeUndefined();
        expect(graph2.entity('w1').nodes).to.eql([d.id, a.id, b.id, d.id]);
        expect(graph2.entity('w-1').nodes).to.eql([b.id, c.id, d.id, b.id]);
    });

    it('slices explicitly when another area connects to both nodes', () => {
        //
        // Situation:
        //    w ----------- u
        //    |             |
        //    b ---> c      |
        //    ^ \    |      |
        //    |    \ v      |
        //    a <--- d ---- y
        //
        //    Area a-b-c-d-a
        //    Area a-b-w-u-y-d-a
        //    Cut line b-d

        const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
        const b = new iD.osmNode({ id: 'n2', loc: [0, 1] });
        const c = new iD.osmNode({ id: 'n3', loc: [1, 1] });
        const d = new iD.osmNode({ id: 'n4', loc: [1, 0] });
        const y = new iD.osmNode({ id: 'n25', loc: [2, 0] });
        const u = new iD.osmNode({ id: 'n21', loc: [2, 2] });
        const w = new iD.osmNode({ id: 'n23', loc: [0, 2] });
        let graph = new iD.coreGraph([
            a, b, c, d, y, u, w,
            new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id], tags: { area: 'yes' } }),
            new iD.osmWay({ id: 'w2', nodes: [b.id, d.id] }),
            new iD.osmWay({ id: 'w3', nodes: [a.id, b.id, w.id, u.id, y.id, d.id, a.id] })
        ]);

        graph = iD.actionSlice(['w1', 'w2'], ['w-1'])(graph);
        expect(graph.hasEntity('w2')).toBeUndefined();
        expect(graph.entity('w1').nodes).to.eql([d.id, a.id, b.id, d.id]);
        expect(graph.entity('w-1').nodes).to.eql([b.id, c.id, d.id, b.id]);
    });

    it('slices when a cutline\'s terminal node has tags', () => {
        //
        // Situation:
        //    b ---> c
        //    ^ \    |
        //    |    \ v
        //    a <--- d
        //
        //    Area a-b-c-d-a
        //    Cut line b-d
        //    Node d has tags

        const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
        const b = new iD.osmNode({ id: 'n2', loc: [0, 1] });
        const c = new iD.osmNode({ id: 'n3', loc: [1, 1] });
        const d = new iD.osmNode({ id: 'n4', loc: [1, 0], tags: { interesting: 'yes' } });
        const graph = new iD.coreGraph([
            a, b, c, d,
            new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id], tags: { area: 'yes' } }),
            new iD.osmWay({ id: 'w2', nodes: [b.id, d.id] })
        ]);

        const graph1 = iD.actionSlice(['w1', 'w2'], ['w-1'])(graph);
        expect(graph1.hasEntity('w2')).toBeUndefined();
        expect(graph1.entity('w1').nodes).to.eql([d.id, a.id, b.id, d.id]);
        expect(graph1.entity('w-1').nodes).to.eql([b.id, c.id, d.id, b.id]);

        const graph2 = iD.actionSlice(['w2'], ['w-1'])(graph);
        expect(graph2.hasEntity('w2')).toBeUndefined();
        expect(graph2.entity('w1').nodes).to.eql([d.id, a.id, b.id, d.id]);
        expect(graph2.entity('w-1').nodes).to.eql([b.id, c.id, d.id, b.id]);
    });

    it('slices an area in a relation', () => {
        //
        // Situation:
        //    b ---> c
        //    ^ \    |
        //    |    \ v
        //    a <--- d
        //
        //    Area a-b-c-d-a
        //    Cut line b-d
        //    Relation containing Area and Node e

        const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
        const b = new iD.osmNode({ id: 'n2', loc: [0, 1] });
        const c = new iD.osmNode({ id: 'n3', loc: [1, 1] });
        const d = new iD.osmNode({ id: 'n4', loc: [1, 0] });
        const graph = new iD.coreGraph([
            a, b, c, d,
            new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id], tags: { area: 'yes' } }),
            new iD.osmWay({ id: 'w2', nodes: [b.id, d.id] }),
            new iD.osmRelation({ id: 'r1', tags: { type: 'multipolygon' }, members: [
                { id: 'w1', type: 'way', role: '' },
            ]})
        ]);

        const graph1 = iD.actionSlice(['w1', 'w2'], ['w-1'])(graph);
        expect(graph1.hasEntity('w2')).toBeUndefined();
        expect(graph1.entity('w1').nodes).to.eql([d.id, a.id, b.id, d.id]);
        expect(graph1.entity('w-1').nodes).to.eql([b.id, c.id, d.id, b.id]);

        const graph2 = iD.actionSlice(['w2'], ['w-1'])(graph);
        expect(graph2.hasEntity('w2')).toBeUndefined();
        expect(graph2.entity('w1').nodes).to.eql([d.id, a.id, b.id, d.id]);
        expect(graph2.entity('w-1').nodes).to.eql([b.id, c.id, d.id, b.id]);
    });

    it('slice when cutline doesn\'t intersect with another way in parent way\'s multipolygon relation', () => {
        //
        // Situation:
        //    b -- c --------> d
        //    ^    :           |
        //    |    :   u -- w  |
        //    |    :   |    |  |
        //    |    :   y -- z  |
        //    |    :           v
        //    a <- f <-------- e
        //
        //    Area a-b-c-d-e-f-a
        //    Cut line c-f
        //    Inner area y-u-w-z-y
        //    Relation containing Area and Inner area

        const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
        const b = new iD.osmNode({ id: 'n2', loc: [0, 3] });
        const c = new iD.osmNode({ id: 'n3', loc: [1, 3] });
        const d = new iD.osmNode({ id: 'n4', loc: [3, 3] });
        const e = new iD.osmNode({ id: 'n5', loc: [3, 0] });
        const f = new iD.osmNode({ id: 'n6', loc: [1, 0] });
        const y = new iD.osmNode({ id: 'n25', loc: [2, 1] });
        const u = new iD.osmNode({ id: 'n21', loc: [2, 2] });
        const w = new iD.osmNode({ id: 'n23', loc: [3, 2] });
        const z = new iD.osmNode({ id: 'n26', loc: [3, 1] });
        const graph = new iD.coreGraph([
            a, b, c, d, e, f, y, u, w, z,
            new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, e.id, f.id, a.id], tags: { area: 'yes' } }),
            new iD.osmWay({ id: 'w2', nodes: [c.id, f.id] }),
            new iD.osmWay({ id: 'w3', nodes: [y.id, u.id, w.id, z.id, y.id] }),
            new iD.osmRelation({ id: 'r1', tags: { type: 'multipolygon' }, members: [
                { id: 'w1', type: 'way', role: 'outer' },
                { id: 'w3', type: 'way', role: 'inner' }
            ]})
        ]);

        const graph1 = iD.actionSlice(['w1', 'w2'], ['w-1'])(graph);
        expect(graph1.hasEntity('w2')).toBeUndefined();
        expect(graph1.entity('w1').nodes).to.eql([c.id, d.id, e.id, f.id, c.id]);
        expect(graph1.entity('w-1').nodes).to.eql([f.id, a.id, b.id, c.id, f.id]);

        const graph2 = iD.actionSlice(['w2'], ['w-1'])(graph);
        expect(graph2.hasEntity('w2')).toBeUndefined();
        expect(graph2.entity('w1').nodes).to.eql([c.id, d.id, e.id, f.id, c.id]);
        expect(graph2.entity('w-1').nodes).to.eql([f.id, a.id, b.id, c.id, f.id]);
    });

    it('slice when cutline is on an area that is an inner multipolygon member', () => {
        //
        // Situation:
        //    u -------------- w
        //    |                |
        //    |    b ---> c    |
        //    |    ^ \    |    |
        //    |    |    \ v    |
        //    |    a <--- d    |
        //    |                |
        //    y -------------- z
        //
        //    Area a-b-c-d-a
        //    Cut line b-d
        //    Outside area y-u-w-z-y
        //    Relation containing Area and Outside area

        const a = new iD.osmNode({ id: 'n1', loc: [1, 1] });
        const b = new iD.osmNode({ id: 'n2', loc: [1, 2] });
        const c = new iD.osmNode({ id: 'n3', loc: [2, 2] });
        const d = new iD.osmNode({ id: 'n4', loc: [2, 1] });
        const y = new iD.osmNode({ id: 'n25', loc: [0, 0] });
        const u = new iD.osmNode({ id: 'n21', loc: [0, 3] });
        const w = new iD.osmNode({ id: 'n23', loc: [3, 3] });
        const z = new iD.osmNode({ id: 'n26', loc: [3, 0] });
        const graph = new iD.coreGraph([
            a, b, c, d, y, u, w, z,
            new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id], tags: { area: 'yes' } }),
            new iD.osmWay({ id: 'w2', nodes: [b.id, d.id] }),
            new iD.osmWay({ id: 'w3', nodes: [y.id, u.id, w.id, z.id, y.id] }),
            new iD.osmRelation({ id: 'r1', tags: { type: 'multipolygon' }, members: [
                    { id: 'w1', type: 'way', role: 'inner' },
                    { id: 'w3', type: 'way', role: 'outer' }
                ]})
        ]);

        const graph1 = iD.actionSlice(['w1', 'w2'], ['w-1'])(graph);
        expect(graph1.hasEntity('w2')).toBeUndefined();
        expect(graph1.entity('w1').nodes).to.eql([d.id, a.id, b.id, d.id]);
        expect(graph1.entity('w-1').nodes).to.eql([b.id, c.id, d.id, b.id]);

        const graph2 = iD.actionSlice(['w2'], ['w-1'])(graph);
        expect(graph2.hasEntity('w2')).toBeUndefined();
        expect(graph2.entity('w1').nodes).to.eql([d.id, a.id, b.id, d.id]);
        expect(graph2.entity('w-1').nodes).to.eql([b.id, c.id, d.id, b.id]);
    });

    it('copies given area\'s tags to the new area', () => {
        //
        // Situation:
        //    b ---> c
        //    ^ \    |
        //    |    \ v
        //    a <--- d
        //
        //    Area a-b-c-d-a
        //    Cut line b-d

        const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
        const b = new iD.osmNode({ id: 'n2', loc: [0, 1] });
        const c = new iD.osmNode({ id: 'n3', loc: [1, 1] });
        const d = new iD.osmNode({ id: 'n4', loc: [1, 0] });
        let graph = new iD.coreGraph([
            a, b, c, d,
            new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id], tags: { area: 'yes', interesting: 'very' } }),
            new iD.osmWay({ id: 'w2', nodes: [b.id, d.id] })
        ]);

        graph = iD.actionSlice(['w1', 'w2'], ['w-1'])(graph);
        expect(graph.entity('w1').tags).toStrictEqual({ area: 'yes', interesting: 'very' });
        expect(graph.entity('w-1').tags).toStrictEqual({ area: 'yes', interesting: 'very' });
    });

    it('adds the new area to the given area\'s relation', () => {
        //
        // Situation:
        //    b ---> c
        //    ^ \    |
        //    |    \ v
        //    a <--- d
        //
        //    Area a-b-c-d-a
        //    Cut line b-d

        const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
        const b = new iD.osmNode({ id: 'n2', loc: [0, 1] });
        const c = new iD.osmNode({ id: 'n3', loc: [1, 1] });
        const d = new iD.osmNode({ id: 'n4', loc: [1, 0] });
        let graph = new iD.coreGraph([
            a, b, c, d,
            new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id], tags: { area: 'yes', interesting: 'very' } }),
            new iD.osmWay({ id: 'w2', nodes: [b.id, d.id] }),
            new iD.osmRelation({ id: 'r1', tags: { type: 'multipolygon' }, members: [
                { id: 'w1', type: 'way', role: 'outer' }
            ]})
        ]);

        graph = iD.actionSlice(['w1', 'w2'], ['w-1'])(graph);
        expect(graph.entity('r1').members.map(m => m.id)).to.have.members(['w1', 'w-1']);
        // TODO: is the new one role:outer too?
    });
});
