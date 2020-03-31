import { dispatch as d3_dispatch } from 'd3-dispatch';

import { fileFetcher } from './file_fetcher';
import { actionDiscardTags } from '../actions/discard_tags';
import { actionMergeRemoteChanges } from '../actions/merge_remote_changes';
import { actionNoop } from '../actions/noop';
import { actionRevert } from '../actions/revert';
import { coreGraph } from '../core/graph';
import { t } from '../core/localizer';
import { utilArrayUnion, utilArrayUniq, utilDisplayName, utilDisplayType, utilRebind } from '../util';


export function coreUploader(context) {

    var dispatch = d3_dispatch(
        // Start and end events are dispatched exactly once each per legitimate outside call to `save`
        'saveStarted', // dispatched as soon as a call to `save` has been deemed legitimate
        'saveEnded',   // dispatched after the result event has been dispatched

        'willAttemptUpload', // dispatched before the actual upload call occurs, if it will
        'progressChanged',

        // Each save results in one of these outcomes:
        'resultNoChanges', // upload wasn't attempted since there were no edits
        'resultErrors',    // upload failed due to errors
        'resultConflicts', // upload failed due to data conflicts
        'resultSuccess'    // upload completed without errors
    );

    var _isSaving = false;

    var _conflicts = [];
    var _errors = [];
    var _origChanges;

    var _discardTags = {};
    fileFetcher.get('discarded')
        .then(function(d) { _discardTags = d; })
        .catch(function() { /* ignore */ });

    var uploader = utilRebind({}, dispatch, 'on');

    uploader.isSaving = function() {
        return _isSaving;
    };

    uploader.save = function(changeset, tryAgain, checkConflicts) {
        // Guard against accidentally entering save code twice - #4641
        if (_isSaving && !tryAgain) {
            return;
        }

        var osm = context.connection();
        if (!osm) return;

        // If user somehow got logged out mid-save, try to reauthenticate..
        // This can happen if they were logged in from before, but the tokens are no longer valid.
        if (!osm.authenticated()) {
            osm.authenticate(function(err) {
                if (!err) {
                    uploader.save(changeset, tryAgain, checkConflicts);  // continue where we left off..
                }
            });
            return;
        }

        if (!_isSaving) {
            _isSaving = true;
            dispatch.call('saveStarted', this);
        }

        var history = context.history();

        _conflicts = [];
        _errors = [];

        // Store original changes, in case user wants to download them as an .osc file
        _origChanges = history.changes(actionDiscardTags(history.difference(), _discardTags));

        // First time, `history.perform` a no-op action.
        // Any conflict resolutions will be done as `history.replace`
        // Remember to pop this later if needed
        if (!tryAgain) {
            history.perform(actionNoop());
        }

        // Attempt a fast upload.. If there are conflicts, re-enter with `checkConflicts = true`
        if (!checkConflicts) {
            upload(changeset);

        // Do the full (slow) conflict check..
        } else {
            performFullConflictCheck(changeset);
        }

    };


    function performFullConflictCheck(changeset) {

        var osm = context.connection();
        if (!osm) return;

        var history = context.history();

        var localGraph = context.graph();
        var remoteGraph = coreGraph(history.base(), true);

        var summary = history.difference().summary();
        var _toCheck = [];
        for (var i = 0; i < summary.length; i++) {
            var item = summary[i];
            if (item.changeType === 'modified') {
                _toCheck.push(item.entity.id);
            }
        }

        var _toLoad = withChildNodes(_toCheck, localGraph);
        var _loaded = {};
        var _toLoadCount = 0;
        var _toLoadTotal = _toLoad.length;

        if (_toCheck.length) {
            dispatch.call('progressChanged', this, _toLoadCount, _toLoadTotal);
            _toLoad.forEach(function(id) { _loaded[id] = false; });
            osm.loadMultiple(_toLoad, loaded);
        } else {
            upload(changeset);
        }

        return;

        function withChildNodes(ids, graph) {
            var s = new Set(ids);
            ids.forEach(function(id) {
                var entity = graph.entity(id);
                if (entity.type !== 'way') return;

                graph.childNodes(entity).forEach(function(child) {
                    if (child.version !== undefined) {
                        s.add(child.id);
                    }
                });
            });

            return Array.from(s);
        }


        // Reload modified entities into an alternate graph and check for conflicts..
        function loaded(err, result) {
            if (_errors.length) return;

            if (err) {
                _errors.push({
                    msg: err.message || err.responseText,
                    details: [ t('save.status_code', { code: err.status }) ]
                });
                didResultInErrors();

            } else {
                var loadMore = [];

                result.data.forEach(function(entity) {
                    remoteGraph.replace(entity);
                    _loaded[entity.id] = true;
                    _toLoad = _toLoad.filter(function(val) { return val !== entity.id; });

                    if (!entity.visible) return;

                    // Because loadMultiple doesn't download /full like loadEntity,
                    // need to also load children that aren't already being checked..
                    var i, id;
                    if (entity.type === 'way') {
                        for (i = 0; i < entity.nodes.length; i++) {
                            id = entity.nodes[i];
                            if (_loaded[id] === undefined) {
                                _loaded[id] = false;
                                loadMore.push(id);
                            }
                        }
                    } else if (entity.type === 'relation' && entity.isMultipolygon()) {
                        for (i = 0; i < entity.members.length; i++) {
                            id = entity.members[i].id;
                            if (_loaded[id] === undefined) {
                                _loaded[id] = false;
                                loadMore.push(id);
                            }
                        }
                    }
                });

                _toLoadCount += result.data.length;
                _toLoadTotal += loadMore.length;
                dispatch.call('progressChanged', this, _toLoadCount, _toLoadTotal);

                if (loadMore.length) {
                    _toLoad.push.apply(_toLoad, loadMore);
                    osm.loadMultiple(loadMore, loaded);
                }

                if (!_toLoad.length) {
                    detectConflicts();
                    upload(changeset);
                }
            }
        }


        function detectConflicts() {
            function choice(id, text, action) {
                return {
                    id: id,
                    text: text,
                    action: function() {
                        history.replace(action);
                    }
                };
            }
            function formatUser(d) {
                return '<a href="' + osm.userURL(d) + '" target="_blank">' + d + '</a>';
            }
            function entityName(entity) {
                return utilDisplayName(entity) || (utilDisplayType(entity.id) + ' ' + entity.id);
            }

            function sameVersions(local, remote) {
                if (local.version !== remote.version) return false;

                if (local.type === 'way') {
                    var children = utilArrayUnion(local.nodes, remote.nodes);
                    for (var i = 0; i < children.length; i++) {
                        var a = localGraph.hasEntity(children[i]);
                        var b = remoteGraph.hasEntity(children[i]);
                        if (a && b && a.version !== b.version) return false;
                    }
                }

                return true;
            }

            _toCheck.forEach(function(id) {
                var local = localGraph.entity(id);
                var remote = remoteGraph.entity(id);

                if (sameVersions(local, remote)) return;

                var merge = actionMergeRemoteChanges(id, localGraph, remoteGraph, _discardTags, formatUser);

                history.replace(merge);

                var mergeConflicts = merge.conflicts();
                if (!mergeConflicts.length) return;  // merged safely

                var forceLocal = actionMergeRemoteChanges(id, localGraph, remoteGraph, _discardTags).withOption('force_local');
                var forceRemote = actionMergeRemoteChanges(id, localGraph, remoteGraph, _discardTags).withOption('force_remote');
                var keepMine = t('save.conflict.' + (remote.visible ? 'keep_local' : 'restore'));
                var keepTheirs = t('save.conflict.' + (remote.visible ? 'keep_remote' : 'delete'));

                _conflicts.push({
                    id: id,
                    name: entityName(local),
                    details: mergeConflicts,
                    chosen: 1,
                    choices: [
                        choice(id, keepMine, forceLocal),
                        choice(id, keepTheirs, forceRemote)
                    ]
                });
            });
        }
    }


    function upload(changeset) {
        var osm = context.connection();
        if (!osm) {
            _errors.push({ msg: 'No OSM Service' });
        }

        if (_conflicts.length) {
            didResultInConflicts(changeset);

        } else if (_errors.length) {
            didResultInErrors();

        } else {
            var history = context.history();
            var changes = history.changes(actionDiscardTags(history.difference(), _discardTags));
            if (changes.modified.length || changes.created.length || changes.deleted.length) {

                dispatch.call('willAttemptUpload', this);

                osm.putChangeset(changeset, changes, uploadCallback);

            } else {
                // changes were insignificant or reverted by user
                didResultInNoChanges();
            }
        }
    }


    function uploadCallback(err, changeset) {
        if (err) {
            if (err.status === 409) {  // 409 Conflict
                uploader.save(changeset, true, true);  // tryAgain = true, checkConflicts = true
            } else {
                _errors.push({
                    msg: err.message || err.responseText,
                    details: [ t('save.status_code', { code: err.status }) ]
                });
                didResultInErrors();
            }

        } else {
            didResultInSuccess(changeset);
        }
    }

    function didResultInNoChanges() {

        dispatch.call('resultNoChanges', this);

        endSave();

        context.flush(); // reset iD
    }

    function didResultInErrors() {

        context.history().pop();

        dispatch.call('resultErrors', this, _errors);

        endSave();
    }


    function didResultInConflicts(changeset) {

        _conflicts.sort(function(a, b) { return b.id.localeCompare(a.id); });

        dispatch.call('resultConflicts', this, changeset, _conflicts, _origChanges);

        endSave();
    }


    function didResultInSuccess(changeset) {

        // delete the edit stack cached to local storage
        context.history().clearSaved();

        dispatch.call('resultSuccess', this, changeset);

        // Add delay to allow for postgres replication #1646 #2678
        window.setTimeout(function() {

            endSave();

            context.flush(); // reset iD
        }, 2500);
    }


    function endSave() {
        _isSaving = false;

        dispatch.call('saveEnded', this);
    }


    uploader.cancelConflictResolution = function() {
        context.history().pop();
    };


    uploader.processResolvedConflicts = function(changeset) {
        var history = context.history();

        for (var i = 0; i < _conflicts.length; i++) {
            if (_conflicts[i].chosen === 1) {  // user chose "use theirs"
                var entity = context.hasEntity(_conflicts[i].id);
                if (entity && entity.type === 'way') {
                    var children = utilArrayUniq(entity.nodes);
                    for (var j = 0; j < children.length; j++) {
                        history.replace(actionRevert(children[j]));
                    }
                }
                history.replace(actionRevert(_conflicts[i].id));
            }
        }

        uploader.save(changeset, true, false);  // tryAgain = true, checkConflicts = false
    };


    uploader.reset = function() {

    };


    return uploader;
}
