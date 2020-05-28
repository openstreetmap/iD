export function actionFollow(selectedIDs, projection) {

  var action = function(graph, t) {
    
      var entities = selectedIDs.map(function(selectedID) {
          return graph.entity(selectedID);
      });

      var targetWay = entities[0];
      var sourceWay = entities[1];
      var startNode = entities[2];
      var endNode   = entities[3];
      
      var targetNodes = targetWay.nodes.slice();
      var sourceNodes = sourceWay.nodes.slice();

      var startNodeIndexInTarget      = targetNodes.indexOf(startNode.id);
      var endNodeIndexInTarget        = targetNodes.indexOf(endNode.id);
      var targetNodesOrderIsAscending = endNodeIndexInTarget > startNodeIndexInTarget;

      var startNodeIndexInSource      = sourceNodes.indexOf(startNode.id);
      var endNodeIndexInSource        = sourceNodes.indexOf(endNode.id);
      var sourceNodesOrderIsAscending = endNodeIndexInSource > startNodeIndexInSource;

      var newTargetNodes = targetNodes;

      if (targetNodesOrderIsAscending && sourceNodesOrderIsAscending) {
          var insertIndex = endNodeIndexInTarget;
          for (var sourceNodeIndex = startNodeIndexInSource + 1; sourceNodeIndex < endNodeIndexInSource; sourceNodeIndex++) {
              newTargetNodes.splice(insertIndex, 0, sourceNodes[sourceNodeIndex]);
              insertIndex++;
          }
      }
      else if (!targetNodesOrderIsAscending && !sourceNodesOrderIsAscending) {
          var insertIndex = startNodeIndexInTarget;
          for (var sourceNodeIndex = endNodeIndexInSource + 1; sourceNodeIndex < startNodeIndexInSource; sourceNodeIndex++) {
              newTargetNodes.splice(insertIndex, 0, sourceNodes[sourceNodeIndex]);
              insertIndex++;
          }
      }
      else if (targetNodesOrderIsAscending && !sourceNodesOrderIsAscending) {
          var insertIndex = endNodeIndexInTarget;
          for (var sourceNodeIndex = endNodeIndexInSource + 1; sourceNodeIndex < startNodeIndexInSource; sourceNodeIndex++) {
              newTargetNodes.splice(insertIndex, 0, sourceNodes[sourceNodeIndex]);
          }
      }
      else if (!targetNodesOrderIsAscending && sourceNodesOrderIsAscending) {
          var insertIndex = startNodeIndexInTarget;
          for (var sourceNodeIndex = startNodeIndexInSource + 1; sourceNodeIndex < endNodeIndexInSource; sourceNodeIndex++) {
              newTargetNodes.splice(insertIndex, 0, sourceNodes[sourceNodeIndex]);
          }
      }

      targetWay = targetWay.update({nodes: newTargetNodes});
      graph     = graph.replace(targetWay);

      return graph;
  };

  action.disabled = function(graph) {
     
      var entities = selectedIDs.map(function(selectedID) {
          return graph.entity(selectedID);
      });

      var targetWay = entities[0];
      var sourceWay = entities[1];
      var startNode = entities[2];
      var endNode   = entities[3];
      
      var targetNodes = targetWay.nodes.slice();
      var sourceNodes = sourceWay.nodes.slice();

      var startNodeIndexInTarget = targetNodes.indexOf(startNode.id);
      var endNodeIndexInTarget   = targetNodes.indexOf(endNode.id);
      var startNodeIndexInSource = sourceNodes.indexOf(startNode.id);
      var endNodeIndexInSource   = sourceNodes.indexOf(endNode.id);

      // make sure the nodes are shared by source and target ways, and that are consecutive in target way
      if (startNodeIndexInTarget === -1 || endNodeIndexInTarget === -1 || startNodeIndexInSource === -1 || endNodeIndexInSource === -1) {
          return 'nodes_are_not_shared_by_both_ways';
      }
      if (Math.abs(startNodeIndexInTarget - endNodeIndexInTarget) !== 1) {
          return 'nodes_are_not_consecutive_in_target';
      }
      return false;

  };

  action.transitionable = true;


  return action;
}