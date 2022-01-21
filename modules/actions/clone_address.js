export function actionCloneAddress(selectedIds) {

    var action = function (graph) {

        //console.log('graph before', graph.entities);

        const entities = selectedIds.map(function (selectedID) {
            return graph.entity(selectedID);
        });

        const cloneAddressFromEntity = entities[0];
        const addressHouseNumber = cloneAddressFromEntity.tags['addr:housenumber'];
        const addressStreet = cloneAddressFromEntity.tags['addr:street'];
        const addressCity = cloneAddressFromEntity.tags['addr:city'];
        const addressProvince = cloneAddressFromEntity.tags['addr:province'];

        for (let i = 1; i < entities.length; i++) {
          let entity = entities[i];
          const tags = Object.assign({}, entity.tags);
          if (addressHouseNumber) {
            tags['addr:housenumber'] = addressHouseNumber
          };
          if (addressStreet) {
            tags['addr:street'] = addressStreet;
          }
          if (addressCity) {
            tags['addr:city'] = addressCity;
          }
          if (addressProvince) {
            tags['addr:province'] = addressProvince;
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
