import { operationCloneTags } from './clone_tags';

/**
 * Clones the turn lane tags.
 * @param {*} context context object which provides access to iD's internal state
 * @param {*} selectedIDs ids of the entities which are currently selected
 * @returns clone turn lanes operation
 */
export function operationCloneTurnLanes(context, selectedIDs) {

    const cloneTags = [
        'turn:lanes', 'turn:lanes:forward', 'turn:lanes:backward'
    ];

    return operationCloneTags({
        context: context,
        selectedIDs: selectedIDs,
        cloneTags: cloneTags,
        operationName: 'clone_turn_lanes'
    });

}
