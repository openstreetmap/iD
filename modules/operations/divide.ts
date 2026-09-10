import { t } from '../core/localizer';
import { actionDivide } from '../actions/divide';
import { behaviorOperation } from '../behavior/operation';
import { utilGetAllNodes } from '../util';
import { modeSelect } from '../modes/select';
import { uiDividePreview } from '../ui/divide_preview';
import { uiAsyncModal } from '../ui/modal_async';
import type { CreateOperation, Operation } from '../core/history';
import type { geoExtent } from '../geo';
import type { EntityId, WayId } from '../osm';
import type { coreDifference, coreGraph } from '../core';

export const operationDivide: CreateOperation = (context, selectedIDs) => {
    let _extent: geoExtent;
    const _action = getAction(selectedIDs[0]);

    function getAction(entityID: EntityId) {
        const entity = context.entity(entityID);

        // this operation is only show when a single way is selected
        if (entity.type !== 'way' || selectedIDs.length !== 1) return null;

        _extent = entity.extent(context.graph());

        return actionDivide(entity.id, context.projection);
    }

    const operation: Operation = async () => {
        if (!_action) return;

        const modal = uiAsyncModal(context);
        const form = uiDividePreview(context, modal, selectedIDs[0] as WayId);

        let state = { long_length: 1, short_length: 1, isValid: true };
        form.on('change', (newValue) => {
            state = newValue;
            modal.setIsDisabled(!state.isValid);
        });

        const confirmed = await modal.open(
            t.append('operations.divide.title'),
            // @ts-expect-error -- too hard
            form,
        );

        if (!confirmed) return; // user cancelled the operation

        // this would have no effect
        if (state.short_length === 1 && state.long_length === 1) return;

        // this should be impossible
        if (!state.isValid) return;

        const difference = context.perform((g: coreGraph, t: number) => _action(g, t, state), operation.annotation()) as coreDifference;

        // select all the new areas so that mappers can easily add/change tags
        const idsToSelect: EntityId[] = difference
            .created()
            .filter(entity => entity.type === 'way')
            .map(entity => entity.id);
        idsToSelect.push(selectedIDs[0]);
        context.enter(modeSelect(context, idsToSelect));

        window.setTimeout(() => context.validator().validate(), 300); // after any transition
    };

    operation.available = () => !!_action;


    // don't cache this because the visible extent could change
    operation.disabled = () => {
        if (!_action) return '';

        const isDisabled = _action.disabled!(context.graph());
        if (isDisabled) {
            return isDisabled;
        } else if (_extent.percentContainedIn(context.map().extent()) < 0.8) {
            return 'too_large';
        } else if (someMissing()) {
            return 'not_downloaded';
        } else if (selectedIDs.some(context.hasHiddenConnections)) {
            return 'connected_to_hidden';
        }

        return false;


        function someMissing() {
            if (context.inIntro()) return false;
            const osm = context.connection();
            if (osm) {
                const _coords = utilGetAllNodes(selectedIDs, context.graph()).map(n => n.loc);
                const missing = _coords.filter(loc => !osm.isDataLoaded(loc));
                if (missing.length) {
                    missing.forEach(loc => context.loadTileAtLoc(loc));
                    return true;
                }
            }
            return false;
        }
    };


    operation.tooltip = () => {
        const disableReason = operation.disabled();
        return disableReason
            ? t.append('operations.divide.disabled.' + disableReason)
            : t.append('operations.divide.tooltip');
    };


    operation.annotation = () => t('operations.divide.annotation');

    operation.id = 'divide';
    operation.keys = [t('operations.divide.key')];
    operation.title = t.append('operations.divide.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
};
