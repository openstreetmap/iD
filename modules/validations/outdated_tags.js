import { t } from '../util/locale';
import { actionUpgradeTags, actionChangeTags, actionChangePreset } from '../actions';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validator';


export function validationOutdatedTags() {
    var type = 'outdated_tags';


    function missingRecommendedTags(entity, context, graph) {
        var preset = context.presets().match(entity, graph);
        if (!preset.isFallback() && preset.tags !== preset.addTags) {
            return Object.keys(preset.addTags).reduce(function(obj, key) {
                if (!entity.tags[key]) {
                    obj[key] = preset.addTags[key];
                }
                return obj;
            }, {});
        }
        return {};
    }


    var validation = function(entity, context) {
        var replacementPresetID = context.presets().match(entity, context.graph()).replacement;
        var deprecatedTagsArray = entity.deprecatedTags();
        var missingTags = missingRecommendedTags(entity, context, context.graph());


        if (!replacementPresetID && deprecatedTagsArray.length === 0 &&
            Object.keys(missingTags).length === 0) return [];

        return [new validationIssue({
            type: type,
            severity: 'warning',
            message: t('issues.outdated_tags.message', { feature: utilDisplayLabel(entity, context) }),
            tooltip: t('issues.outdated_tags.tip'),
            entities: [entity],
            info: {
                deprecatedTagsArray: deprecatedTagsArray,
                replacementPresetID: replacementPresetID
            },
            fixes: [
                new validationIssueFix({
                    icon: 'iD-icon-up',
                    title: t('issues.fix.upgrade_tags.title'),
                    onClick: function() {
                        var replacementPresetID = this.issue.info.replacementPresetID;
                        var replacementPreset = replacementPresetID && context.presets().item(replacementPresetID);
                        var deprecatedTagsArray = this.issue.info.deprecatedTagsArray;
                        var entityID = this.issue.entities[0].id;
                        context.perform(
                            function(graph) {
                                if (replacementPreset) {
                                    var oldPreset = context.presets().match(graph.entity(entityID), context.graph());
                                    graph = actionChangePreset(entityID, oldPreset, replacementPreset)(graph);
                                    deprecatedTagsArray = graph.entity(entityID).deprecatedTags();
                                }
                                deprecatedTagsArray.forEach(function(deprecatedTags) {
                                    graph = actionUpgradeTags(entityID, deprecatedTags.old, deprecatedTags.replace)(graph);
                                });
                                var missingTags = missingRecommendedTags(graph.entity(entityID), context, graph);
                                var tags = Object.assign({}, graph.entity(entityID).tags);  // shallow copy
                                for (var key in missingTags) {
                                    tags[key] = missingTags[key];
                                }
                                graph = actionChangeTags(entityID, tags)(graph);
                                return graph;
                            },
                            t('issues.fix.upgrade_tags.annotation')
                        );
                    }
                })
            ]
        })];
    };

    validation.type = type;

    return validation;
}
