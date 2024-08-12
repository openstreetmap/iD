// @ts-check
/** @import * as Osm from 'osm-api' */
import { osmNode, osmRelation, osmWay } from '../osm';
import { actionAddEntity } from './add_entity';
import { actionChangeTags } from './change_tags';
import { actionDeleteNode } from './delete_node';
import { actionDeleteRelation } from './delete_relation';
import { actionDeleteWay } from './delete_way';
import { actionMoveNode } from './move_node';
import { actionReplaceRelationMembers } from './replace_relation_members';
import { actionReplaceWayNodes } from './replace_way_nodes';

/**
 * A map of the IDs from the osmPatch file to the IDs in our graph.
 * @typedef {Record<Osm.OsmFeatureType, Record<number, string>>} IDMap
 */

/**
 * @param {Osm.OsmFeatureType} type
 * @param {number} id
 * @param {IDMap} idMap
 */
const getId = (type, id, idMap) => {
  const mappedId = id > 0 ? type[0] + id : idMap[type][id];
  if (mappedId === undefined) {
    throw new Error(`No entry in idMap for ${type} ${id}`);
  }
  return mappedId;
};

/**
 * @param {Osm.OsmChange} osmChange
 * @param {boolean} allowConflicts
 */
export function actionImportOsmChange(osmChange, allowConflicts) {
  /** @param {iD.Graph} graph */
  return (graph) => {
    /** @type {IDMap} */
    const idMap = { node: {}, way: {}, relation: {} };

    // check that the versions from the osmChange file match the
    // versions in our graph. If not, there are conflicts.
    if (!allowConflicts) {
      for (const feature of [...osmChange.modify, ...osmChange.delete]) {
        const entityId = getId(feature.type, feature.id, idMap);
        const entity = graph.entity(entityId);
        if (+entity.version !== feature.version) {
          throw new Error(
            `Conflicts on ${entityId}, expected v${feature.version}, got v${entity.version}`
          );
        }
      }
    }

    // create placeholders in the graph for all new features, so
    // that all new features are allocated an ID.
    for (const feature of osmChange.create) {
      switch (feature.type) {
        case 'node': {
          const entity = osmNode({
            tags: feature.tags,
            loc: [feature.lon, feature.lat],
          });
          idMap[feature.type][feature.id] = entity.id;
          graph = actionAddEntity(entity)(graph);
          break;
        }

        case 'way': {
          const entity = osmWay({
            tags: feature.tags,
            // `nodes` are added later, once an ID has
            // been allocated to all new features
            nodes: [],
          });
          idMap[feature.type][feature.id] = entity.id;
          graph = actionAddEntity(entity)(graph);
          break;
        }

        case 'relation': {
          const entity = osmRelation({
            tags: feature.tags,
            // `members` are added later, once an ID has
            // been allocated to all new features
            members: [],
          });
          idMap[feature.type][feature.id] = entity.id;
          graph = actionAddEntity(entity)(graph);
          break;
        }

        default:
          // eslint-disable-next-line no-unused-expressions -- exhaustivity check
          /** @satisfies {never} */ (feature);
      }
    }

    // loop through the `create` features again, to set the loc/nodes/members
    // we can also handle the `modify` features at the same time.
    for (const feature of [...osmChange.create, ...osmChange.modify]) {
      const entityId = getId(feature.type, feature.id, idMap);

      // firstly, change tags
      graph = actionChangeTags(entityId, feature.tags)(graph);

      // secondly, change loc/nodes/members
      switch (feature.type) {
        case 'node':
          graph = actionMoveNode(entityId, [feature.lon, feature.lat])(graph);
          break;

        case 'way': {
          const newNodes = feature.nodes.map((id) => getId('node', id, idMap));
          graph = actionReplaceWayNodes(entityId, newNodes)(graph);
          break;
        }

        case 'relation': {
          const newMembers = feature.members.map((member) => ({
            id: getId(member.type, member.ref, idMap),
            role: member.role,
            type: member.type,
          }));
          graph = actionReplaceRelationMembers(entityId, newMembers)(graph);
          break;
        }

        default:
          // eslint-disable-next-line no-unused-expressions -- exhaustivity check
          /** @satisfies {never} */ (feature);
      }
    }

    // delete
    for (const feature of osmChange.delete) {
      const entityId = getId(feature.type, feature.id, idMap);
      switch (feature.type) {
        case 'node':
          graph = actionDeleteNode(entityId)(graph);
          break;

        case 'way':
          graph = actionDeleteWay(entityId)(graph);
          break;

        case 'relation':
          graph = actionDeleteRelation(entityId)(graph);
          break;

        default:
          // eslint-disable-next-line no-unused-expressions -- exhaustivity check
          /** @satisfies {never} */ (feature);
      }
    }

    return graph;
  };
}
