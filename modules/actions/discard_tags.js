export function actionDiscardTags(difference, discardTags) {
  discardTags = discardTags || {};

  return (graph) => {
    difference.modified().forEach(checkTags);
    difference.created().forEach(checkTags);
    return graph;

    function checkTags(entity) {
      const keys = Object.keys(entity.tags);
      let didDiscard = false;
      let tags = {};

      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const v = entity.tags[k];
        if (discardTags[k] === true || (typeof discardTags[k] === 'object' && discardTags[k][v]) || !entity.tags[k]) {
          didDiscard = true;
        } else {
          tags[k] = entity.tags[k];
        }
      }
      if (didDiscard) {
        graph = graph.replace(entity.update({ tags: tags }));
      }
    }

  };
}
