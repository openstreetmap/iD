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

/**
 * @param {Osm.Tags} originalTags
 * @param {Osm.Tags} diff
 * @returns {Osm.Tags}
 */
function applyTagDiff(originalTags, diff) {
  const newTags = { ...originalTags };
  for (const [key, value] of Object.entries(diff)) {
    if (value === '🗑️') {
      delete newTags[key];
    } else {
      newTags[key] = `${value}`;
    }
  }
  return newTags;
}

/**
 * @typedef {{ id: string; type: Osm.OsmFeatureType; role: string }} RelationMember
 *
 * @param {RelationMember[]} originalMembers
 * @param {Osm.OsmRelation['members']} diff
 * @returns {RelationMember[]}
 */
function applyMemberDiff(originalMembers, diff) {
  let newMembersList = structuredClone(originalMembers);
  for (const item of diff) {
    const firstOldIndex = newMembersList.findIndex(
      (m) => m.type === item.type && +m.id.slice(1) === item.ref
    );
    // start by removing all existing ones
    newMembersList = newMembersList.filter(
      (m) => !(m.type === item.type && +m.id.slice(1) === item.ref)
    );

    if (item.role === '🗑️') {
      // we've delete every occurrence of this feature from the relation, so nothing to do.
    } else {
      // if this feature already existed, all instances of it have already been removed.
      // so add back to the of the array
      const member = {
        id: item.type[0] + item.ref,
        type: item.type,
        role: item.role,
      };
      if (firstOldIndex === -1) {
        // this item is new, so add it to the end of the array
        newMembersList.push(member);
      } else {
        // add it back at its original position
        newMembersList.splice(firstOldIndex, 0, member);
      }
    }
  }
  return newMembersList;
}

/**
 * @param {import('geojson').Geometry} geom
 * @param {Osm.Tags} tags
 * @param {Osm.OsmRelation['members']} relationMembers
 */
function geojsonToOsmGeometry(geom, tags, relationMembers) {
  switch (geom.type) {
    case 'Point': {
      return [osmNode({ tags, loc: geom.coordinates })];
    }

    case 'MultiPoint': {
      const children = geom.coordinates.map((loc) => osmNode({ loc }));
      const site = osmRelation({
        tags: { type: 'site', ...tags },
        members: children.map((child) => ({
          type: child.type,
          id: child.id,
          role: '',
        })),
      });
      return [site, ...children];
    }

    case 'LineString': {
      const children = geom.coordinates.map((loc) => osmNode({ loc }));
      const way = osmWay({
        tags,
        nodes: children.map((child) => child.id),
      });
      return [way, ...children];
    }

    case 'MultiLineString': {
      const nodes = [];
      const ways = [];

      for (const segment of geom.coordinates) {
        const segmentNodes = segment.map((loc) => osmNode({ loc }));
        const way = osmWay({ nodes: segmentNodes.map((n) => n.id) });
        nodes.push(...segmentNodes);
        ways.push(way);
      }

      const relation = osmRelation({
        tags: { type: 'multilinestring', ...tags },
        members: ways.map((w) => ({ role: '', type: 'way', id: w.id })),
      });

      return [relation, ...ways, ...nodes];
    }

    case 'GeometryCollection': {
      return [osmRelation({ tags, members: relationMembers })];
    }

    // this logic is based on what RapiD uses:
    // https://github.com/facebookincubator/Rapid/blob/8a58b2/modules/services/esri_data.js#L103-L134
    case 'Polygon':
    case 'MultiPolygon': {
      const nodes = [];
      const ways = [];

      const groups =
        geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;

      for (const rings of groups) {
        for (const [index, ring] of rings.entries()) {
          const ringNodes = ring.map((loc) => osmNode({ loc }));
          if (ringNodes.length < 3) return [];

          const first = ringNodes[0];
          const last = ringNodes[ringNodes.length - 1];

          if (first.loc.join(',') === last.loc.join(',')) {
            // the first and last node have the same location, so
            // reuse the same node.
            ringNodes.pop();
            ringNodes.push(first);
          } else {
            // the first and last node are in a different location, so
            // add the first node, to ensure that rings are closed.
            ringNodes.push(first);
          }

          const way = osmWay({ nodes: ringNodes.map((n) => n.id) });
          nodes.push(...ringNodes);
          ways.push({ way, role: index === 0 ? 'outer' : 'inner' });
        }

        if (groups.length === 1 && rings.length === 1) {
          // special case: only 1 ring, so we don't need a multipolygon,
          // we can just create a simple way and abort early.
          let way = ways[0].way;
          way = way.update({ tags });
          return [way, ...nodes];
        }
      }

      const relation = osmRelation({
        tags: { type: 'multipolygon', ...tags },
        members: ways.map(({ way, role }) => ({
          type: 'way',
          id: way.id,
          role,
        })),
      });
      return [relation, ...ways.map((w) => w.way), ...nodes];
    }

    default: {
      // eslint-disable-next-line no-unused-expressions -- exhaustivity check
      /** @satisfies {never} */ (geom);
      return [];
    }
  }
}

/** @param {Osm.OsmPatch} osmPatch */
export function actionImportOsmPatch(osmPatch) {
  /** @param {iD.Graph} graph */
  return (graph) => {
    for (const feature of osmPatch.features) {
      const {
        __action,
        __members: memberDiff,
        ...tagDiff
      } = feature.properties;

      switch (__action) {
        case undefined: {
          // create
          const entities = geojsonToOsmGeometry(
            feature.geometry,
            tagDiff,
            memberDiff
          );
          for (const entity of entities) {
            graph = actionAddEntity(entity)(graph);
          }
          break;
        }

        case 'edit': {
          const entity = graph.entity(feature.id);

          // update tags
          graph = actionChangeTags(
            feature.id,
            applyTagDiff(entity.tags, tagDiff)
          )(graph);

          // then update members for relations
          if (entity.type === 'relation' && memberDiff) {
            const newMembers = applyMemberDiff(entity.members, memberDiff);
            graph = actionReplaceRelationMembers(entity.id, newMembers)(graph);
          }

          break;
        }

        case 'move': {
          if (feature.id[0] !== 'n' || feature.geometry.type !== 'LineString') {
            throw new Error('trying to move a non-node');
          }
          graph = actionMoveNode(
            feature.id,
            feature.geometry.coordinates[1]
          )(graph);
          break;
        }

        case 'delete': {
          switch (feature.id[0]) {
            case 'n':
              graph = actionDeleteNode(feature.id)(graph);
              break;

            case 'w':
              graph = actionDeleteWay(feature.id)(graph);
              break;

            case 'r':
              graph = actionDeleteRelation(feature.id)(graph);
              break;
          }
          break;
        }

        default: {
          // eslint-disable-next-line no-unused-expressions -- exhaustivity check
          /** @satisfies {never} */ (__action);
        }
      }
    }

    return graph;
  };
}
