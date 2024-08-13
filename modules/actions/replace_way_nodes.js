// @ts-check

/**
 * @param {string} entityId
 * @param {string[]} newNodeIds
 */
export function actionReplaceWayNodes(entityId, newNodeIds) {
  /** @param {iD.Graph} graph */
  return (graph) => {
    let entity = graph.entity(entityId);
    entity = entity.update({ nodes: newNodeIds });
    return graph.replace(entity);
  };
}
