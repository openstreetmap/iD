import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json } from 'd3-fetch';

import rbush from 'rbush';

var dispatch = d3_dispatch('loadedTask');

var apibase = 'http://127.0.0.1:5000/api/v1/'; // TODO: change to real url when published
var _tasksCache;


export default {

    init: function() {
        _tasksCache = {
            task: [],
            tasks: rbush()
        };
    },

    reset: function() {
        _tasksCache = {
            task: [],
            tasks: rbush()
        };
    },

    loadTask: function(project_id, task_id) {

        var that = this;
        var path = 'projects/' + project_id + '/task/' + task_id + '?as_file=false';

        var url = apibase + path;
        d3_json(url)
        .then(function(err, result) {
            if (!err) {
                _tasksCache.task[task_id] = result;
                console.log(_tasksCache);
            }
            dispatch.call('loadedTask');
        })
        .catch(function(err) {
            console.log('loadTask error: ', err) // TODO: better handling of errors
        });
    }

};
