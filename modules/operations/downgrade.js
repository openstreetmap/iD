import { actionChangeTags } from '../actions/change_tags';
import { behaviorOperation } from '../behavior/operation';
import { modeSelect } from '../modes/select';
import { t } from '../core/localizer';
import { uiCmd } from '../ui/cmd';
import { presetManager } from '../presets';

export function operationDowngrade(context, selectedIDs) {
    var affectedFeatureCount = 0;
    var downgradeType;

    setDowngradeTypeForEntityIDs();

    var multi = affectedFeatureCount === 1 ? 'single' : 'multiple';

    function setDowngradeTypeForEntityIDs() {
        for (var i in selectedIDs) {
            var entityID = selectedIDs[i];
            var type = downgradeTypeForEntityID(entityID);
            if (type) {
                affectedFeatureCount += 1;
                if (downgradeType && type !== downgradeType) {
                    downgradeType = 'building_address';
                } else {
                    downgradeType = type;
                }
            }
        }
    }

    function downgradeTypeForEntityID(entityID) {
        var graph = context.graph();
        var entity = graph.entity(entityID);
        var preset = presetManager.match(entity, graph);

        if (!preset || preset.isFallback()) return null;

        if (entity.type === 'node' &&
            preset.id !== 'address' &&
            Object.keys(entity.tags).some(function(key) {
                return key.match(/^addr:.{1,}/);
            })) {

            return 'address';
        }
        if (entity.geometry(graph) === 'area' &&
            entity.tags.building &&
            !preset.tags.building) {

            return 'building';
        }

        return null;
    }

    var buildingKeysToKeep = ['architect', 'building', 'height', 'layer', 'source', 'type', 'wheelchair'];
    var addressKeysToKeep = ['source'];

    var operation = function () {
        context.perform(function(graph) {

            for (var i in selectedIDs) {
                var entityID = selectedIDs[i];
                var type = downgradeTypeForEntityID(entityID);
                if (!type) continue;

                var tags = Object.assign({}, graph.entity(entityID).tags);  // shallow copy
                for (var key in tags) {
                    if (type === 'address' && addressKeysToKeep.indexOf(key) !== -1) continue;
                    if (type === 'building') {
                        if (buildingKeysToKeep.indexOf(key) !== -1 ||
                            key.match(/^building:.{1,}/) ||
                            key.match(/^roof:.{1,}/)) continue;
                    }
                    // keep address tags for buildings too
                    if (key.match(/^addr:.{1,}/)) continue;

                    delete tags[key];
                }
                graph = actionChangeTags(entityID, tags)(graph);
            }
            return graph;
        }, operation.annotation());

        context.validator().validate();

        // refresh the select mode to enable the delete operation
        context.enter(modeSelect(context, selectedIDs));
    };


    operation.available = function () {
        return downgradeType;
    };


    operation.disabled = function () {
        if (selectedIDs.some(hasWikidataTag)) {
            return 'has_wikidata_tag';
        }
        return false;

        function hasWikidataTag(id) {
            var entity = context.entity(id);
            return entity.tags.wikidata && entity.tags.wikidata.trim().length > 0;
        }
    };


    operation.tooltip = function () {
        var disable = operation.disabled();
        return disable ?
            t('operations.downgrade.' + disable + '.' + multi) :
            t('operations.downgrade.description.' + downgradeType);
    };


    operation.annotation = function () {
        var suffix;
        if (downgradeType === 'building_address') {
            suffix = 'multiple';
        } else {
            suffix = downgradeType + '.' + multi;
        }
        return t('operations.downgrade.annotation.' + suffix, { n: affectedFeatureCount});
    };


    operation.id = 'downgrade';
    operation.keys = [uiCmd('⌘⌫'), uiCmd('⌘⌦'), uiCmd('⌦')];
    operation.title = t('operations.downgrade.title');
    operation.behavior = behaviorOperation(context).which(operation);


    return operation;
}
