import RBush from 'rbush';

import { coreDifference } from './difference';


export function coreTree(head) {
    // tree for entities
    var _rtree = new RBush();
    var _bboxes = {};

    // maintain a separate tree for granular way segments
    var _segmentsRTree = new RBush();
    var _segmentsBBoxes = {};
    var _segmentsByWayId = {};

    var tree = {};


    function entityBBox(entity) {
        var bbox = entity.extent(head).bbox();
        bbox.id = entity.id;
        _bboxes[entity.id] = bbox;
        return bbox;
    }


    function segmentBBox(segment) {
        var extent = segment.extent(head);
        // extent can be null if the node entities aren't in the graph for some reason
        if (!extent) return null;

        var bbox = extent.bbox();
        bbox.segment = segment;
        _segmentsBBoxes[segment.id] = bbox;
        return bbox;
    }


    function removeEntity(entity) {
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


    function loadEntities(entities) {
        _rtree.load(entities.map(entityBBox));

        var segments = [];
        entities.forEach(function(entity) {
            if (entity.segments) {
                var entitySegments = entity.segments(head);
                // cache these to make them easy to remove later
                _segmentsByWayId[entity.id] = entitySegments;
                segments = segments.concat(entitySegments);
            }
        });
        if (segments.length) _segmentsRTree.load(segments.map(segmentBBox).filter(Boolean));
    }


    function updateParents(entity, insertions, memo) {
        head.parentWays(entity).forEach(function(way) {
            if (_bboxes[way.id]) {
                removeEntity(way);
                insertions[way.id] = way;
            }
            updateParents(way, insertions, memo);
        });

        head.parentRelations(entity).forEach(function(relation) {
            if (memo[entity.id]) return;
            memo[entity.id] = true;
            if (_bboxes[relation.id]) {
                removeEntity(relation);
                insertions[relation.id] = relation;
            }
            updateParents(relation, insertions, memo);
        });
    }


    tree.rebase = function(entities, force) {
        var insertions = {};

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
    };


    function updateToGraph(graph) {
        if (graph === head) return;

        var diff = coreDifference(head, graph);

        head = graph;

        var changed = diff.didChange;
        if (!changed.addition && !changed.deletion && !changed.geometry) return;

        var insertions = {};

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
    tree.intersects = function(extent, graph) {
        updateToGraph(graph);
        return _rtree.search(extent.bbox())
            .map(function(bbox) { return graph.entity(bbox.id); });
    };

    // returns an array of segment objects with bounding boxes overlapping `extent` for the given `graph`
    tree.waySegments = function(extent, graph) {
        updateToGraph(graph);
        return _segmentsRTree.search(extent.bbox())
            .map(function(bbox) { return bbox.segment; });
    };


    return tree;
}
