import type { NodeId, Vec2 } from '../../../modules';
import type { Projection } from '../../../modules/geo/raw_mercator';

describe('iD.actionDistribute', () => {
    const projection = ((x: Vec2) => x) as Projection;
    projection.invert = projection;


    it('distributes nodes that are already in a straight line', () => {
        const nodes = [
            new iD.osmNode({ id: 'n1', loc: [0, 1] }),
            new iD.osmNode({ id: 'n2', loc: [0, 2] }),
            new iD.osmNode({ id: 'n3', loc: [0, 4] }),
            new iD.osmNode({ id: 'n4', loc: [0, 6] }),
            new iD.osmNode({ id: 'n5', loc: [0, 9] }),
        ];
        let graph = new iD.coreGraph(nodes);

        // the selection order is irrelevant
        graph = iD.actionDistribute(['n2', 'n1', 'n5', 'n3', 'n4'], projection)(graph);

        expect(nodes.map(n => graph.entity(n.id).loc)).toStrictEqual([
            [0, 1],
            [0, 3],
            [0, 5],
            [0, 7],
            [0, 9],
        ]);
    });

    it('straightens nodes first, then distributes them', () => {
        let graph = new iD.coreGraph([
            new iD.osmNode({ id: 'n1', loc: [0, 1] }),
            new iD.osmNode({ id: 'n2', loc: [1, 2] }),
            new iD.osmNode({ id: 'n3', loc: [0, 4] }),
            new iD.osmNode({ id: 'n4', loc: [1, 6] }),
            new iD.osmNode({ id: 'n5', loc: [0, 9] }),
        ]);

        const nodes: NodeId[] = ['n1', 'n2', 'n3', 'n4', 'n5'];

        graph = iD.actionDistribute(nodes, projection)(graph);
        expect(nodes.map(n => graph.entity(n).loc)).toStrictEqual([
            [expect.closeTo(0.5), 1],
            [expect.closeTo(0.5), 3],
            [expect.closeTo(0.5), 5],
            [expect.closeTo(0.5), 7],
            [expect.closeTo(0.5), 9],
        ]);
    });

    it('works on any axis (e.g. a diagonal line)', () => {
        let graph = new iD.coreGraph([
            new iD.osmNode({ id: 'n1', loc: [0, 0] }),
            new iD.osmNode({ id: 'n2', loc: [1, 1] }),
            new iD.osmNode({ id: 'n3', loc: [4, 4] }),
            new iD.osmNode({ id: 'n4', loc: [9, 9] }),
        ]);

        const nodes: NodeId[] = ['n1', 'n2', 'n3', 'n4'];

        graph = iD.actionDistribute(nodes, projection)(graph);
        expect(nodes.map(n => graph.entity(n).loc)).toStrictEqual([
            [expect.closeTo(0), expect.closeTo(0)],
            [expect.closeTo(3), expect.closeTo(3)],
            [expect.closeTo(6), expect.closeTo(6)],
            [expect.closeTo(9), expect.closeTo(9)],
        ]);
    });

    it.each`
        t      | out
        ${0}   | ${[[0, 1], [0, 2  ], [0, 4  ], [0, 6  ], [0, 9]]}
        ${0.5} | ${[[0, 1], [0, 2.5], [0, 4.5], [0, 6.5], [0, 9]]}
        ${1}   | ${[[0, 1], [0, 3  ], [0, 5  ], [0, 7  ], [0, 9]]}
    `('is transitionable at t=$t', ({ t, out }) => {
        const nodes = [
            new iD.osmNode({ id: 'n1', loc: [0, 1] }),
            new iD.osmNode({ id: 'n2', loc: [0, 2] }),
            new iD.osmNode({ id: 'n3', loc: [0, 4] }),
            new iD.osmNode({ id: 'n4', loc: [0, 6] }),
            new iD.osmNode({ id: 'n5', loc: [0, 9] }),
        ];
        let graph = new iD.coreGraph(nodes);

        const action = iD.actionDistribute(nodes.map(n => n.id), projection);
        expect(action.transitionable).toBe(true);
        graph = action(graph, t);
        expect(nodes.map(n => graph.entity(n.id).loc)).toStrictEqual(out);
    });

    describe('#disabled', () => {
        it('is disabled if there are less than 3 nodes', () => {
            const graph = new iD.coreGraph([
                new iD.osmNode({ id: 'n1', loc: [0, 1] }),
                new iD.osmNode({ id: 'n2', loc: [0, 2] }),
            ]);

            expect(iD.actionDistribute(['n1', 'n2'], projection).disabled!(graph)).toBe('too_few');
            expect(iD.actionDistribute(['n1'], projection).disabled!(graph)).toBe('too_few');
        });

        it('is disabled if the nodes are already evenly distributed', () => {
            const graph = new iD.coreGraph([
                new iD.osmNode({ id: 'n1', loc: [0, 1] }),
                new iD.osmNode({ id: 'n2', loc: [0, 2] }),
                new iD.osmNode({ id: 'n3', loc: [0, 3] }),
            ]);

            expect(iD.actionDistribute(['n1', 'n2', 'n3'], projection).disabled!(graph)).toBe('already_distributed');
        });

        it('is disabled if every node is in the exact same location', () => {
            const action = iD.actionDistribute(['n1', 'n2', 'n3'], projection);
            const graph = new iD.coreGraph([
                new iD.osmNode({ id: 'n1', loc: [1, 1] }),
                new iD.osmNode({ id: 'n2', loc: [1, 1] }),
                new iD.osmNode({ id: 'n3', loc: [1, 1] }),
            ]);
            expect(action.disabled!(graph)).toBe('already_distributed');
        });
    });
});
