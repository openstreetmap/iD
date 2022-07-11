/**
 * Clones the requested tags from the first selected entity to all the other selected enteties.
 * @param selectedIds array containing the ids of the selected entites
 * @param cloneTags array containing the tags to be cloned
 * @returns action
 */
export function actionCloneTags(selectedIds, cloneTags=[]) {

    var action = function (graph) {

        const entities = selectedIds.map(function (selectedID) {
            return graph.entity(selectedID);
        });

        const cloneFromEntityTags = entities[0].tags;

        for (let i = 1; i < entities.length; i++) {
          let entity = entities[i];
          const tags = Object.assign({}, entity.tags);
          for (let j = 0; j < cloneTags.length; j++) {
              const cloneTag = cloneTags[j];
              if (cloneFromEntityTags[cloneTag] !== undefined) {
                tags[cloneTag] = cloneFromEntityTags[cloneTag];
              }
          }
          entity = entity.update({tags});
          graph = graph.replace(entity);
        }

        return graph;
    };

    action.disabled = function () {

        return false;

    };

    action.transitionable = true;

    return action;
}
