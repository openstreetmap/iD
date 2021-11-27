import { actionFollow } from './follow';

const arrayToObject = (array) =>
    array.reduce((obj, item) => {
        obj[item.id] = item;
        return obj;
    }, {}
);

export function test() {

  const entities = [
      iD.osmNode({id: 'a', loc: [0, 0]}),
      iD.osmNode({id: 'b', loc: [0, 1]}),
      iD.osmNode({id: 'c', loc: [0, 2]}),
      iD.osmNode({id: 'd', loc: [0, 3]}),
      iD.osmNode({id: 'e', loc: [1, 0]}),
      iD.osmNode({id: 'f', loc: [1, 1]}),
      iD.osmNode({id: 'g', loc: [1, 2]}),
      iD.osmNode({id: 'h', loc: [1, 3]}),
      iD.osmNode({id: 'i', loc: [2, 0]}),
      iD.osmNode({id: 'j', loc: [2, 1]}),
      iD.osmNode({id: 'k', loc: [2, 2]}),
      iD.osmNode({id: 'l', loc: [2, 3]}),
      iD.osmNode({id: 'm', loc: [3, 0]}),
      iD.osmNode({id: 'n', loc: [3, 1]}),
      iD.osmNode({id: 'o', loc: [3, 2]}),
      iD.osmNode({id: 'p', loc: [3, 3]}),
      // we need tags on ways to activate connections (ways with no tags will not trigger isCOnnected on their connected nodes):
      iD.osmWay({id: 'w1', nodes: ['a', 'b', 'c', 'd',], tags: {foo: 'bar'}}),
      iD.osmWay({id: 'w2', nodes: ['b', 'f', 'j', 'k', 'g', 'c'], tags: {foo: 'bar'}}),
      iD.osmWay({id: 'w3', nodes: ['e', 'f', 'g'], tags: {foo: 'bar'}}),
      iD.osmWay({id: 'w4', nodes: ['c', 'e', 'f', 'g'], tags: {foo: 'bar'}}),
      iD.osmWay({id: 'w5', nodes: ['e', 'b', 'f', 'j', 'k', 'g', 'c'], tags: {foo: 'bar'}}),
      iD.osmWay({id: 'w6', nodes: ['e', 'b', 'f', 'j', 'k', 'g', 'c', 'h'], tags: {foo: 'bar'}}),
      iD.osmWay({id: 'w7', nodes: ['b', 'c'], tags: {foo: 'bar'}})
  ];
  graph = iD.coreGraph(entities);
  console.log('isConnected k', graph.entity('k').isConnected(graph));
  console.log('isConnected p', graph.entity('p').isConnected(graph));
  /*for (let i = 0; i < entities.length; i++) {
      graph.load(entities[i]);
  }*/
  var resultUnconnectedWays = actionFollow(['w1','w3'], null, false, graph).disabled(graph);
  if (resultUnconnectedWays === 'nodes_are_not_shared_by_both_ways') {
      console.log('OK resultUnconnectedWays');
  } else {
      console.error('Error test resultUnconnectedWays');
  }
  var resultConnectedOnceWays = actionFollow(['w1','w4'], null, false, graph).disabled(graph);
  if (resultConnectedOnceWays === 'nodes_are_not_shared_by_both_ways') {
      console.log('OK resultConnectedOnceWays');
  } else {
      console.error('Error test resultConnectedOnceWays');
  }

  // test follow w1,w2
  graph = actionFollow(['w1','w2'], null, false, graph)(graph);
  if (JSON.stringify(graph.entity('w1').nodes) === JSON.stringify(['a', 'b', 'f', 'j', 'k', 'g', 'c', 'd'])) {
      console.log('OK test follow w1,w2');
  } else {
      console.error('Error test follow w1,w2');
  }
  // reset entities:
  graph = iD.coreGraph(entities);

  // test follow w7,w2
  graph = actionFollow(['w7','w2'], null, false, graph)(graph);
  if (JSON.stringify(graph.entity('w7').nodes) === JSON.stringify(['b', 'f', 'j', 'k', 'g', 'c'])) {
      console.log('OK test follow w7,w2');
  } else {
      console.error('Error test follow w7,w2');
  }
  // reset entities:
  graph = iD.coreGraph(entities);

  // test follow w7,w2
  graph = actionFollow(['w2','w1'], null, false, graph)(graph);
  if (JSON.stringify(graph.entity('w2').nodes) === JSON.stringify(['b', 'c'])) {
      console.log('OK test follow w2,w1');
  } else {
      console.error('Error test follow w2,w1');
  }
  // reset entities:
  graph = iD.coreGraph(entities);

  // test follow w7,w2
  graph = actionFollow(['w2','w7'], null, false, graph)(graph);
  if (JSON.stringify(graph.entity('w2').nodes) === JSON.stringify(['b', 'c']) && !graph.entity('f') && !graph.entity('g') && !graph.entity('j') && !graph.entity('k')) {
      console.log('OK test follow w2,w7');
  } else {
      console.error('Error test follow w2,w7');
  }
  // reset entities:
  graph = iD.coreGraph(entities);

}