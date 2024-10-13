import { operationCloneTags } from './clone_tags';

/**
 * Clones the cycleway tags.
 * @param {*} context context object which provides access to iD's internal state
 * @param {*} selectedIDs ids of the entities which are currently selected
 * @returns clone cycleway operation
 */
export function operationCloneCycleway(context, selectedIDs) {

    const cloneTags = [
        'routing:bicycle', 'bicycle', 'cycleway:both',
        'cycleway:right', 'cycleway:left', 'oneway:bicycle'
    ];

    return operationCloneTags({
        context: context,
        selectedIDs: selectedIDs,
        cloneTags: cloneTags,
        operationName: 'clone_cycleway'
    });

}
