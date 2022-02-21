export function actionCloneRoadAttributes(selectedIds, cloneTags = []) {

    var action = function (graph) {

        //console.log('graph before', graph.entities);

        const entities = selectedIds.map(function (selectedID) {
            return graph.entity(selectedID);
        });

        const cloneRoadAttributesFromEntityTags = entities[0].tags;
        cloneTags = cloneTags.length === 0 ? [
            'bus:lanes', 'lanes:bus', 'busway:right', 'busway:left',
            'lanes', 'lanes:forward', 'lanes:backward',
            'sidewalk', 'sidewalk:right', 'sidewalk:left', 'foot',
            'routing:bicycle', 'bicycle', 'cycleway:both', 'cycleway:right', 'cycleway:left',
            'turn:lanes', 'turn:lanes:forward', 'turn:lanes:backward',
            'placement', 'width:lanes:start', 'width:lanes:end'
        ] : cloneTags;
       
        for (let i = 1; i < entities.length; i++) {
          let entity = entities[i];
          const tags = Object.assign({}, entity.tags);
          for (let j = 0, countJ = cloneTags.length; j < countJ; j++) {
              const cloneTag = cloneTags[j];
              if (cloneRoadAttributesFromEntityTags[cloneTag] !== undefined) {
                tags[cloneTag] = cloneRoadAttributesFromEntityTags[cloneTag];
              }
          }
          entity = entity.update({tags});
          graph = graph.replace(entity);
        }

        return graph;
    };

    action.disabled = function (graph) {

        return false;

    };

    action.transitionable = true;

    return action;
}
