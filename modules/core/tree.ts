import RBush, { type BBox } from 'rbush';

import { coreDifference } from './difference';
import type { OsmEntity } from '../osm/abstract-entity';
import type { geoExtent } from '../geo';
import type { coreGraph } from './graph';
import type { Segment, SegmentId } from '../osm/way';
import type { EntityId } from '../osm';

interface BBoxWithId extends BBox { id: EntityId }
interface BBoxWithSegment extends BBox { segment: Segment }

export function coreTree(head: coreGraph) {
    // tree for entities
    const _rtree = new RBush<BBoxWithId>();
    const _bboxes: { [entityId: EntityId]: BBoxWithId } = {};

    // maintain a separate tree for granular way segments
    const _segmentsRTree = new RBush<BBoxWithSegment>();
    const _segmentsBBoxes: { [segmentId: SegmentId]: BBoxWithSegment } = {};
    const _segmentsByWayId: { [wayId: EntityId]: Segment[] } = {};

    function entityBBox(entity: OsmEntity) {
        const bbox = entity.extent(head).bbox() as BBoxWithId;
        bbox.id = entity.id;
        _bboxes[entity.id] = bbox;
        return bbox;
    }


    function segmentBBox(segment: Segment) {
        var extent = segment.extent(head);
        // extent can be null if the node entities aren't in the graph for some reason
        if (!extent) return null;

        const bbox = extent.bbox() as BBoxWithSegment;
        bbox.segment = segment;
        _segmentsBBoxes[segment.id] = bbox;
        return bbox;
    }


    function removeEntity(entity: OsmEntity) {
        _rtree.remove(_bboxes[entity.id]);
        delete _bboxes[entity.id];

        if (_segmentsByWayId[entity.id]) {
            _segmentsByWayId[entity.id].forEach(function(segment) {
                _segmentsRTree.remove(_segmentsBBoxes[segment.id]);
                delete _segmentsBBoxes[segment.id];
            });
            delete _segmentsByWayId[entity.id];
        }
    }


    function loadEntities(entities: OsmEntity[]) {
        _rtree.load(entities.map(entityBBox));

        let segments: Segment[] = [];
        entities.forEach(function(entity) {
            if (entity.type === 'way') {
                var entitySegments = entity.segments(head);
                // cache these to make them easy to remove later
                _segmentsByWayId[entity.id] = entitySegments;
                segments = segments.concat(entitySegments);
            }
        });
        if (segments.length) _segmentsRTree.load(segments.map(segmentBBox).filter(x => !!x));
    }


    function updateParents(
        entity: OsmEntity,
        insertions: { [entityId: EntityId]: OsmEntity },
        memo: { [entityId: EntityId]: boolean }
    ) {
        head.parentWays(entity).forEach(function(way) {
            if (_bboxes[way.id]) {
                removeEntity(way);
                insertions[way.id] = way;
            }
            updateParents(way, insertions, memo);
        });

        head.parentRelations(entity).forEach(function(relation) {
            if (memo[relation.id]) return;
            memo[relation.id] = true;
            if (_bboxes[relation.id]) {
                removeEntity(relation);
                insertions[relation.id] = relation;
            }
            updateParents(relation, insertions, memo);
        });
    }


    function rebase(entities: OsmEntity[], force?: boolean): coreTree {
        const insertions: { [entityId: EntityId]: OsmEntity } = {};

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (!entity.visible) continue;

            if (head.entities.hasOwnProperty(entity.id) || _bboxes[entity.id]) {
                if (!force) {
                    continue;
                } else if (_bboxes[entity.id]) {
                    removeEntity(entity);
                }
            }

            insertions[entity.id] = entity;
            updateParents(entity, insertions, {});
        }

        loadEntities(Object.values(insertions));

        return tree;
    }


    function updateToGraph(graph: coreGraph) {
        if (graph === head) return;

        var diff = coreDifference(head, graph);

        head = graph;

        var changed = diff.didChange;
        if (!changed.addition && !changed.deletion && !changed.geometry) return;

        var insertions: { [entityId: EntityId]: OsmEntity } = {};

        if (changed.deletion) {
            diff.deleted().forEach(function(entity) {
                removeEntity(entity);
            });
        }

        if (changed.geometry) {
            diff.modified().forEach(function(entity) {
                removeEntity(entity);
                insertions[entity.id] = entity;
                updateParents(entity, insertions, {});
            });
        }

        if (changed.addition) {
            diff.created().forEach(function(entity) {
                insertions[entity.id] = entity;
            });
        }

        loadEntities(Object.values(insertions));
    }

    // returns an array of entities with bounding boxes overlapping `extent` for the given `graph`
    function intersects(extent: geoExtent, graph: coreGraph) {
        updateToGraph(graph);
        return _rtree.search(extent.bbox())
            .map(function(bbox) { return graph.entity(bbox.id); });
    };

    // returns an array of segment objects with bounding boxes overlapping `extent` for the given `graph`
    function waySegments(extent: geoExtent, graph: coreGraph) {
        updateToGraph(graph);
        return _segmentsRTree.search(extent.bbox())
            .map(function(bbox) { return bbox.segment; });
    };

    const tree = {
        rebase,
        intersects,
        waySegments,
    };

    return tree;
}

export interface coreTree extends ReturnType<typeof coreTree> {};
