import { operationCloneTags } from './clone_tags';

/**
 * Clones the lane tags.
 * @param {*} context context object which provides access to iD's internal state
 * @param {*} selectedIDs ids of the entities which are currently selected
 * @returns clone lanes operation
 */
export function operationCloneLanes(context, selectedIDs) {

    const cloneTags = [
        'lanes', 'lanes:forward', 'lanes:backward'
    ];

    return operationCloneTags({
        context: context,
        selectedIDs: selectedIDs,
        cloneTags: cloneTags,
        operationName: 'clone_lanes'
    });

}
