// @ts-expect-error -- FIXME:
import type { Discarded } from '@openstreetmap/id-tagging-schema/dist';
import type { coreDifference } from '../core/difference';
import type { Action } from '../core/history';
import type { OsmEntity } from '../osm/abstract-entity';

export function actionDiscardTags(difference: coreDifference, discardTags: Discarded): Action {
  discardTags = discardTags || {};

  return (graph) => {
    difference.modified().forEach(checkTags);
    difference.created().forEach(checkTags);
    return graph;

    function checkTags(entity: OsmEntity) {
      const keys = Object.keys(entity.tags);
      let didDiscard = false;
      let tags: Tags = {};

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
