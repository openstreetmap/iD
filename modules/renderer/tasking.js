import _filter from 'lodash-es/filter';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json, text as d3_text } from 'd3-fetch';

import { rendererTaskingManager } from './tasking_manager';
import { taskingProject, taskingTask } from './taskingObjects';

import { managers } from '../../data/taskingManagers.json';
import { utilRebind } from '../util/rebind';
import { services } from '../services';

import rbush from 'rbush';

var apibase = 'http://127.0.0.1:5000/api/v1/'; // TODO: TAH - change to real url when published


var parsers = {

    project: function parseProject(json) {
        var project = new taskingProject(json);

        return project;
    },

    task: function parseTask(json) {
        var task = new taskingTask(json);

        return task;
    }
};


function getUrlManager(path) {
    return managers.find(function(manager) {
        return path.includes(manager.urlRoot);
    });
}


function parseUrl(url) {
    var parsedUrl = {};

    // split url into path and params
    var splitUrl = url.split('?');
    parsedUrl.path = splitUrl[0];
    parsedUrl.params = splitUrl[1];
    parsedUrl.manager = getUrlManager(parsedUrl.path);

    // TODO: TAH - get finish regex to get url type
    var project_re = new RegExp(/http:\/\/127.0.0.1:5000\/api\/v1\/project\/[0-9]/);
    var task_re = new RegExp(/http:\/\/127.0.0.1:5000\/api\/v1\/project\/[0-9]+\/task\/[0-9]+$/);

    var _project = project_re.test(parsedUrl.path);
    var _task = task_re.test(parsedUrl.path);

    parsedUrl.urlType = _task ? 'task' : _project ? 'project' : undefined;
    parsedUrl.url_slugs = url.split('?')[0].split('/');


    if (_task) {
        parsedUrl.taskId = parsedUrl.url_slugs[parsedUrl.url_slugs.length - 1];
    }

    if (_project) {
        if (_task) {
            parsedUrl.projectId = parseInt(parsedUrl.url_slugs[parsedUrl.url_slugs.length - 3], 10);
        } else {
            parsedUrl.projectId = parseInt(parsedUrl.url_slugs[parsedUrl.url_slugs.length - 1], 10);
        }
    }

    return parsedUrl;
}


export function rendererTasking(context) {
    var dispatch = d3_dispatch('loaded', 'loadedProject', 'loadedTask', 'loadedTasks', 'change', 'redraw');
    var tasking = utilRebind({}, dispatch, 'on');

    var _taskingCache;

    var _enabled = false;

    var _customSettings = {
        template: ''
    };


    tasking.enabled = function() {
        return _enabled;
    };


    tasking.init = function() {

        _taskingCache = {
            managers: [],
            currentManager: {},
            projects: [],
            currentProject: {},
            tasks: [],
            currentTask: {},
            customUrl: {}
        };


        // Add all the available tasking manager sources
        _taskingCache.managers = managers.map(function(source) {
            return rendererTaskingManager(source);
        });
        // Add 'Custom'
        _taskingCache.managers.push(rendererTaskingManager.Custom());
        // Add 'None'
        _taskingCache.managers.push(rendererTaskingManager.None());

        // set none as starting manager
        tasking.currentManager(rendererTaskingManager.None());

    };


    tasking.reset = function() {
        _taskingCache = {
            managers: [],
            currentManager: {},
            projects: [],
            currentProject: {},
            tasks: [],
            currentTask: {},
            customUrl: {}
        };

        // set none as starting manager
        tasking.currentManager(rendererTaskingManager.None());
    };


    tasking.customSettings = function(d) {
        if (!arguments.length) return _customSettings;

        _customSettings = d;

        return tasking;
    };


    tasking.loadFromURL = function(url) {
        var that = this;

        // parse url to get type, project, and task (if present)
        var parsedUrl = parseUrl(url);

        // set in cache
        _taskingCache.customUrl = parsedUrl;

        switch (parsedUrl.urlType) {
            case 'task':
                that.loadProject();
                break;
            case 'project':
                that.loadProject();
                break;
            case undefined:
                console.log('undefined url result: ', parsedUrl); // TODO: TAH - better handling of urlType
                break;
            default:
                break;
        }
    };


    tasking.resetCustomUrl = function() {
        _taskingCache.customUrl = {};
    };


    tasking.cache = function() {
        return _taskingCache;
    };


    /* Managers */
    tasking.managers = function() {
        return _taskingCache.managers;
    };


    tasking.getManager = function(id) {
        return _taskingCache.managers.find(function(d) {
            return d.id && d.id === id;
        });
    };


    tasking.currentManager = function(d) {
        if (!arguments.length) return _taskingCache.currentManager;

        _enabled = d !== tasking.getManager('none');

        _taskingCache.currentManager = d;
        dispatch.call('change');
        dispatch.call('redraw');

        return tasking;
    };


    tasking.currentManagerId = function() {
        return _taskingCache.currentManager.id;
    };


    tasking.resetManager = function () {
        _taskingCache.currentManager = {};
    };


    /* Projects */
    tasking.projects = function() {
        return _taskingCache.projects;
    };


    tasking.currentProject = function(d) {
        if (!arguments.length) return _taskingCache.currentProject;

        // TODO: TAH - handle enabled/disabled

        _taskingCache.currentProject = d;

        dispatch.call('change');
        dispatch.call('redraw');

        return tasking;
    };


    tasking.currentProjectId = function() {
        return _taskingCache.currentProject.projectId;
    };


    tasking.resetProject = function() {
        _taskingCache.currentProject = {};
    };


    tasking.loadProject = function() {

        var that = this;

        var projectId = _taskingCache.customUrl.projectId;

        var path = 'project/' + projectId + '?as_file=false';

        var url = apibase + path;
        d3_text(url)
            .then(function(result) {
                if (result) {

                    // parse project
                    var json = JSON.parse(result);
                    var parsedProject = parsers.project(json);

                    // add to projects array
                    _taskingCache.projects.push(parsedProject); // TODO: TAH - cache geojson tasks as well

                    // set as currentProject
                    that.currentProject(parsedProject);

                    dispatch.call('loadedProject');
                }

                // also load task if requested
                if (_taskingCache.customUrl.urlType === 'task') {
                    that.loadTask();
                }
            })
            .catch(function(err) {
                console.log('loadTask error: ', err); // TODO: TAH - better handling of errors
            });
    };


    tasking.getProject = function(id) {
        return _taskingCache.projects.find(function(project) {
            return project.projectId && project.projectId === id;
        });
    };


    /* Tasks */
    tasking.tasks = function() {
        return _taskingCache.tasks;
    };


    tasking.currentTask = function(d) {
        if (!arguments.length) return _taskingCache.currentTask;

        // TODO: TAH - handle enabled/disabled

        _taskingCache.currentTask = d;

        dispatch.call('change');
        dispatch.call('redraw');

        return tasking;
    };


    tasking.currentTaskId = function() {
        return _taskingCache.currentTask.taskId;
    };


    tasking.resetTask = function() {
        _taskingCache.currentTask = {};
    };


    tasking.loadTask = function() {

        var that = this;

        var projectId = _taskingCache.customUrl.projectId;
        var taskId = _taskingCache.customUrl.taskId;

        function combineTaskDetails(projectId, json) {

            function getTaskGeoJSON(projectId, taskId) {

                var _project = that.currentProject() || that.getProject(projectId);
                if (!_project) return;

                if (_project && _project.tasks && _project.tasks.features && _project.tasks.features.length) {
                    var features = _project.tasks.features;

                    // get the task geometry
                    var taskGeoJSON = _filter(features, function(feature) { return feature.properties.taskId === taskId; })[0];

                    return taskGeoJSON;
                }
            }

            if (that.currentManager().id === 'HOT' || (that.currentManager().id === 'custom' && _taskingCache.customUrl.manager.id === 'HOT')) {
                var taskGeoJSON = getTaskGeoJSON(projectId, json.taskId);

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

                return taskGeoJSON;
            }
            return '';
        }

        // load task if it hasn't ben loaded
        if (!that.getTask(taskId)) {
            var path = 'project/' + projectId + '/task/' + taskId + '?as_file=false';

            var url = apibase + path;
            d3_text(url)
                .then(function(result) {
                    if (result) {

                        // parse task
                        var json = combineTaskDetails(projectId, JSON.parse(result));
                        var parsedTask = parsers.task(json);

                        // add to tasks
                        _taskingCache.tasks.push(parsedTask);

                        // set as current task
                        _taskingCache.currentTask = parsedTask;

                        dispatch.call('loadedTask');
                    }
                })
                .catch(function(err) {
                    console.log('loadTask error: ', err); // TODO: TAH - better handling of errors
                });
        } else {
            // set task if it has already been loaded
            that.currentTask(that.getTask(taskId));

            // TODO: TAH - figure out if I need the next lines
            // if (_taskingCache.task[taskId]) {
            //     dispatch.call('loadedTask');
            // }
        }
    };


    tasking.getTask = function(id) {
        return _taskingCache.tasks.find(function(task) {
            return task.taskId && task.taskId === id;
        });
    };


    tasking.resetProjectAndTask = function() {
        tasking.resetProject();
        tasking.resetTask();
    };


    return tasking;
}