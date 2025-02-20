import type { coreContext, coreGraph } from '../../../modules';

describe('iD.operationSlice', () => {
    let fakeContext: coreContext;
    let graph: coreGraph;

    // Set up the fake context
    fakeContext = <coreContext>{ graph: () => graph };

    describe('valid geometry - area', () => {

        beforeEach(() => {
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

            graph = new iD.coreGraph([
                a, b, c, d,
                new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id], tags: { area: 'yes' } }),
                new iD.osmWay({ id: 'w2', nodes: [b.id, d.id] })
            ]);
        });

        describe('#not_available', () => {

            it('for no selected ids', () => {
                expect(iD.operationSlice(fakeContext, []).available()).toBe(false);
            });

            it('for selected area', () => {
                expect(iD.operationSlice(fakeContext, [ 'w1' ]).available()).toBe(false);
            });

            it('for selected cutline, area and some node', () => {
                expect(iD.operationSlice(fakeContext, [ 'w1', 'w2', 'n1' ]).available()).toBe(false);
            });

            it('for selected area and node', () => {
                expect(iD.operationSlice(fakeContext, [ 'w1', 'n2' ]).available()).toBe(false);
            });

            it('for selected cutline\'s node', () => {
                expect(iD.operationSlice(fakeContext, [ 'n2', 'n4' ]).available()).toBe(false);
            });

            it('for selected area and cutline\'s node', () => {
                expect(iD.operationSlice(fakeContext, [ 'w1', 'n2', 'n4' ]).available()).toBe(false);
            });
        });

        describe('#available', () => {

            it('for selected cutline', () => {
                expect(iD.operationSlice(fakeContext, [ 'w2' ]).available()).toBe(true);
            });

            it('for selected cutline and area', () => {
                expect(iD.operationSlice(fakeContext, [ 'w2', 'w1' ]).available()).toBe(true);
                expect(iD.operationSlice(fakeContext, [ 'w1', 'w2' ]).available()).toBe(true);
            });
        });
    });

    describe('invalid geometry - loop', () => {

        beforeEach(() => {
            //
            // Situation:
            //    b ---> c
            //    ^ \    |
            //    |    \ v
            //    a <--- d
            //
            //    Loop (closed way but not area) a-b-c-d-a
            //    Cut line b-d

            const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
            const b = new iD.osmNode({ id: 'n2', loc: [0, 1] });
            const c = new iD.osmNode({ id: 'n3', loc: [1, 1] });
            const d = new iD.osmNode({ id: 'n4', loc: [1, 0] });

            graph = new iD.coreGraph([
                a, b, c, d,
                new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id] }),
                new iD.osmWay({ id: 'w2', nodes: [b.id, d.id], tags: { interesting: 'yes' } })
            ]);
        });

        describe('#not_available', () => {

            it('for selected cutline', () => {
                expect(iD.operationSlice(fakeContext, [ 'w2' ]).available()).toBe(false);
            });

            it('for selected cutline and area', () => {
                expect(iD.operationSlice(fakeContext, [ 'w2', 'w1' ]).available()).toBe(false);
                expect(iD.operationSlice(fakeContext, [ 'w1', 'w2' ]).available()).toBe(false);
            });

            it('for selected area', () => {
                expect(iD.operationSlice(fakeContext, [ 'w1' ]).available()).toBe(false);
            });
        });
    });

    describe('valid geometry - separated multipolygon', () => {

        beforeEach(() => {
            //
            // Situation:
            //    b ---> c       y ---> w
            //    ^ \    |       ^      |
            //    |    \ |       |      v
            //    a <--- d       u <--- z
            //
            //    Area a-b-c-d-a
            //    Cut line b-d
            //    Another area u-y-w-z-u
            //    Multipolygon Relation with members Area and Another area

            const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
            const b = new iD.osmNode({ id: 'n2', loc: [0, 1] });
            const c = new iD.osmNode({ id: 'n3', loc: [1, 1] });
            const d = new iD.osmNode({ id: 'n4', loc: [1, 0] });
            const u = new iD.osmNode({ id: 'n21', loc: [2, 0] });
            const y = new iD.osmNode({ id: 'n25', loc: [2, 1] });
            const w = new iD.osmNode({ id: 'n23', loc: [3, 1] });
            const z = new iD.osmNode({ id: 'n26', loc: [2, 1] });

            graph = new iD.coreGraph([
                a, b, c, d, u, y, w, z,
                new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id] }),
                new iD.osmWay({ id: 'w3', nodes: [y.id, w.id, u.id, z.id, y.id] }),
                new iD.osmWay({ id: 'w2', nodes: [b.id, d.id] }),
                new iD.osmRelation({ id: 'r1', tags: { type: 'multipolygon', area: 'yes' }, members: [
                    { id: 'w1', type: 'way', role: 'outer' },
                    { id: 'w3', type: 'way', role: 'outer' }
                ]})
            ]);
        });

        describe('#not_available', () => {

            it('for selected cutline and other area', () => {
                expect(iD.operationSlice(fakeContext, [ 'w2', 'w3' ]).available()).toBe(false);
                expect(iD.operationSlice(fakeContext, [ 'w3', 'w2' ]).available()).toBe(false);
            });
        });

        describe('#available', () => {

            it('for selected cutline', () => {
                expect(iD.operationSlice(fakeContext, [ 'w2' ]).available()).toBe(true);
            });

            it('for selected cutline and area', () => {
                expect(iD.operationSlice(fakeContext, [ 'w2', 'w1' ]).available()).toBe(true);
                expect(iD.operationSlice(fakeContext, [ 'w1', 'w2' ]).available()).toBe(true);
            });
        });
    });

    describe('invalid geometry - relation', () => {

        beforeEach(() => {
            //
            // Situation:
            //    b ---> c       y ---> w
            //    ^ \    |       ^      |
            //    |    \ |       |      v
            //    a <--- d       u <--- z
            //
            //    Area a-b-c-d-a
            //    Cut line b-d
            //    Another area u-y-w-z-u
            //    Random Relation wtih members Area and Another area

            const a = new iD.osmNode({ id: 'n1', loc: [0, 0] });
            const b = new iD.osmNode({ id: 'n2', loc: [0, 1] });
            const c = new iD.osmNode({ id: 'n3', loc: [1, 1] });
            const d = new iD.osmNode({ id: 'n4', loc: [1, 0] });
            const u = new iD.osmNode({ id: 'n21', loc: [2, 0] });
            const y = new iD.osmNode({ id: 'n25', loc: [2, 1] });
            const w = new iD.osmNode({ id: 'n35', loc: [3, 1] });
            const z = new iD.osmNode({ id: 'n26', loc: [2, 1] });

            graph = new iD.coreGraph([
                a, b, c, d, u, y, w, z,
                new iD.osmWay({ id: 'w1', nodes: [a.id, b.id, c.id, d.id, a.id] }),
                new iD.osmWay({ id: 'w3', nodes: [y.id, w.id, u.id, z.id, y.id] }),
                new iD.osmWay({ id: 'w2', nodes: [b.id, d.id] }),
                new iD.osmRelation({ id: 'r1', tags: { type: 'whatever' }, members: [
                    { id: 'w1', type: 'way', role: '' },
                    { id: 'w3', type: 'way', role: '' }
                ]})
            ]);
        });

        describe('#not_available', () => {

            it('for selected cutline', () => {
                expect(iD.operationSlice(fakeContext, [ 'w2' ]).available()).toBe(false);
            });

            it('for selected cutline and area', () => {
                expect(iD.operationSlice(fakeContext, [ 'w2', 'w1' ]).available()).toBe(false);
                expect(iD.operationSlice(fakeContext, [ 'w1', 'w2' ]).available()).toBe(false);
            });
        });
    });
});
