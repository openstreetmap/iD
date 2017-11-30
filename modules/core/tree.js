import _map from 'lodash-es/map';
import rbush from 'rbush';

import { coreDifference } from './difference';


export function coreTree(head) {
    var rtree = rbush(),
        bboxes = {},
        tree = {};


    function entityBBox(entity) {
        var bbox = entity.extent(head).bbox();
        bbox.id = entity.id;
        bboxes[entity.id] = bbox;
        return bbox;
    }


    function updateParents(entity, insertions, memo) {
        head.parentWays(entity).forEach(function(way) {
            if (bboxes[way.id]) {
                rtree.remove(bboxes[way.id]);
                insertions[way.id] = way;
            }
            updateParents(way, insertions, memo);
        });

        head.parentRelations(entity).forEach(function(relation) {
            if (memo[entity.id]) return;
            memo[entity.id] = true;
            if (bboxes[relation.id]) {
                rtree.remove(bboxes[relation.id]);
                insertions[relation.id] = relation;
            }
            updateParents(relation, insertions, memo);
        });
    }


    tree.rebase = function(entities, force) {
        var insertions = {};

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];

            if (!entity.visible)
                continue;

            if (head.entities.hasOwnProperty(entity.id) || bboxes[entity.id]) {
                if (!force) {
                    continue;
                } else if (bboxes[entity.id]) {
                    rtree.remove(bboxes[entity.id]);
                }
            }

            insertions[entity.id] = entity;
            updateParents(entity, insertions, {});
        }

        rtree.load(_map(insertions, entityBBox));

        return tree;
    };


    tree.intersects = function(extent, graph) {
        if (graph !== head) {
            var diff = coreDifference(head, graph),
                insertions = {};

            head = graph;

            diff.deleted().forEach(function(entity) {
                rtree.remove(bboxes[entity.id]);
                delete bboxes[entity.id];
            });

            diff.modified().forEach(function(entity) {
                rtree.remove(bboxes[entity.id]);
                insertions[entity.id] = entity;
                updateParents(entity, insertions, {});
            });

            diff.created().forEach(function(entity) {
                insertions[entity.id] = entity;
            });

            rtree.load(_map(insertions, entityBBox));
        }

        return rtree.search(extent.bbox()).map(function(bbox) {
            return head.entity(bbox.id);
        });
    };


    return tree;
}
