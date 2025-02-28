import { actionChangeTags } from '../actions/change_tags';
import { behaviorOperation } from '../behavior/operation';
import { modeSelect } from '../modes/select';
import { t } from '../core/localizer';
import { uiCmd } from '../ui/cmd';
import { presetManager } from '../presets';

export function operationDowngrade(context, selectedIDs) {
    let _affectedFeatureCount = 0;
    const _downgradeType = downgradeTypeForEntityIDs(selectedIDs);

    const _multi = _affectedFeatureCount === 1 ? 'single' : 'multiple';

    function downgradeTypeForEntityIDs(entityIds) {
        let downgradeType;
        _affectedFeatureCount = 0;
        for (const i in entityIds) {
            const entityID = entityIds[i];
            const type = downgradeTypeForEntityID(entityID);
            if (type) {
                _affectedFeatureCount += 1;
                if (downgradeType && type !== downgradeType) {
                    if (downgradeType !== 'generic' && type !== 'generic') {
                        downgradeType = 'building_address';
                    } else {
                        downgradeType = 'generic';
                    }
                } else {
                    downgradeType = type;
                }
            }
        }
        return downgradeType;
    }

    function downgradeTypeForEntityID(entityID) {
        const graph = context.graph();
        const entity = graph.entity(entityID);
        const preset = presetManager.match(entity, graph);

        if (!preset || preset.isFallback()) return null;

        if (entity.type === 'node' &&
            preset.id !== 'address' &&
            Object.keys(entity.tags).some(function(key) {
                return key.match(/^addr:.{1,}/);
            })) {

            return 'address';
        }
        const geometry = entity.geometry(graph);
        if (geometry === 'area' &&
            entity.tags.building &&
            !preset.tags.building) {

            return 'building';
        }
        if (geometry === 'vertex' && Object.keys(entity.tags).length) {
            return 'generic';
        }

        return null;
    }

    const buildingKeysToKeep = ['architect', 'building', 'height', 'layer', 'nycdoitt:bin', 'source', 'type', 'wheelchair'];
    const addressKeysToKeep = ['source'];

    const operation = function () {
        context.perform(function(graph) {

            for (const i in selectedIDs) {
                const entityID = selectedIDs[i];
                const type = downgradeTypeForEntityID(entityID);
                if (!type) continue;

                const tags = Object.assign({}, graph.entity(entityID).tags);  // shallow copy
                for (const key in tags) {
                    if (type === 'address' && addressKeysToKeep.indexOf(key) !== -1) continue;
                    if (type === 'building') {
                        if (buildingKeysToKeep.indexOf(key) !== -1 ||
                            key.match(/^building:.{1,}/) ||
                            key.match(/^roof:.{1,}/)) continue;
                    }
                    if (type !== 'generic') {
                        if (key.match(/^addr:.{1,}/) ||
                            key.match(/^source:.{1,}/)) continue;
                    }
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
        return _downgradeType;
    };


    operation.disabled = function () {
        if (selectedIDs.some(hasWikidataTag)) {
            return 'has_wikidata_tag';
        }
        return false;

        function hasWikidataTag(id) {
            const entity = context.entity(id);
            return entity.tags.wikidata && entity.tags.wikidata.trim().length > 0;
        }
    };


    operation.tooltip = function () {
        const disable = operation.disabled();
        return disable ?
            t.append('operations.downgrade.' + disable + '.' + _multi) :
            t.append('operations.downgrade.description.' + _downgradeType);
    };


    operation.annotation = function () {
        let suffix;
        if (_downgradeType === 'building_address') {
            suffix = 'generic';
        } else {
            suffix = _downgradeType;
        }
        return t('operations.downgrade.annotation.' + suffix, { n: _affectedFeatureCount});
    };


    operation.id = 'downgrade';
    operation.keys = [uiCmd('⌫')];
    operation.title = t.append('operations.downgrade.title');
    operation.behavior = behaviorOperation(context).which(operation);


    return operation;
}
