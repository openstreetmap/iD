import { t } from '../core/localizer';

import { actionMembersRemove } from '../actions/members_remove';

import { behaviorOperation } from '../behavior/operation';
import { modeSelect } from '../modes/select';

export function operationMembersRemove(context, selectedIDs) {

    var _action = actionMembersRemove(selectedIDs);

    var operation = function() {

        if (operation.disabled()) return;

        context.perform(_action, operation.annotation());

        context.validator().validate();

        var resultIDs = selectedIDs.filter(context.hasEntity);
        if (resultIDs.length > 1) {
            var interestingIDs = resultIDs.filter(function(id) {
                return context.entity(id).hasInterestingTags();
            });
            if (interestingIDs.length) resultIDs = interestingIDs;
        }
        context.enter(modeSelect(context, resultIDs));
    };

    operation.available = function() {
        return !_action.disabled(context.graph());
    };

    operation.disabled = function() {
        return _action.disabled(context.graph());
    };

    operation.tooltip = function() {
        return t.append('operations.members_remove.description');
    };

    operation.annotation = function() {
        return t('operations.members_remove.annotation', { n: selectedIDs.length });
    };

    operation.id = 'members_remove';
    operation.keys = [];
    operation.title = t.append('operations.members_remove.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
