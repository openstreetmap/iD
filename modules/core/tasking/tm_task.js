import { geoExtent } from '../../geo';
import { getData, postData } from './fetch_tm';

var historyActions = {
    'STATE_CHANGE': 'stateChange',
    'COMMENT': 'comment',
    'LOCKED_FOR_MAPPING': 'lockedForMapping',
    'AUTO_UNLOCKED_FOR_MAPPING': 'autoUnlockedForMapping',
    'LOCKED_FOR_VALIDATION': 'lockedForValidation',
    'AUTO_UNLOCKED_FOR_VALIDATION': 'autoUnlockedForValidation'
};

var statuses = {
    'READY': 'ready',
    'MAPPED': 'mapped',
    'VALIDATED': 'validated',
    'INVALIDATED': 'invalidated',
    'BADIMAGERY': 'badimagery',
    'LOCKED_FOR_MAPPING': 'lockedForMapping',
    'LOCKED_FOR_VALIDATION': 'lockedForValidation'
};

/* Constants */
var editableBufferFactor = 10; // percent buffer around tmTask for curtain
var MIN_ZOOM = 14;

export function tmTask() {
    if (!(this instanceof tmTask)) {
        var task = new tmTask();
        return task.initialize.apply(task, arguments);
    } else if (arguments.length) {
        this.initialize.apply(this, arguments);
    }
}


Object.assign(tmTask.prototype, {

    type: 'tmTask',

    initialize: function(source) {

        this.id = source.id;
        this.tasker = source.tasker;
        this.project = source.project;
        this.geoJsonGeometry = source.geoJsonFeature.geometry;
        var geoJsonProps = source.geoJsonFeature.properties;
        this.status = statuses[geoJsonProps.taskStatus];
        this.isSquare = geoJsonProps.taskIsSquare;

        // calculate extent
        var coords = this.geoJsonGeometry.coordinates[0][0];
        var maxLon = -Number.MAX_VALUE, minLon = Number.MAX_VALUE,
            maxLat = -Number.MAX_VALUE, minLat = Number.MAX_VALUE;
        coords.forEach(function(coord) {
            if (coord[0] < minLon) minLon = coord[0];
            if (coord[0] > maxLon) maxLon = coord[0];
            if (coord[1] < minLat) minLat = coord[1];
            if (coord[1] > maxLat) maxLat = coord[1];
        });

        this.extent = new geoExtent([minLon, minLat], [maxLon, maxLat]);

        // calculate center
        this.center = this.extent.center();

        // allow editing a small margin beyond the task bounds
        this.editableExtent = (new geoExtent(this.extent)).padByPercent(editableBufferFactor);

        // set starting minimum zoom
        this._minZoom = MIN_ZOOM;

        return this;
    },

    uid: function() {
        return this.tasker.apiBase + '/' + this.project.id + '/' + this.id;
    },

    geoJsonFeature: function() {
        return {
            id: this.uid(),
            type: 'Feature',
            geometry: this.geoJsonGeometry,
            properties: {}
        };
    },

    loadFromRemote: function(onCompletion) {
        try {
            var that = this;
            getData(that.tasker.apiBase + '/api/v1/project/' + that.project.id + '/task/' + that.id)
                .then(function(result) {
                    if (!result) return;
                    that.parseRemoteResult(result);
                    if (onCompletion) onCompletion(that);
                })
                .catch(function(err) {
                    //var { errors, message } = handleError(tmTask, err, that.errors());

                    // update cache errors
                    //that.errors(errors);

                    //return message;
                });
        } catch (error) {
            console.log('loadTask error: ', error);
        }
    },

    parseRemoteResult: function(result) {
        this.status = statuses[result.taskStatus];
        this.instructions = result.perTaskInstructions;
        this.annotation = result.taskAnnotation;
        this.isUndoable = result.isUndoable;
        this.autoUnlockSeconds = result.autoUnlockSeconds;
        this.lockHolder = result.lockHolder; // only present if has a locked status

        this.historyStack = result.taskHistory.map(function(element) {
            var history = {};
            history.id = element.historyId;
            history.action = historyActions[element.action];
            history.text = element.actionText;
            history.date = new Date(element.actionDate);
            history.userId = element.actionBy;
            return history;
        });
    },

    minZoom: function(extentZoom) {
        if (!extentZoom || !arguments.length && !isNaN(extentZoom)) return this._minZoom;

        this._minZoom = extentZoom; // Math.floor(extentZoom) - MIN_ZOOM_PAD;

        return this._minZoom;
    },
/*
    lock: function(user) {

        var canLock = this.status !== 'locked'  && user.permissions.includes(this.status); // TODO: TAH - get user permissions

        if (canLock) {
            this.locked = true;
            this.status = 'lockedByYou';
        }

        return this;
    },

    unlock: function(status) {
        this.locked = false;
        this.status = status; // TODO: TAH - set status based on what user was doing & if they completed it
    },
*/
    lockTaskForMapping: function() {

        var baseUrl = this.tasker.apiBase + '/project/' + this.project.id + '/task/' + this.id + '/';

        var that = this;
        postData(baseUrl, 'lock-for-mapping')
            .then(function(result) {
                if (result) that.parseRemoteResult(result);
            })
            .catch(function(err) {
                //var { errors, message } = handleError(task, err, that.errors());

                // update cache errors
                //that.errors(errors);

                // return message;
            });

    },

    unlockTask: function() {

        var baseUrl = this.tasker.apiBase + '/project/' + this.project.id + '/task/' + this.id + '/';

        // body comment
        var _data = {
            'comment': 'mapping stopped before editing'
        };

        var that = this;
        postData(baseUrl, 'stop-mapping', _data)
            .then(function(result) {
                if (result) that.parseRemoteResult(result);
            })
            .catch(function(err) {
                //var { errors, message } = handleError(task, err, that.errors());

                // update cache errors
                //that.errors(errors);

                // return message;
            });
    },


    postTaskUpdate: function() {

        var baseUrl = this.tasker.apiBase + '/project/' + this.project.id + '/task/' + this.id + '/';

        var _data = {
            'comment': this.newComment,
            'status': this.newStatus.toUpperCase()
        };

        var that = this;
        postData(baseUrl, 'unlock-after-mapping', _data)
            .then(function(result) {
                if (result) that.parseRemoteResult(result);
            })
            .catch(function(err) {
                //var { errors, message } = handleError(task, err, that.errors());

                // update cache errors
                //that.errors(errors);

                // return message;
            });
    }

});
