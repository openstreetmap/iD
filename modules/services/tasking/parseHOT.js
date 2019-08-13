import { utilEnsureIDs } from '../../util';

var historyActions = {
    'STATE_CHANGE': 'stateChange',
    'COMMENT': 'comment',
    'LOCKED_FOR_MAPPING': 'lockedForMapping',
    'AUTO_UNLOCKED_FOR_MAPPING': 'autoUnlockedForMapping',
    'LOCKED_FOR_VALIDATION': 'lockedForValidation',
    'AUTO_UNLOCKED_FOR_VALIDATION': 'autoUnlockedForValidation'
};

var status = {
    'READY': 'ready',
    'MAPPED': 'mapped',
    'VALIDATED': 'validated',
    'INVALIDATED': 'invalidated',
    'BADIMAGERY': 'badimagery',
    'LOCKED_FOR_MAPPING': 'lockedForMapping',
    'LOCKED_FOR_VALIDATION': 'lockedForValidation'
};

export function parseHOTTask(that, json) {

    function parseHistory(geoJSON) {

        var history = geoJSON.properties.taskHistory;

        geoJSON.properties.history = history.map(function(element) {

            var _status = taskGeoJSON.properties.status;

            // get state change
            if (element.action === 'STATE_CHANGE') {
                element.stateChange = status[_status];
            }

            // get cleaner history action
            element.action = historyActions[element.action];

            // rename text
            element.text = element.actionText;
            delete element.actionText;

            // rename date
            element.date = element.actionDate;
            delete element.actionDate;

            // TODO: TAH - get uid for avatar

            return element;
        });

        // delete old named history property
        delete geoJSON.properties.taskHistory;

        return geoJSON;
    }

    var projectId = json.projectId;
    var _project = that.getProject(projectId);

    if (that.currentManager().managerId === 'HOT' || (that.currentManager().managerId === 'custom' && that.customSettings().managerSource === '127.0.0.1:5000')) { // TAH - TODO: change to HOT once local manager is gone

        if (_project) {
            var taskGeoJSON = utilEnsureIDs(_project.getTask(json.taskId));
            //var taskGeoJSON = getTaskGeoJSON(_project, json.taskId);
        }

        // add json to geojson properties
        for (var prop in json) {
            if (Object.prototype.hasOwnProperty.call(json, prop)) {
                if (json[prop] === undefined) {
                    delete this[prop];
                } else {
                    taskGeoJSON.properties[prop] = json[prop];
                }
            }
        }

        // clean up status
        taskGeoJSON.properties.status = status[taskGeoJSON.properties.taskStatus];
        delete taskGeoJSON.properties.taskStatus;

        // parse history
        taskGeoJSON = parseHistory(taskGeoJSON);

        // parse instructions
        taskGeoJSON.properties.instructions = _project.properties.instructions;


        return taskGeoJSON;
    }
    return '';
}


export function parseHOTProject(result) {

    function parseProjectTasks(tasks) {

        var _tasks = {
            type: 'FeatureCollection',
            features: {}
        };

        var features = tasks.features;

        features.forEach(function(feature) {
            var _taskId = feature.properties.taskId;

            _tasks.features[_taskId] = feature;
        });

        return _tasks;
    }

    var hotProject = {
        geometry: {},
        properties: {
            projectId: result.projectId,
            name: result.projectInfo.name,
            author: result.author,
            shortDescription: result.projectInfo.shortDescription,
            description: result.projectInfo.description,
            instructions: result.projectInfo.instructions,
            status: result.projectStatus.toLowerCase(),
            priority: result.projectPriority.toLowerCase(),
            defaultLocale: result.defaultLocale,
            campaignTag: result.campaignTag,
            organisationTag: result.organisationTag,
            tasks: parseProjectTasks(result.tasks),
            mappingTypes: result.mappingTypes
        },
    };

    return hotProject;
}