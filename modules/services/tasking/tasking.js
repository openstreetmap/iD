
import stringify from 'fast-json-stable-stringify';
import { utilHashcode, utilRebind } from '../../util';
import { t } from '../../util/locale';

import _filter from 'lodash-es/filter';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { text as d3_text } from 'd3-fetch';

import { task, project, manager } from '../../osm';
import { dataTaskingManagers } from '../../../data';

import { parseHOTTask, parseHOTProject } from './parseHOT';



var apibases = {
    local:  'http://127.0.0.1:5000/api/v1/', // TODO: TAH - change to list of real manager urls when published
    hot: 'https://tasks.hotosm.org/api/v1/',
};
var dispatch = d3_dispatch('change', 'loadedTask', 'loadedProject', 'loadedCustomSettings', 'setManager', 'setProject', 'setTask');
var _taskingCache = {};
var _enabled = false;

var _errors = {
    'unsavedEdits': {
        severity: 'error',
        message: function() {
            return t('tasking.errors.unsavedEdits');
        },
        active: false
    },
    'mappingNotAllowed': {
        severity: 'error',
        message: function() {
            return t('tasking.errors.mappingNotAllowed'); // TODO: TAH - change text to include user and status
        },
        active: false
    },
    'validationNotAllowed': {
        severity: 'error',
        message: function() {
            return t('tasking.errors.validationNotAllowed'); // TODO: TAH - change text to include user and status
        },
        active: false
    }
};


function parseTask(that, result, parsedUrl) {

    var json = JSON.parse(result);

    switch (parsedUrl.managerSource) {
        case '127.0.0.1:5000' || 'HOT': // TODO: TAH - remove localhost
            json = parseHOTTask(that, json);
            break;
        default:
            break;
    }

    return json;


}


function parseProject(result, parsedUrl) {

    var json = JSON.parse(result);

    switch (parsedUrl.managerSource) {
        case '127.0.0.1:5000' || 'HOT': // TODO: TAH - remove localhost
            json = parseHOTProject(json);
            break;
        default:
            break;
    }

    return json;
}


var parsers = {

    manager: function(values) {
        var newManager = new manager(values);

        return newManager;
    },


    project: function(values) {


        var _project = {
            geometry: values.geometry,
            properties: {
                projectId: values.properties.projectId,
                name: values.properties.name,
                status: values.properties.status,
                tasks: values.properties.tasks,
                author: values.properties.author,
                shortDescription: values.properties.shortDescription,
                description: values.properties.description,
                instructions: values.properties.instructions,
                priority: values.properties.priority,
                defaultLocale: values.properties.defaultLocale,
                campaignTag: values.properties.campaignTag,
                organisationTag: values.properties.organisationTag,
                mappingTypes: values.properties.mappingTypes
            },
        };

        var newProject = new project(_project);


        return newProject;
    },

    task: function(values) {

        // TODO: parse differently depending on manager (i.e., combine HOT task details from two API calls)


        var _task = {
            type: values.type,
            geometry: values.geometry,
            properties: {
                taskId: values.properties.taskId,
                projectId: values.properties.projectId,
                status: values.properties.status,
                history: values.properties.history,
                instructions: values.properties.instructions,
                perTaskInstructions: values.properties.perTaskInstructions,
            },
            __featurehash__: values.__featurehash__
        };

        var newTask = new task(_task);


        return newTask;
    }
};


function getExtension(fileName) {
    if (!fileName) return;

    var re = /\.(gpx|kml|(geo)?json)$/i;
    var match = fileName.toLowerCase().match(re);
    return match && match.length && match[0];
}


function parseUrl(url, defaultExtension) {

    if (!url) return;

    var parsedUrl = {};

    // split url into path and params
    var splitUrl = url.split('?');
    var path = splitUrl[0];
    var params = splitUrl[1];

    // strip off any querystring/hash from the url before checking extension
    var testUrl = url.split(/[?#]/)[0];
    var extension = getExtension(testUrl) || defaultExtension;

    // TODO: TAH - get finish regex to get url type
    var _project_re = new RegExp(/http:\/\/127.0.0.1:5000\/api\/v1\/project\/[0-9]/);
    var _task_re = new RegExp(/http:\/\/127.0.0.1:5000\/api\/v1\/project\/[0-9]+\/task\/[0-9]+$/);

    var _containsProject = _project_re.test(path);
    var _containsTask = _task_re.test(path);

    var urlType = _containsTask ? 'task' : _containsProject ? 'project' : undefined;
    var url_slugs = url.split('?')[0].split('/');

    var managers = [
        '127.0.0.1:5000',
        'HOT'
    ];


    // NOTE: make manager an object, pull away from this parser, make sure in loadProject, getManager works to set manager!


    function getManager(slug) {
        return managers.find(function(element){ return element = slug; });
    }

    var managerSource = getManager(url_slugs[2]);
    var projectId;
    var taskId;

    if (_containsProject) {
        if (_containsTask) {
            projectId = parseInt(url_slugs[url_slugs.length - 3], 10);
        } else {
            projectId = parseInt(url_slugs[url_slugs.length - 1], 10);
        }
    }

    if (_containsTask) {
        taskId = url_slugs[url_slugs.length - 1];
    }

    parsedUrl = {
        url: url,
        path: path,
        params: params,
        urlType: urlType,
        extension: extension,
        url_slugs: url_slugs,
        managerSource: managerSource,
        projectId: parseInt(projectId, 10),
        taskId: parseInt(taskId, 10),
    };

    return parsedUrl;
}


function formulateUrl(parsedUrl, type) {
    var path;
    switch (parsedUrl.managerSource) {
        case '127.0.0.1:5000' || 'HOT': // TODO: TAH - remove localhost

            path = apibases.local + 'project/' + parsedUrl.projectId; // TODO: TAH - remove apibase.local
            if (type === 'task') {
                path += parsedUrl.taskId ? '/task/' + parsedUrl.taskId : '';
            }
            path += '?as_file=false';
            break;
        default:
            break;
    }

    return path;
}


// ensure that all geojson features in a collection have IDs
function ensureIDs(gj) {
    if (!gj) return null;

    if (gj.type === 'FeatureCollection') {
        for (var i = 0; i < gj.features.length; i++) {
            ensureFeatureID(gj.features[i]);
        }
    } else {
        ensureFeatureID(gj);
    }
    return gj;
}


// ensure that each single Feature object has a unique ID
function ensureFeatureID(feature) {
    if (!feature) return;
    feature.__featurehash__ = utilHashcode(stringify(feature));
    return feature;
}


function initManagers() {
    // Add all the available tasking manager sources (TODO: TAH - add add managers for task searching)
    var _managers = dataTaskingManagers.map(function(manager) {
        parsers.manager(manager);
    });

    // add custom and none managers
    _managers.push(parsers.manager({
        managerId: 'custom',
        name: t('tasking.manager.managers.custom.name')
    }));
    _managers.push(parsers.manager({
        managerId: 'none',
        name: t('tasking.manager.managers.none.name')
    }));

    return _managers;
}


export default {


    enabled: function(val) {
        if (!arguments.length) return _enabled;

        _enabled = val;
    },


    init: function () {
        this.event = utilRebind(this, dispatch, 'on');

        var that = this;

        // create managers
        var managers = initManagers();


        _taskingCache = {
            managers: managers,
            projects: {},
            tasks: {},
            currentManager: {},
            currentProject: {},
            currentTask: {},
            customSettings: {},
            editsWhileTasking: false,
            errors: _errors,
        };

        // set starting manager
        that.currentManager(that.getManager('none'));
    },


    reset: function() {
        var that = this;

        // create managers
        var managers = initManagers();

        _taskingCache = {
            managers: managers,
            projects: {},
            tasks: {},
            currentManager: {},
            currentProject: {},
            currentTask: {},
            customSettings: {},
            editsWhileTasking: false,
            errors: _errors,
        };

        // set starting manager
        that.currentManager(that.getManager('none'));
    },


    managers: function() {
        return _taskingCache.managers;
    },


    getManager: function(managerId) {
        return _taskingCache.managers.find(function(manager) {
            return manager.managerId && manager.managerId === managerId;
        });
    },


    loadFromUrl: function(parsedUrl) {


        var that = this;

        // if url is for raw data
        if (parsedUrl.extension) {
            d3_text(parsedUrl.url)
                .then(function(data) {

                    var gj;
                    switch (parsedUrl.extension) {
                        case '.geojson':
                        case '.json':
                            gj = JSON.parse(data);
                            break;
                    }

                    gj = gj || {};
                    if (Object.keys(gj).length) {
                        var newTask = ensureIDs(gj); // create new task

                        // if task doesn't already exist, add it
                        if (!that.getTask(parsedUrl.taskId)) {
                            that.addTask(newTask); // add task to tasks
                        }

                        dispatch.call('change');
                    }


                })
                .catch(function(err) {
                    console.log('loadFromUrl error: ', err); // TODO: TAH - better handling of error
                });

        // if the url is to a tasking manager api endpoint
        } else {
            switch (parsedUrl.urlType) {
                case 'task':
                    that.loadTask(parsedUrl);
                    break;
                case 'project':
                    that.loadProject(parsedUrl);
                    break;
                case undefined:
                    console.log('undefined url result: ', parsedUrl); // TODO: TAH - better handling of urlType
                    break;
                default:
                    break;
            }
        }

        return this;

    },


    loadProject: function(parsedUrl) {
        var that = this;

        // var managerId = parsedUrl.manager;
        var projectId = parsedUrl.projectId;

        // load project if it hasn't been loaded
        if (!that.getProject(projectId)) {
            d3_text(formulateUrl(parsedUrl, 'project'))
                .then(function(result) {
                    if (result) {

                        // reformulate result based on manager
                        var json = parseProject(result, parsedUrl);

                        // create project
                        var newProject = parsers.project(json);

                        // add to projects
                        that.addProject(newProject);

                        dispatch.call('loadedProject', {}, newProject);
                        dispatch.call('change');

                        // load task if requested
                        if (parsedUrl.urlType === 'task') { that.loadTask(parsedUrl); }
                    }
                })
                .catch(function(err) {
                    console.log('loadProject error: ', err); // TODO: TAH - better handling of errors
                });
        }

    },

    projects: function() {
        return _taskingCache.projects;
    },


    getProject: function(projectId) {
        return _taskingCache.projects[projectId];
    },


    addProject: function(project) {
        _taskingCache.projects[project.id()] = project;
    },


    loadTask: function(parsedUrl) {

        var that = this;

        var taskId = parsedUrl.taskId;
        var projectId = parsedUrl.projectId;

        // load project first if it hasn't been loaded
        if (!that.getProject(projectId)) {
            that.loadProject(parsedUrl);
            return;

        // if the project is loaded but not current, make current
        } else if (!that.currentProject().id === projectId) {
            that.currentProject(that.getProject(projectId));
        }

        // load task if it hasn't been loaded
        if (!that.getTask(taskId)) {

            d3_text(formulateUrl(parsedUrl, 'task'))
                .then(function(result) {
                    if (result) {

                        // reformulate result based on manager
                        var json = parseTask(that, result, parsedUrl);

                        // create task
                        var newTask = parsers.task(json);

                        // add to tasks
                        that.addTask(newTask);

                        dispatch.call('loadedTask', {}, newTask);
                        dispatch.call('change');
                    }
                })
                .catch(function(err) {
                    console.log('loadTask error: ', err); // TODO: TAH - better handling of errors
                });
        }
    },

    tasks: function() {
        return _taskingCache.tasks;
    },


    getTask: function(taskId) {
        return _taskingCache.tasks[taskId];
    },


    replaceTask: function(t) {
        if (!(t instanceof task) || !t.taskId) return;

        _taskingCache.tasks[t.taskId] = t;

        // if currentTask, set again
        if (t.taskId && this.currentTask().taskId === t.taskId) this.currentTask(t);
        return t;
    },


    removeTask: function(t) {
        if (!(t instanceof task) || !t.taskId) return;

        delete _taskingCache.tasks[t.taskId];
    },


    addTask: function(task) {
        _taskingCache.tasks[task.id()] = task;
    },


    customSettings: function(d) {
        if (!arguments.length) return _taskingCache.customSettings;

        if (d.url) {
            var parsedUrl = parseUrl(d.url); // parse url
            _taskingCache.customSettings = parsedUrl; // save custom settings
        }

        dispatch.call('loadedCustomSettings');

        return this;
    },


    cache: function() {
        return _taskingCache;
    },


    currentManager: function(d) {

        if (!arguments.length) return _taskingCache.currentManager;

        _taskingCache.currentManager = d;

        dispatch.call('setManager');

        return this;
    },


    currentProject: function(d) {

        if (!arguments.length) return _taskingCache.currentProject;

        _taskingCache.currentProject = d;

        dispatch.call('setProject');

        return this;
    },


    currentTask: function(d) {
        if (!arguments.length) return _taskingCache.currentTask;

        _taskingCache.currentTask = d;

        dispatch.call('setTask');

        return this;
    },


    resetCurrentTask: function() {
        _taskingCache.currentTask = {};
    },


    resetCurrentProject: function() {
        _taskingCache.currentProject = {};
    },


    resetManager: function() {
        var that = this;

        that.currentManager(that.getManager('none'));
    },


    resetCurrentProjectAndTask: function() {
        var that = this;

        that.resetCurrentProject();
        that.resetCurrentTask();

        // TODO: TAH - when reenabling toggle, load current task & project again. Somehow get from storage
    },


    resetAll: function() {
        var that = this;

        that.resetManager();
        that.resetProjectAndTask();

        return this;
    },


    edits: function(val) {
        if (!arguments.length) return _taskingCache.editsWhileTasking;

        _taskingCache.editsWhileTasking = val;

        return this;
    },

    errors: function(val) {
        if (!arguments.length) return _taskingCache.errors;

        _taskingCache.errors = val;

        return this;
    },


    postTaskUpdate: function() {
        console.log('TODO: postTaskUpdate');
    },

};
