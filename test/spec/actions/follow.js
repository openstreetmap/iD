describe('iD.follow', function () {
  var projection = d3.geoMercator().scale(150);

  it('should not follow if ways are not connected at two nodes', function () {
      //    d ---- c
      //    |      |
      //    a ---- b
      //
      //           e
      //           |
      //    g ---- f
      var graph = iD.coreGraph([
              iD.osmNode({id: 'a', loc: [0, 0]}),
              iD.osmNode({id: 'b', loc: [2, 0]}),
              iD.osmNode({id: 'c', loc: [2, 2]}),
              iD.osmNode({id: 'd', loc: [0, 2]}),
              iD.osmWay({id: 'x', nodes: ['a', 'b', 'c', 'd', 'a']}),
              iD.osmNode({id: 'e', loc: [0, 0]}),
              iD.osmNode({id: 'f', loc: [3, 0]}),
              iD.osmNode({id: 'g', loc: [3, 3]}),
              iD.osmWay({id: 'y', nodes: ['e','f','g']}),
              iD.osmWay({id: 'z', nodes: ['c','e','f','g']})
      ]);
      var resultUnconnectedWays = iD.actionFollow(['x','y'], projection, false).disabled(graph);
      expect(resultUnconnectedWays).to.eql('nodes_are_not_shared_by_both_ways');
      var resultConnectedOnceWays = iD.actionFollow(['x','z'], projection, false).disabled(graph);
      expect(resultConnectedOnceWays).to.eql('nodes_are_not_shared_by_both_ways');

  });

});
