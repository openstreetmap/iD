import { select as d3_select } from 'd3-selection';

describe('iD.modeSelect', function() {
    var context, container;

    beforeEach(function() {
        container = d3_select('body').append('div');
        context = iD.coreContext().assetPath('../dist/').init().container(container);

        container
            .append('div')
            .attr('class', 'main-map')
            .call(context.map())
            .append('div')
            .attr('class', 'inspector-wrap');

        context.enter(iD.modeBrowse(context));
    });

    afterEach(function() {
        context.mode().exit();
        container.remove();
    });

    describe('selectChild', function() {
        it('selects all child nodes when an open way is selected', function() {
            const node1 = new iD.osmNode({id: 'n1', loc: [0, 0]});
            const node2 = new iD.osmNode({id: 'n2', loc: [1, 1]});
            const node3 = new iD.osmNode({id: 'n3', loc: [2, 2]});

            const way = new iD.osmWay({id: 'w1', nodes: ['n1', 'n2', 'n3']});

            context.perform(
                iD.actionAddEntity(node1),
                iD.actionAddEntity(node2),
                iD.actionAddEntity(node3),
                iD.actionAddEntity(way)
            );

            context.enter(iD.modeSelect(context, ['w1']));

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true }));

            expect(context.selectedIDs()).toEqual(['n1', 'n2', 'n3']);
        });

        it('selects all child nodes when a closed way is selected', function() {
            const node1 = new iD.osmNode({id: 'n1', loc: [0, 0]});
            const node2 = new iD.osmNode({id: 'n2', loc: [1, 1]});
            const node3 = new iD.osmNode({id: 'n3', loc: [2, 2]});
            const node4 = new iD.osmNode({id: 'n4', loc: [0, 0]});

            const area = new iD.osmWay({id: 'w1', nodes: ['n1', 'n2', 'n3', 'n4', 'n1']});

            context.perform(
                iD.actionAddEntity(node1),
                iD.actionAddEntity(node2),
                iD.actionAddEntity(node3),
                iD.actionAddEntity(node4),
                iD.actionAddEntity(area)
            );

            context.enter(iD.modeSelect(context, ['w1']));

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true }));

            expect(context.selectedIDs()).toEqual(['n1', 'n2', 'n3', 'n4']);
        });

        it('selects all child nodes when a way with a revisited node is selected', function() {
            const node1 = new iD.osmNode({id: 'n1', loc: [0, 0]});
            const node2 = new iD.osmNode({id: 'n2', loc: [1, 1]});
            const node3 = new iD.osmNode({id: 'n3', loc: [2, 0]});
            const node4 = new iD.osmNode({id: 'n4', loc: [1, -1]});
            const node5 = new iD.osmNode({id: 'n5', loc: [0, -2]});

            const selfIntersectingWay = new iD.osmWay({id: 'w1', nodes: ['n1', 'n2', 'n3', 'n4', 'n2', 'n5']});

            context.perform(
                iD.actionAddEntity(node1),
                iD.actionAddEntity(node2),
                iD.actionAddEntity(node3),
                iD.actionAddEntity(node4),
                iD.actionAddEntity(node5),
                iD.actionAddEntity(selfIntersectingWay)
            );

            context.enter(iD.modeSelect(context, ['w1']));

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true }));

            expect(context.selectedIDs()).toEqual(['n1', 'n2', 'n3', 'n4', 'n5']);
        });

        it('does not affect selection when a node is selected', function() {
            const node1 = new iD.osmNode({id: 'n1', loc: [0, 0]});
            const node2 = new iD.osmNode({id: 'n2', loc: [1, 1]});
            const way = new iD.osmWay({id: 'w1', nodes: ['n1', 'n2']});

            context.perform(
                iD.actionAddEntity(node1),
                iD.actionAddEntity(node2),
                iD.actionAddEntity(way)
            );

            context.enter(iD.modeSelect(context, ['n1']));

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true }));

            expect(context.selectedIDs()).toEqual(['n1']);
        });

        it('does not affect selection when a vertex is selected', function() {
            const node1 = new iD.osmNode({id: 'n1', loc: [0, 0]});
            const node2 = new iD.osmNode({id: 'n2', loc: [1, 1]});
            const node3 = new iD.osmNode({id: 'n3', loc: [2, 2]});
            const way = new iD.osmWay({id: 'w1', nodes: ['n1', 'n2', 'n3']});

            context.perform(
                iD.actionAddEntity(node1),
                iD.actionAddEntity(node2),
                iD.actionAddEntity(node3),
                iD.actionAddEntity(way)
            );

            context.enter(iD.modeSelect(context, ['n2']));

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true }));

            expect(context.selectedIDs()).toEqual(['n2']);
        });

        it('does not affect selection when a relation is selected', function() {
            const node1 = new iD.osmNode({id: 'n1', loc: [0, 0]});
            const node2 = new iD.osmNode({id: 'n2', loc: [1, 1]});
            const way = new iD.osmWay({id: 'w1', nodes: ['n1', 'n2']});
            const relation = new iD.osmRelation({id: 'r1', members: [{id: 'w1', type: 'way', role: ''}]});

            context.perform(
                iD.actionAddEntity(node1),
                iD.actionAddEntity(node2),
                iD.actionAddEntity(way),
                iD.actionAddEntity(relation)
            );

            context.enter(iD.modeSelect(context, ['r1']));

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true }));

            expect(context.selectedIDs()).toEqual(['r1']);
        });

        it('selects shared child node when two connected ways are selected', function() {
            const node1 = new iD.osmNode({id: 'n1', loc: [0, 0]});
            const node2 = new iD.osmNode({id: 'n2', loc: [1, 1]});
            const node3 = new iD.osmNode({id: 'n3', loc: [2, 2]});
            const node4 = new iD.osmNode({id: 'n4', loc: [3, 3]});

            const way1 = new iD.osmWay({id: 'w1', nodes: ['n1', 'n2', 'n3']});
            const way2 = new iD.osmWay({id: 'w2', nodes: ['n3', 'n4']});

            context.perform(
                iD.actionAddEntity(node1),
                iD.actionAddEntity(node2),
                iD.actionAddEntity(node3),
                iD.actionAddEntity(node4),
                iD.actionAddEntity(way1),
                iD.actionAddEntity(way2)
            );

            context.enter(iD.modeSelect(context, ['w1', 'w2']));

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true }));

            expect(context.selectedIDs()).toEqual(['n3']);
        });

        it('does not affect selection when two independent ways are selected', function() {
            const node1 = new iD.osmNode({id: 'n1', loc: [0, 0]});
            const node2 = new iD.osmNode({id: 'n2', loc: [1, 1]});
            const node3 = new iD.osmNode({id: 'n3', loc: [3, 3]});
            const node4 = new iD.osmNode({id: 'n4', loc: [4, 4]});

            const way1 = new iD.osmWay({id: 'w1', nodes: ['n1', 'n2']});
            const way2 = new iD.osmWay({id: 'w2', nodes: ['n3', 'n4']});

            context.perform(
                iD.actionAddEntity(node1),
                iD.actionAddEntity(node2),
                iD.actionAddEntity(node3),
                iD.actionAddEntity(node4),
                iD.actionAddEntity(way1),
                iD.actionAddEntity(way2)
            );

            context.enter(iD.modeSelect(context, ['w1', 'w2']));

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true }));

            expect(context.selectedIDs()).toEqual(['w1', 'w2']);
        });
    });
});
