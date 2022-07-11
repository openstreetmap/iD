import { operationCloneTags } from './clone_tags';

/**
 * Clones the bus lane tags.
 * @param {*} context context object which provides access to iD's internal state
 * @param {*} selectedIDs ids of the entities which are currently selected
 * @returns clone bus lane operation
 */
export function operationCloneBusLanes(context, selectedIDs) {

    const cloneTags = [
        'bus:lanes', 'bus:lanes:forward', 'bus:lanes:backward',
        'lanes:bus', 'lanes:bus:forward', 'lanes:bus:backward',
        'busway:right', 'busway:left', 'routing:bus', 'bus'
    ];

    return operationCloneTags({
        context: context,
        selectedIDs: selectedIDs,
        cloneTags: cloneTags,
        operationName: 'clone_bus_lanes'
    });

}
