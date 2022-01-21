import {
    actionFollow
} from './follow';

const arrayToObject = (array) =>
    array.reduce((obj, item) => {
        obj[item.id] = item;
        return obj;
    }, {});

export function test() {

    const entities = [
        iD.osmNode({
            id: 'a',
            loc: [0, 0]
        }),
        iD.osmNode({
            id: 'b',
            loc: [0, 1]
        }),
        iD.osmNode({
            id: 'c',
            loc: [0, 2]
        }),
        iD.osmNode({
            id: 'd',
            loc: [0, 3]
        }),
        iD.osmNode({
            id: 'e',
            loc: [1, 0]
        }),
        iD.osmNode({
            id: 'f',
            loc: [1, 1]
        }),
        iD.osmNode({
            id: 'g',
            loc: [1, 2]
        }),
        iD.osmNode({
            id: 'h',
            loc: [1, 3]
        }),
        iD.osmNode({
            id: 'i',
            loc: [2, 0]
        }),
        iD.osmNode({
            id: 'j',
            loc: [2, 1]
        }),
        iD.osmNode({
            id: 'k',
            loc: [2, 2]
        }),
        iD.osmNode({
            id: 'l',
            loc: [2, 3]
        }),
        iD.osmNode({
            id: 'm',
            loc: [3, 0]
        }),
        iD.osmNode({
            id: 'n',
            loc: [3, 1]
        }),
        iD.osmNode({
            id: 'o',
            loc: [3, 2]
        }),
        iD.osmNode({
            id: 'p',
            loc: [3, 3]
        }),
        // we need tags on ways to activate connections (ways with no tags will not trigger isShared on their connected nodes):
        iD.osmWay({
            id: 'w1',
            nodes: ['a', 'b', 'c', 'd', ],
            tags: {
                foo: 'bar'
            }
        }),
        iD.osmWay({
            id: 'w2',
            nodes: ['b', 'p', 'f', 'j', 'k', 'g', 'c'],
            tags: {
                foo: 'bar'
            }
        }),
        iD.osmWay({
            id: 'w3',
            nodes: ['e', 'f', 'g'],
            tags: {
                foo: 'bar'
            }
        }),
        iD.osmWay({
            id: 'w4',
            nodes: ['c', 'e', 'f', 'g'],
            tags: {
                foo: 'bar'
            }
        }),
        iD.osmWay({ // closed
            id: 'w5',
            nodes: ['a', 'b', 'c', 'd', 'h', 'g', 'f', 'e', 'a'],
            tags: {
                foo: 'bar'
            }
        }),
        iD.osmWay({
            id: 'w6',
            nodes: ['e', 'b', 'f', 'j', 'k', 'g', 'c', 'h'],
            tags: {
                foo: 'bar'
            }
        }),
        iD.osmWay({
            id: 'w7',
            nodes: ['b', 'c'],
            tags: {
                foo: 'bar'
            }
        }),
        iD.osmWay({ // closed
            id: 'w8',
            nodes: ['b', 'c', 'b'],
            tags: {
                foo: 'bar'
            }
        }),
        iD.osmWay({ // closed
            id: 'w9',
            nodes: ['a', 'c', 'f', 'a'],
            tags: {
                foo: 'bar'
            }
        }),
        iD.osmWay({ // closed
            id: 'w10',
            nodes: ['c', 'g', 'h', 'l', 'o', 'n', 'j', 'f', 'b', 'c'],
            tags: {
                foo: 'bar'
            }
        })
    ];
    graph = iD.coreGraph(entities);

    var resultUnconnectedWays = actionFollow(['w1', 'w3'], null, false, graph).disabled(graph);
    if (resultUnconnectedWays === 'nodes_are_not_shared_by_both_ways') {
        console.log('OK resultUnconnectedWays');
    } else {
        console.error('Error test resultUnconnectedWays');
    }
    var resultConnectedOnceWays = actionFollow(['w1', 'w4'], null, false, graph).disabled(graph);
    if (resultConnectedOnceWays === 'nodes_are_not_shared_by_both_ways') {
        console.log('OK resultConnectedOnceWays');
    } else {
        console.error('Error test resultConnectedOnceWays');
    }

    // test follow w1,w2
    graph = actionFollow(['w1', 'w2'], null, false, graph)(graph);
    if (JSON.stringify(graph.entity('w1').nodes) === JSON.stringify(['a', 'b', 'p', 'f', 'j', 'k', 'g', 'c', 'd'])) {
        console.log('OK test follow w1,w2');
    } else {
        console.error('Error test follow w1,w2');
    }
    // reset entities:
    graph = iD.coreGraph(entities);

    // test follow w7,w2
    graph = actionFollow(['w7', 'w2'], null, false, graph)(graph);
    if (JSON.stringify(graph.entity('w7').nodes) === JSON.stringify(['b', 'p', 'f', 'j', 'k', 'g', 'c'])) {
        console.log('OK test follow w7,w2');
    } else {
        console.error('Error test follow w7,w2');
    }
    // reset entities:
    graph = iD.coreGraph(entities);

    // test follow w2,w1
    graph = actionFollow(['w2', 'w1'], null, false, graph)(graph);
    if (JSON.stringify(graph.entity('w2').nodes) === JSON.stringify(['b', 'c'])) {
        console.log('OK test follow w2,w1');
    } else {
        console.error('Error test follow w2,w1');
    }
    // reset entities:
    graph = iD.coreGraph(entities);

    // test follow w7,w2
    graph = actionFollow(['w2', 'w7'], null, false, graph)(graph);
    console.log('graph', JSON.parse(JSON.stringify(graph)));
    if (JSON.stringify(graph.entity('w2').nodes) === JSON.stringify(['b', 'c']) && !graph.hasEntity('p') && graph.hasEntity('f') && graph.hasEntity('j') && graph.hasEntity('k') && graph.hasEntity('g')) {
        console.log('OK test follow w2,w7');
    } else {
        console.error('Error test follow w2,w7', graph.entity('w2').nodes);
    }
    // reset entities:
    graph = iD.coreGraph(entities);

    // test nodesBetween 1
    if (JSON.stringify(['a', 'b', 'c', 'd']) === JSON.stringify(graph.entity('w1').getNodesBetween(0, 3))) {
        console.log('OK nodesBetween 1');
    } else {
        console.error('Error nodesBetween 1', graph.entity('w1').getNodesBetween(0, 3));
    }
    // test nodesBetween 2
    if (JSON.stringify(['d', 'c', 'b', 'a']) === JSON.stringify(graph.entity('w1').getNodesBetween(3, 0))) {
        console.log('OK nodesBetween 2');
    } else {
        console.error('Error nodesBetween 2', graph.entity('w1').getNodesBetween(3, 0));
    }
    // test nodesBetween 3
    if (JSON.stringify(['f', 'j', 'k', 'g']) === JSON.stringify(graph.entity('w6').getNodesBetween(2, 5))) {
        console.log('OK nodesBetween 3');
    } else {
        console.error('Error nodesBetween 3', graph.entity('w6').getNodesBetween(2, 5));
    }
    // test nodesBetween 1 closed
    if (JSON.stringify(['c', 'f']) === JSON.stringify(graph.entity('w9').getNodesBetween(1, 2))) {
        console.log('OK nodesBetween 1 closed');
    } else {
        console.error('Error nodesBetween 1 closed', graph.entity('w9').getNodesBetween(1, 2));
    }
    // test nodesBetween 2 closed
    if (JSON.stringify(['a', 'c', 'f']) === JSON.stringify(graph.entity('w9').getNodesBetween(0, 2))) {
        console.log('OK nodesBetween 2 closed');
    } else {
        console.error('Error nodesBetween 2 closed', graph.entity('w9').getNodesBetween(0, 2));
    }
    // test nodesBetween 3 closed
    if (JSON.stringify(['f', 'a']) === JSON.stringify(graph.entity('w9').getNodesBetween(2, 0))) {
        console.log('OK nodesBetween 3 closed');
    } else {
        console.error('Error nodesBetween 3 closed', graph.entity('w9').getNodesBetween(2, 0));
    }
    // test nodesBetween 4 closed
    if (JSON.stringify(['f', 'a', 'c']) === JSON.stringify(graph.entity('w9').getNodesBetween(2, 1))) {
        console.log('OK nodesBetween 4 closed');
    } else {
        console.error('Error nodesBetween 4 closed', graph.entity('w9').getNodesBetween(2, 1));
    }
    // test nodesBetween 5 closed
    if (JSON.stringify(['h','l','o','n','j','f']) === JSON.stringify(graph.entity('w10').getNodesBetween(2, 7))) {
        console.log('OK nodesBetween 5 closed');
    } else {
        console.error('Error nodesBetween 5 closed', graph.entity('w9').getNodesBetween(2, 7));
    }
    // test nodesBetween 6 closed
    if (JSON.stringify(['h','l','o','n','j','f']) === JSON.stringify(graph.entity('w10').getNodesBetween(2, 7))) {
        console.log('OK nodesBetween 6 closed');
    } else {
        console.error('Error nodesBetween 6 closed', graph.entity('w9').getNodesBetween(2, 7));
    }
}
