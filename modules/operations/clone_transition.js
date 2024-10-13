import { operationCloneTags } from './clone_tags';

/**
 * Clones the transition tags.
 * @param {*} context context object which provides access to iD's internal state
 * @param {*} selectedIDs ids of the entities which are currently selected
 * @returns clone transition operation
 */
export function operationCloneTransition(context, selectedIDs) {

    const cloneTags = [
        'placement', 'placement:start', 'placement:end', 'width:lanes:start', 'width:lanes:end',
        'placement:forward', 'width:lanes:forward:start', 'width:lanes:forward:end',
        'placement:backward', 'width:lanes:backward:start', 'width:lanes:backward:end'
    ];

    return operationCloneTags({
        context: context,
        selectedIDs: selectedIDs,
        cloneTags: cloneTags,
        operationName: 'clone_transition'
    });

}
