import { operationCloneTags } from './clone_tags';

/**
 * Clones the name tags.
 * @param {*} context context object which provides access to iD's internal state
 * @param {*} selectedIDs ids of the entities which are currently selected
 * @returns clone name operation
 */
export function operationCloneName(context, selectedIDs ) {

    const cloneTags = [
        'name', 'operator', 'name_alt', 'name:fr', 'name:en'
    ];

    return operationCloneTags({
        context: context,
        selectedIDs: selectedIDs,
        cloneTags: cloneTags,
        operationName: 'clone_name'
    });

}
