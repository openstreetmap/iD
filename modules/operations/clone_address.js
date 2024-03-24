import { operationCloneTags } from './clone_tags';

/**
 * Clones the address tags.
 * @param {*} context context object which provides access to iD's internal state
 * @param {*} selectedIDs ids of the entities which are currently selected
 * @returns clone address operation
 */
export function operationCloneAddress(context, selectedIDs) {

    const cloneTags = [
        'addr:housenumber', 'addr:street', 'addr:city', 'addr:province',
        'addr:postcode', 'addr:country', 'addr:full', 'addr:state'
    ];

    return operationCloneTags({
        context: context,
        selectedIDs: selectedIDs,
        cloneTags: cloneTags,
        operationName: 'clone_address'
    });

}
