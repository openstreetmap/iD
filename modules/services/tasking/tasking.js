
import stringify from 'fast-json-stable-stringify';
import { utilHashcode, utilRebind } from '../../util';
import { t } from '../../util/locale';

import _filter from 'lodash-es/filter';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { text as d3_text } from 'd3-fetch';

import { taskingManager } from './manager';
import { taskingProject } from './project';
import { taskingTask } from './task';
import { taskingManagers } from '../../../data';

import { parseHOTTask, parseHOTProject } from './parseHOT';
import { getData, postData } from './fetch_tm';
import { _errors, handleError } from './errors_tm';



var dispatch = d3_dispatch('change', 'loadedTask', 'loadedProject', 'loadedCustomSettings', 'setManager', 'setProject', 'setTask', 'lockForMapping', 'unlockTask', 'postTaskUpdate', 'cancelTasking');
var _taskingCache = {};
var _enabled = false;


function parseTask(that, json) {

    json = parseHOTTask(that, json);

    return json;


}


function parseProject(that, json) {

    json = parseHOTProject(json);

    return json;
}


var parsers = {

    manager: function(values) {
        var newManager = new taskingManager(values);

        return newManager;
    },

    // TODO: TAH - figure out call stack loop, then change task.minZoom() function


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

        var newProject = new taskingProject(_project);

        return newProject;
    },

    task: function(values) {

        // TODO: TAH - parse differently depending on manager (i.e., combine HOT task details from two API calls)

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

        var newTask = new taskingTask(_task);

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

    var regex = new RegExp(/(.+)\/api\/v1\/project\/(\d+)(?:\/task\/)?(\d+)?/);

    var captureGroups = regex.exec(path);

    var apiBase;
    var projectId;
    var taskId;

    if (captureGroups && captureGroups.length >= 3) {
        apiBase = captureGroups[1];
        projectId = parseInt(captureGroups[2], 10);

        if (captureGroups.length >= 4) {
            taskId = parseInt(captureGroups[3], 10);
        }
    }

    var urlType = taskId ? 'task' : projectId ? 'project' : undefined;
    var url_slugs = path.split('/');

    parsedUrl = {
        url: url,
        path: path,
        params: params,
        urlType: urlType,
        extension: extension,
        url_slugs: url_slugs,
        apiBase: apiBase,
        projectId: projectId,
        taskId: taskId
    };

    return parsedUrl;
}


function formulateUrl(that, parsedUrl, type) {

    var path;

    path = that.currentManager().apiBase + '/api/v1/project/' + parsedUrl.projectId; // TODO: TAH - remove apibase.local
    if (type === 'task' && parsedUrl.taskId) {
        path += '/task/' + parsedUrl.taskId;
    }
    path += '?as_file=false';

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
    return taskingManagers.map(function(manager) {
        return parsers.manager(manager);
    });
}


export default {


    enabled: function(val) {
        if (!arguments.length) return _enabled;

        _enabled = val;
    },


    init: function () {
        this.event = utilRebind(this, dispatch, 'on');

        var that = this;

        _taskingCache = {
            managers: initManagers(),
            projects: {},
            tasks: {},
            currentManager: null,
            currentProjectId: '',
            currentTaskId: '',
            customSettings: {},
            editsWhileTasking: false,
            errors: _errors,
        };

        // set starting manager
        that.currentManager(null);
    },


    reset: function() {
        var that = this;

        _taskingCache = {
            managers: initManagers(),
            projects: {},
            tasks: {},
            currentManager: null,
            currentProjectId: '',
            currentTaskId: '',
            customSettings: {},
            editsWhileTasking: false,
            errors: _errors,
        };

        // set starting manager
        that.currentManager(null);
    },


    managers: function() {
        return _taskingCache.managers;
    },


    getManager: function(id) {
        return _taskingCache.managers.find(function(manager) {
            return manager.id && manager.id === id;
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
                        if (!Object.keys(that.getTask(parsedUrl.taskId)).length) {
                            that.addTask(newTask); // add task to tasks
                        }

                        dispatch.call('change');
                    }


                })
                .catch(function(err) {
                    var { errors, message } = handleError(taskingTask, err, that.errors());

                    // update cache errors
                    that.errors(errors);

                    return message;
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
        try {
            var that = this;

            // var id = parsedUrl.manager;
            var projectId = parsedUrl.projectId;

            // load project if it hasn't been loaded
            if (!Object.keys(that.getProject(projectId)).length) {
                getData(formulateUrl(that, parsedUrl, 'project'))
                    .then(function(result) {
                        if (result) {

                            // reformulate result based on manager
                            var json = parseProject(that, result, parsedUrl);

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
                        var { errors, message } = handleError(taskingTask, err, that.errors());

                        // update cache errors
                        that.errors(errors);

                        return message;
                    });
            }
        } catch (error) {
            console.log('loadProject error: ', error);
        }
    },

    projects: function() {
        return _taskingCache.projects;
    },


    getProject: function(projectId) {
        return _taskingCache.projects[projectId] || {};
    },


    addProject: function(project) {
        _taskingCache.projects[project.id()] = project;
    },


    loadTask: function(parsedUrl) {
        try {
            var that = this;

            var taskId = parsedUrl.taskId;

            var _project = that.getProject(parsedUrl.projectId);

            // load project first if it hasn't been loaded
            if (!Object.keys(_project).length) {
                that.loadProject(parsedUrl);
                return;

            // if the project is loaded but not current, make current
            } else {
                that.currentProject(_project.id());
            }

            // load task if it hasn't been loaded
            if (!Object.keys(that.getTask(taskId)).length) {

                getData(formulateUrl(that, parsedUrl, 'task'))
                    .then(function(result) {
                        if (result) {

                            // reformulate result based on manager
                            var json = parseTask(that, result);

                            // create task
                            var newTask = parsers.task(json);

                            // add to tasks
                            that.addTask(newTask);

                            that.currentTask(newTask.id());

                            dispatch.call('loadedTask', {}, newTask);
                            dispatch.call('change');
                        }
                    })
                    .catch(function(err) {
                        var { errors, message } = handleError(taskingTask, err, that.errors());

                        // update cache errors
                        that.errors(errors);

                        return message;
                    });
            }
        } catch (error) {
            console.log('loadTask error: ', error);
        }
    },

    tasks: function() {
        return _taskingCache.tasks;
    },


    getTask: function(taskId) {
        return _taskingCache.tasks[taskId] || {};
    },


    replaceTask: function(t) {
        if (!(t instanceof taskingTask) || !t.id()) return;

        _taskingCache.tasks[t.id()] = t;

        return t;
    },


    removeTask: function(t) {
        if (!(t instanceof taskingTask) || !t.taskId) return;

        delete _taskingCache.tasks[t.taskId];
    },


    addTask: function(task) {
        _taskingCache.tasks[task.id()] = task;
    },


    customSettings: function(d) {
        var that = this;

        if (!arguments.length) return _taskingCache.customSettings;

        if (d.url) {
            var parsedUrl = parseUrl(d.url); // parse url,
            _taskingCache.customSettings = parsedUrl; //save custom settings
            if (parsedUrl && parsedUrl.apiBase) {
                var manager = _taskingCache.managers.find(function(manager) {
                    return manager.apiBase === parsedUrl.apiBase;
                });
                if (!manager) {
                    manager = new taskingManager({
                        apiBase: parsedUrl.apiBase
                    });
                    _taskingCache.managers.push(manager);
                }
                // set manager
                that.currentManager(manager);
            }
        }

        dispatch.call('loadedCustomSettings');

        return this;
    },


    cache: function() {
        return _taskingCache;
    },


    currentManager: function(manager) {
        var that = this;

        if (!arguments.length) return _taskingCache.currentManager;

        _taskingCache.currentManager = manager;

        dispatch.call('setManager');

        return this;
    },


    currentProject: function(id) {
        var that = this;

        if (!arguments.length) return that.getProject(_taskingCache.currentProjectId);

        _taskingCache.currentProjectId = id;

        dispatch.call('setProject');

        return this;
    },


    currentTask: function(id) {
        var that = this;

        if (!arguments.length) return that.getTask(_taskingCache.currentTaskId);

        _taskingCache.currentTaskId = id;

        dispatch.call('setTask');

        return this;
    },


    resetCurrentTask: function() {
        _taskingCache.currentTaskId = '';
    },


    resetCurrentProject: function() {
        _taskingCache.currentProjectId = '';
    },


    resetManager: function() {
        var that = this;

        that.currentManager(null);
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

    resetActiveErrors: function() {
        var that = this;

        var _errors = that.errors();

        // reset active errors
        for (var error in _errors) {
            _errors[error].active = false;
        }

        return this;
    },


    lockTaskForMapping: function(task) {
        var that = this;

        var manager = that.currentManager();

        if (!manager || !manager.apiBase) return;

        var _currProject = that.currentProject();
        var baseUrl = manager.apiBase + '/project/' + _currProject.id() + '/task/' + task.id() + '/';

        return postData(baseUrl, 'lock-for-mapping')
            .then(function(data) {

                // reformulate result based on manager
                var json = parseTask(that, data);

                // create task
                var updatedTask = parsers.task(json);

                that.replaceTask(updatedTask);

                // set task as current
                that.currentTask(updatedTask.id());

                dispatch.call('lockForMapping');

                return data;
            })
            .catch(function(err) {
                var { errors, message } = handleError(task, err, that.errors());

                // update cache errors
                that.errors(errors);

                // return message;
            });

    },


    unlockTask: function(task) {
        var that = this;

        var manager = that.currentManager();
        if (!manager || !manager.apiBase) return;

        var _currProject = that.currentProject();
        var baseUrl = manager.apiBase + '/project/' + _currProject.id() + '/task/' + task.id() + '/';
        var action = '';

        // body comment
        var _data = {
            'comment': 'mapping stopped before editing'
        };

        return postData(baseUrl, 'stop-mapping', _data)
            .then(function(data) {

                // reformulate result based on manager
                var json = parseTask(that, data);

                // create task
                var updatedTask = parsers.task(json);

                that.replaceTask(updatedTask);

                dispatch.call('unlockTask');

                return data;
            })
            .catch(function(err) {
                var { errors, message } = handleError(task, err, that.errors());

                // update cache errors
                that.errors(errors);

                // return message;
            });
    },


    postTaskUpdate: function(task) {
        var that = this;

        var _currTask = that.currentTask();
        if (task.id() !== _currTask.id()) return;

        var manager = that.currentManager();

        if (!manager || !manager.apiBase) return;

        var _currProject = that.currentProject();
        var baseUrl = manager.apiBase + '/project/' + _currProject.id() + '/task/' + task.id() + '/';

        var _data = {
            'comment': task.newComment,
            'status': task.newStatus.toUpperCase()
        };

        return postData(baseUrl, 'unlock-after-mapping', _data)
            .then(function(data) {

                // reformulate result based on manager
                var json = parseTask(that, data);

                // create task
                var updatedTask = parsers.task(json);

                that.replaceTask(updatedTask);

                dispatch.call('postTaskUpdate');

                return data;
            })
            .catch(function(err) {
                var { errors, message } = handleError(task, err, that.errors());

                // update cache errors
                that.errors(errors);

                // return message;
            });

    },


    cancelTasking: function() {
        var that = this;

        // unlock task
        that.unlockTask(that.currentTask())
            .then(function(unlockResponse) {
                return unlockResponse;
            })
            .catch(function(err) { console.log('unlockTask err: ', err ); });

        // reset current project and task
        that.resetCurrentProjectAndTask();

        dispatch.call('cancelTasking');
    }

};
