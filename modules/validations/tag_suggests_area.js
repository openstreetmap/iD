import _isEmpty from 'lodash-es/isEmpty';
import _clone from 'lodash-es/clone';
import { t } from '../util/locale';
import {
    utilDisplayLabel,
    utilTagText
} from '../util';
import {
    validationIssue,
    validationIssueFix
} from '../core/validator';
import {
    actionAddVertex,
    actionConnect,
    actionChangeTags
} from '../actions';
import { geoHasSelfIntersections, geoSphericalDistance } from '../geo';


// https://github.com/openstreetmap/josm/blob/mirror/src/org/
// openstreetmap/josm/data/validation/tests/UnclosedWays.java#L80
export function validationTagSuggestsArea() {

    function tagSuggestsArea(tags) {
        if (_isEmpty(tags)) return false;

        var areaKeys = ['area', 'building', 'landuse', 'shop', 'tourism'];
        for (var i = 0; i < areaKeys.length; i++) {
            var key = areaKeys[i];
            if (tags[key] !== undefined && tags[key] !== 'no') {
                if (key === 'tourism' && tags[key] === 'artwork') {
                    continue;   // exception for tourism=artwork - #5206
                } else {
                    var returnTags = {};
                    returnTags[key] = tags[key];
                    return returnTags;
                }
            }
        }

        return false;
    }

    var type = 'tag_suggests_area';

    var validation = function(entity, context) {
        var issues = [];
        var graph = context.graph();
        var geometry = entity.geometry(graph);
        var suggestingTags = (geometry === 'line' ? tagSuggestsArea(entity.tags) : undefined);

        if (suggestingTags) {
            var tagText = utilTagText({ tags: suggestingTags });
            var fixes = [];
            var nodes = graph.childNodes(entity), testNodes;

            var firstToLastDistanceMeters = geoSphericalDistance(nodes[0].loc, nodes[nodes.length-1].loc);
            var connectEndpointsOnClick;
            // if the distance is very small, attempt to merge the endpoints
            if (firstToLastDistanceMeters < 0.5) {
                testNodes = _clone(nodes);
                testNodes.pop();
                testNodes.push(testNodes[0]);
                // make sure this will not create a self-intersection
                if (!geoHasSelfIntersections(testNodes, testNodes[0].id)) {
                    connectEndpointsOnClick = function() {
                        var way = this.issue.entities[0];
                        context.perform(
                            actionConnect([way.nodes[0], way.nodes[way.nodes.length-1]]),
                            t('issues.fix.connect_endpoints.undo_redo')
                        );
                    };
                }
            }
            if (!connectEndpointsOnClick) {
                // if the points were not merged, attempt to close the way
                testNodes = _clone(nodes);
                testNodes.push(testNodes[0]);
                // make sure this will not create a self-intersection
                if (!geoHasSelfIntersections(testNodes, testNodes[0].id)) {
                    connectEndpointsOnClick = function() {
                        var way = this.issue.entities[0];
                        var nodeId = way.nodes[0];
                        var index = way.nodes.length;
                        context.perform(
                            actionAddVertex(way.id, nodeId, index),
                            t('issues.fix.connect_endpoints.undo_redo')
                        );
                    };
                }
            }
            if (connectEndpointsOnClick) {
                fixes.push(new validationIssueFix({
                    title: t('issues.fix.connect_endpoints.title'),
                    onClick: connectEndpointsOnClick
                }));
            }
            fixes.push(new validationIssueFix({
                title: t('issues.fix.remove_tags.title'),
                onClick: function() {
                    var entity = this.issue.entities[0];
                    var tags = _clone(entity.tags);
                    for (var key in suggestingTags) {
                        delete tags[key];
                    }
                    context.perform(
                        actionChangeTags(entity.id, tags),
                        t('issues.fix.remove_tags.undo_redo')
                    );
                }
            }));
            var featureLabel = utilDisplayLabel(entity, context);
            issues.push(new validationIssue({
                type: type,
                severity: 'warning',
                message: t('issues.tag_suggests_area.message', { feature: featureLabel, tags: tagText }),
                tooltip: t('issues.tag_suggests_area.tip'),
                entities: [entity],
                fixes: fixes
            }));
        }

        return issues;
    };

    validation.type = type;

    return validation;
}
