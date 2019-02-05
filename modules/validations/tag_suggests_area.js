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


export function validationTagSuggestsArea() {

    var type = 'tag_suggests_area';

    var validation = function(entity, context) {

        if (entity.type !== 'way') {
            return [];
        }

        var issues = [];
        var graph = context.graph();
        var tagSuggestingArea = entity.tagSuggestingArea();
        var tagSuggestsArea = !entity.isClosed() && tagSuggestingArea;

        if (tagSuggestsArea) {
            var tagText = utilTagText({ tags: tagSuggestingArea });
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
                title: t('issues.fix.remove_tag.title'),
                onClick: function() {
                    var entity = this.issue.entities[0];
                    var tags = _clone(entity.tags);
                    for (var key in tagSuggestingArea) {
                        delete tags[key];
                    }
                    context.perform(
                        actionChangeTags(entity.id, tags),
                        t('issues.fix.remove_tag.undo_redo')
                    );
                }
            }));
            var featureLabel = utilDisplayLabel(entity, context);
            issues.push(new validationIssue({
                type: type,
                severity: 'warning',
                message: t('issues.tag_suggests_area.message', { feature: featureLabel, tag: tagText }),
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
