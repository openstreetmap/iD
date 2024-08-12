// @ts-check

/**
 * @param {string} entityId
 * @param {{ id: string; type: string; role: string }[]} newMembers
 */
export function actionReplaceRelationMembers(entityId, newMembers) {
  /** @param {iD.Graph} graph */
  return (graph) => {
    let entity = graph.entity(entityId);
    entity = entity.update({ members: newMembers });
    return graph.replace(entity);
  };
}
