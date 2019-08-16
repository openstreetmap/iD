
import stringify from 'fast-json-stable-stringify';
import { utilHashcode, utilRebind } from '../../util';
import { t } from '../../util/locale';

import _filter from 'lodash-es/filter';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { text as d3_text } from 'd3-fetch';

import { task, project, manager } from '../../osm';
import { taskingManagers } from '../../../data';

import { parseHOTTask, parseHOTProject } from './parseHOT';
import { getData, postData } from './fetch_tm';
import { _errors, handleError } from './errors_tm';



var apibases = {
    local:  'http://127.0.0.1:5000/api/v1/', // TODO: TAH - change to list of real manager urls when published
    hot: 'https://tasks.hotosm.org/api/v1/',
};
var dispatch = d3_dispatch('change', 'loadedTask', 'loadedProject', 'loadedCustomSettings', 'setManager', 'setProject', 'setTask', 'cancelTasking');
var _taskingCache = {};
var _enabled = false;


function parseTask(that, json) {

    switch (that.currentManager().id) {
        case 'HOT':
            json = parseHOTTask(that, json);
            break;
        default:
            break;
    }

    return json;


}


function parseProject(that, json) {

    switch (that.currentManager().id) {
        case 'HOT':
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

        var newProject = new project(_project);

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

    // TODO: TAH - make manager an object, pull away from this parser, make sure in loadProject, getManager works to set manager!

    var managerSource = url_slugs[2];
    managerSource = managerSource === '127.0.0.1:5000' ? 'HOT' : managerSource; // TODO: TAH - remove once not working locally

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


function formulateUrl(that, parsedUrl, type) {

    var path;

    switch (that.currentManager().id) {
        case 'HOT':
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
    var _managers = taskingManagers.map(function(manager) {
        return parsers.manager(manager);
    });

    // add a none manager as default
    _managers.push(parsers.manager({
        id: 'none',
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

        _taskingCache = {
            managers: initManagers(),
            projects: {},
            tasks: {},
            currentManagerId: 'HOT',
            currentProjectId: '',
            currentTaskId: '',
            customSettings: {},
            editsWhileTasking: false,
            errors: _errors,
        };

        // set starting manager
        that.currentManager(that.getManager('none').id);
    },


    reset: function() {
        var that = this;

        _taskingCache = {
            managers: initManagers(),
            projects: {},
            tasks: {},
            currentManagerId: 'HOT',
            currentProjectId: '',
            currentTaskId: '',
            customSettings: {},
            editsWhileTasking: false,
            errors: _errors,
        };

        // set starting manager
        that.currentManager(that.getManager('none').id);
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
                    var { errors, message } = handleError(task, err, that.errors());

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
                    var { errors, message } = handleError(task, err, that.errors());

                    // update cache errors
                    that.errors(errors);

                    return message;
                });
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

        var that = this;

        var taskId = parsedUrl.taskId;
        var projectId = parsedUrl.projectId;

        // load project first if it hasn't been loaded
        if (!Object.keys(that.getProject(projectId)).length) {
            that.loadProject(parsedUrl);
            return;

        // if the project is loaded but not current, make current
        } else if (!that.currentProject().id === projectId) {
            that.currentProject(that.getProject(projectId));
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

                        dispatch.call('loadedTask', {}, newTask);
                        dispatch.call('change');
                    }
                })
                .catch(function(err) {
                    var { errors, message } = handleError(task, err, that.errors());

                    // update cache errors
                    that.errors(errors);

                    return message;
                });
        }
    },

    tasks: function() {
        return _taskingCache.tasks;
    },


    getTask: function(taskId) {
        return _taskingCache.tasks[taskId] || {};
    },


    replaceTask: function(t) {
        if (!(t instanceof task) || !t.id()) return;

        _taskingCache.tasks[t.id()] = t;

        return t;
    },


    removeTask: function(t) {
        if (!(t instanceof task) || !t.taskId) return;

        delete _taskingCache.tasks[t.taskId];
    },


    addTask: function(task) {
        _taskingCache.tasks[task.id()] = task;
    },


    lockTaskForMapping: function(task) {
        var that = this;

        var _currProject = that.currentProject();
        var baseUrl = apibases.local + 'project/' + _currProject.id() + '/task/' + task.id() + '/';
        var action = '';

        switch (that.currentManager().id) {

            case 'HOT':
                action = 'lock-for-mapping';
                break;
            default:
                break;
        }

        return postData(baseUrl, action)
            .then(function(data) {

                // reformulate result based on manager
                var json = parseTask(that, data);

                // create task
                var updatedTask = parsers.task(json);

                that.replaceTask(updatedTask);

                // set task as current
                that.currentTask(updatedTask.id());

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

        var _currProject = that.currentProject();
        var baseUrl = apibases.local + 'project/' + _currProject.id() + '/task/' + task.id() + '/';
        var action = '';

        switch (that.currentManager().id) {

            case 'HOT':
                action = 'stop-mapping';
                break;
            default:
                break;
        }

        // body comment
        var _data = {
            'comment': 'mapping stopped before editing'
        };

        return postData(baseUrl, action, _data)
            .then(function(data) {

                // reformulate result based on manager
                var json = parseTask(that, data);

                // create task
                var updatedTask = parsers.task(json);

                that.replaceTask(updatedTask);

                return data;
            })
            .catch(function(err) {
                var { errors, message } = handleError(task, err, that.errors());

                // update cache errors
                that.errors(errors);

                // return message;
            });
    },


    customSettings: function(d) {
        var that = this;

        if (!arguments.length) return _taskingCache.customSettings;

        if (d.url) {
            var parsedUrl = parseUrl(d.url); // parse url,
            _taskingCache.customSettings = parsedUrl; //save custom settings
            if (parsedUrl.managerSource) {
                // set manager
                that.currentManager(parsedUrl.managerSource);
            }
        }

        dispatch.call('loadedCustomSettings');

        return this;
    },


    cache: function() {
        return _taskingCache;
    },


    currentManager: function(id) {
        var that = this;

        if (!arguments.length) return that.getManager(_taskingCache.currentManagerId);

        _taskingCache.currentManagerId = id;

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

        that.currentManager(that.getManager('none').id);
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


    postTaskUpdate: function() {
        console.log('TODO: postTaskUpdate');
    },


    cancelTasking: function() {
        var that = this;

        // unlock task
        that.unlockTask(that.currentTask())
            .then(function(unlockResponse) {
                console.log('unlock response: ', unlockResponse);
            })
            .catch(function(err) { console.log('unlockTask err: ', err ); });

        // reset current project and task
        that.resetCurrentProjectAndTask();

        dispatch.call('cancelTasking');
    }

};
