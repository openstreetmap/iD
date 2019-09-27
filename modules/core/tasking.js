
import { utilRebind, utilStringQs } from '../util';
import { dispatch as d3_dispatch } from 'd3-dispatch';

import { tmTasker } from './tasking/tm_tasker';
import { _errors } from './tasking/errors_tm';

export function coreTasking(context) {

    var dispatch = d3_dispatch('change', 'loadedTask', 'loadedProject', 'loadedCustomSettings', 'setTasker', 'setProject', 'setTask', 'lockForMapping', 'unlockTask', 'postTaskUpdate', 'cancelTasking');
    var _taskingCache = {};
    var _enabled = false;

    var tasking = {};

    tasking.enabled = function(val) {
        if (!arguments.length) return _enabled;

        _enabled = val;
    };

    tasking.init = function () {
        this.reset();

        var taskingParameter = utilStringQs(window.location.hash).tasking;
        if (taskingParameter) {
            tasking.loadFromUrl(taskingParameter);
        }
    };

    tasking.reset = function() {
        _taskingCache = {
            taskers: [],
            activeTasker: null,
            activeProject: null,
            activeTask: null,
            customSettings: {},
            editsWhileTasking: false,
            errors: _errors,
        };
    };

    tasking.taskers = function() {
        return _taskingCache.taskers;
    };

    tasking.getTasker = function(id) {
        return _taskingCache.taskers.find(function(tasker) {
            return tasker.id && tasker.id === id;
        });
    };

/*
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

        // if the url is to a tasking tasker api endpoint
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
*/
    tasking.loadFromUrl = function(url) {
        var parsedUrl = parseUrl(url); // parse url,
        _taskingCache.customSettings = parsedUrl; //save custom settings
        this.loadFromCustomSettings(parsedUrl);
        dispatch.call('loadedCustomSettings');
    };

    tasking.customSettings = function(d) {

        if (!arguments.length) return _taskingCache.customSettings;

        if (d.url) {
            // sets _taskingCache.customSettings
            tasking.loadFromUrl(d.url);
        }

        return this;
    };

    tasking.loadFromCustomSettings = function(parsedUrl) {

        if (!parsedUrl || !parsedUrl.apiBase) {
            that.activeTasker(null);
            return;
        }

        var tasker = _taskingCache.taskers.find(function(tasker) {
            return tasker.apiBase === parsedUrl.apiBase;
        });
        if (!tasker) {
            tasker = new tmTasker({
                apiBase: parsedUrl.apiBase
            });
            _taskingCache.taskers.push(tasker);
        }

        this.activeTasker(tasker);

        if (!parsedUrl.projectId) return;

        var that = this;
        tasker.loadProject(parsedUrl.projectId, function(project) {
            that.activeProject(project);

            if (!parsedUrl.taskId) return;

            project.loadTask(parsedUrl.taskId, function(task) {
                that.activeTask(task);
            });
        });
    };

    tasking.activeTasker = function(tasker) {

        if (!arguments.length) return _taskingCache.activeTasker;

        _taskingCache.activeTasker = tasker;

        var activeProject = this.activeProject();
        if (activeProject && activeProject.tasker !== tasker) {
            // sync project to tasker
            this.activeProject(null);
        }

        dispatch.call('setTasker');

        return this;
    };

    tasking.activeProject = function(project) {
        if (!arguments.length) return _taskingCache.activeProject;

        _taskingCache.activeProject = project;

        if (project && this.activeTasker() !== project.tasker) {
            // sync tasker to project
            this.activeTasker(project.tasker);
        }
        var activeTask = this.activeTask();
        if (activeTask && activeTask.project !== project) {
            // sync task to project
            this.activeTask(null);
        }

        dispatch.call('setProject');

        return this;
    };

    tasking.activeTask = function(task) {

        if (!arguments.length) return _taskingCache.activeTask;

        _taskingCache.activeTask = task;

        if (task && this.activeProject() !== task.project) {
            // sync project to task
            this.activeProject(task.project);
        }

        dispatch.call('setTask');

        return this;
    };

    tasking.edits = function(val) {
        if (!arguments.length) return _taskingCache.editsWhileTasking;

        _taskingCache.editsWhileTasking = val;

        return this;
    };

    tasking.errors = function(val) {
        if (!arguments.length) return _taskingCache.errors;

        _taskingCache.errors = val;

        return this;
    };

    tasking.resetActiveErrors = function() {
        var _errors = this.errors();

        // reset active errors
        for (var error in _errors) {
            _errors[error].active = false;
        }

        return this;
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

        var urlSlugs = path.split('/');

        parsedUrl = {
            url: url,
            path: path,
            params: params,
            extension: extension,
            url_slugs: urlSlugs,
            apiBase: apiBase,
            projectId: projectId,
            taskId: taskId
        };

        return parsedUrl;
    }

    return utilRebind(tasking, dispatch, 'on');
}
