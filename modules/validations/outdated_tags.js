import { t } from '../util/locale';
import { actionChangePreset } from '../actions/change_preset';
import { actionChangeTags } from '../actions/change_tags';
import { actionUpgradeTags } from '../actions/upgrade_tags';
import { osmIsOldMultipolygonOuterMember, osmOldMultipolygonOuterMemberOfRelation } from '../osm/multipolygon';
import { utilDisplayLabel, utilTagDiff } from '../util';
import { validationIssue, validationIssueFix } from '../core/validation';


export function validationOutdatedTags() {
    var type = 'outdated_tags';

    function oldTagIssues(entity, context) {
        var graph = context.graph();
        var oldTags = Object.assign({}, entity.tags);  // shallow copy
        var preset = context.presets().match(entity, graph);
        var explicitPresetUpgrade = preset.replacement;
        var subtype = 'deprecated_tags';

        // upgrade preset..
        if (preset.replacement) {
            var newPreset = context.presets().item(preset.replacement);
            graph = actionChangePreset(entity.id, preset, newPreset, true)(graph);  // true = skip field defaults
            entity = graph.entity(entity.id);
            preset = newPreset;
        }

        // upgrade tags..
        var deprecatedTags = entity.deprecatedTags();
        if (deprecatedTags.length) {
            deprecatedTags.forEach(function(tag) {
                graph = actionUpgradeTags(entity.id, tag.old, tag.replace)(graph);
            });
            entity = graph.entity(entity.id);
        }

        // add missing addTags..
        var newTags = Object.assign({}, entity.tags);  // shallow copy
        if (preset.tags !== preset.addTags) {
            Object.keys(preset.addTags).forEach(function(k) {
                if (!newTags[k]) {
                    newTags[k] = preset.addTags[k];
                    if (!explicitPresetUpgrade) {
                        subtype = 'incomplete_tags';
                    }
                }
            });
        }

        // determine diff
        var tagDiff = utilTagDiff(oldTags, newTags);
        if (!tagDiff.length) return [];

        return [new validationIssue({
            type: type,
            subtype: subtype,
            severity: 'warning',
            message: t('issues.outdated_tags.message', { feature: utilDisplayLabel(entity, context) }),
            reference: showReference,
            entities: [entity],
            fixes: [
                new validationIssueFix({
                    autoArgs: [doUpgrade, t('issues.fix.upgrade_tags.annotation')],
                    title: t('issues.fix.upgrade_tags.title'),
                    onClick: function() {
                        context.perform(doUpgrade, t('issues.fix.upgrade_tags.annotation'));
                    }
                })
            ]
        })];


        function doUpgrade(graph) {
            return actionChangeTags(entity.id, newTags)(graph);
        }


        function showReference(selection) {
            var enter = selection.selectAll('.issue-reference')
                .data([0])
                .enter();

            enter
                .append('div')
                .attr('class', 'issue-reference')
                .text(t('issues.outdated_tags.reference'));

            enter
                .append('strong')
                .text(t('issues.suggested'));

            enter
                .append('table')
                .attr('class', 'tagDiff-table')
                .selectAll('.tagDiff-row')
                .data(tagDiff)
                .enter()
                .append('tr')
                .attr('class', 'tagDiff-row')
                .append('td')
                .attr('class', function(d) {
                    var klass = d.charAt(0) === '+' ? 'add' : 'remove';
                    return 'tagDiff-cell tagDiff-cell-' + klass;
                })
                .text(function(d) { return d; });
        }
    }

    function oldMultipolygonIssues(entity, context) {

        var graph = context.graph();

        var multipolygon, outerWay;
        if (entity.type === 'relation') {
            outerWay = osmOldMultipolygonOuterMemberOfRelation(entity, graph);
            multipolygon = entity;
        } else if (entity.type === 'way') {
            multipolygon = osmIsOldMultipolygonOuterMember(entity, graph);
            outerWay = entity;
        } else {
            return [];
        }

        if (!multipolygon || !outerWay) return [];

        var multipolygonLabel = utilDisplayLabel(multipolygon, context);
        return [new validationIssue({
            type: type,
            subtype: 'old_multipolygon',
            severity: 'warning',
            message: t('issues.old_multipolygon.message', { multipolygon: multipolygonLabel }),
            reference: showReference,
            entities: [outerWay, multipolygon],
            fixes: [
                new validationIssueFix({
                    autoArgs: [doUpgrade, t('issues.fix.move_tags.annotation')],
                    title: t('issues.fix.move_tags.title'),
                    onClick: function() {
                        context.perform(doUpgrade, t('issues.fix.move_tags.annotation'));
                    }
                })
            ]
        })];


        function doUpgrade(graph) {
            multipolygon = multipolygon.mergeTags(outerWay.tags);
            graph = graph.replace(multipolygon);
            return actionChangeTags(outerWay.id, {})(graph);
        }


        function showReference(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .text(t('issues.old_multipolygon.reference'));
        }
    }


    var validation = function checkOutdatedTags(entity, context) {
        var issues = oldMultipolygonIssues(entity, context);
        if (!issues.length) issues = oldTagIssues(entity, context);
        return issues;
    };


    validation.type = type;

    return validation;
}
