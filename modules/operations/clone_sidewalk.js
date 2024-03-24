import { operationCloneTags } from './clone_tags';

/**
 * Clones the sidewalk tags.
 * @param {*} context context object which provides access to iD's internal state
 * @param {*} selectedIDs ids of the entities which are currently selected
 * @returns clone sidewalk operation
 */
export function operationCloneSidewalk(context, selectedIDs) {

    const cloneTags = [
        'sidewalk', 'sidewalk:right', 'sidewalk:left', 'foot'
    ];

    return operationCloneTags({
        context: context,
        selectedIDs: selectedIDs,
        cloneTags: cloneTags,
        operationName: 'clone_sidewalk'
    });

}
