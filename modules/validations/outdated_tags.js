import { t } from '../util/locale';
import { actionUpgradeTags, actionChangeTags, actionChangePreset } from '../actions';
import { utilArrayUnion, utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validator';


export function validationOutdatedTags() {
    var type = 'outdated_tags';


    var validation = function checkOutdatedTags(entity, context) {
        var graph = context.graph();
        var oldTags = Object.assign({}, entity.tags);  // shallow copy
        var preset = context.presets().match(entity, graph);

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
                }
            });
        }

        // determine diff
        var keys = utilArrayUnion(Object.keys(oldTags), Object.keys(newTags)).sort();
        var tagDiff = [];
        keys.forEach(function(k) {
            var oldVal = oldTags[k];
            var newVal = newTags[k];

            if (oldVal && (!newVal || newVal !== oldVal)) {
                tagDiff.push('- ' + k + '=' + oldVal);
            }
            if (newVal && (!oldVal || newVal !== oldVal)) {
                tagDiff.push('+ ' + k + '=' + newVal);
            }
        });

        if (!tagDiff.length) return [];

        return [new validationIssue({
            type: type,
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
    };


    validation.type = type;

    return validation;
}
