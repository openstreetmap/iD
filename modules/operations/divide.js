// @ts-check
import { t } from '../core/localizer';
import { actionDivide } from '../actions/divide';
import { behaviorOperation } from '../behavior/operation';
import { utilGetAllNodes } from '../util';
import { modeSelect } from '../modes/select';

/** the maximum number of sections allowed, limited for performance reasons */
const DIVIDE_LIMIT = 200;


/** @param {string[]} selectedIDs */
export function operationDivide(context, selectedIDs) {
    let _extent;
    const _action = getAction(selectedIDs[0]);
    const _coords = utilGetAllNodes(selectedIDs, context.graph()).map(n => n.loc);

    /** @param {string} entityID */
    function getAction(entityID) {
        const entity = context.entity(entityID);

        // this operation is only show when a single way is selected
        if (entity.type !== 'way' || selectedIDs.length !== 1) return null;

        if (!_extent) {
            _extent =  entity.extent(context.graph());
        } else {
            _extent = _extent.extend(entity.extent(context.graph()));
        }

        return actionDivide(entityID, context.projection);
    }

    const operation = () => {
        if (!_action) return;

        const longLength = +prompt('Long Length');
        if (!longLength) return;
        const shortLength = +prompt('Short Length');
        if (!shortLength) return;

        // this would have no effect
        if (shortLength === 1 && longLength === 1) return;

        if (shortLength * longLength > DIVIDE_LIMIT) {
            context.ui().flash
                .duration(4000)
                .iconName('#iD-icon-no')
                .label(t('operations.divide.error.too_big', { limit: DIVIDE_LIMIT }))();
            return;
        }

        const difference = context.perform(_action(+shortLength, +longLength), operation.annotation());

        // select all the new areas so that mappers can easily add/change tags
        const idsToSelect = difference.extantIDs().filter(id => context.entity(id).type === 'way');
        context.enter(modeSelect(context, idsToSelect));

        window.setTimeout(() => context.validator().validate(), 300); // after any transition
    };

    operation.available = () => !!_action;


    // don't cache this because the visible extent could change
    operation.disabled = () => {
        if (!_action) return '';

        const isDisabled = _action.disabled(context.graph());
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
        return disableReason ?
            t('operations.divide.disabled.' + disableReason) :
            t('operations.divide.tooltip');
    };


    operation.annotation = () => t('operations.divide.annotation');

    operation.id = 'divide';
    operation.keys = [t('operations.divide.key')];
    operation.title = t('operations.divide.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
