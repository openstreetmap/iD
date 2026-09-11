import { dispatch as d3_dispatch } from 'd3-dispatch';

import { fileFetcher } from './file_fetcher';
import { actionDiscardTags } from '../actions/discard_tags';
import { actionMergeRemoteChanges } from '../actions/merge_remote_changes';
import { actionNoop } from '../actions/noop';
import { actionRevert } from '../actions/revert';
import { coreGraph } from './graph';
import { t } from './localizer';
import { utilArrayUnion, utilDisplayName, utilDisplayType, utilRebind } from '../util';
import type { coreContext } from './context';
import type { EntityId, osmChangeset, OsmEntity } from '../osm';
import type { Action } from './history';
import type { OsmChange } from '../osm/changeset';
import type { Discarded } from '@openstreetmap/id-tagging-schema';
import { rebaseRemoteChangesIntoBaseGraph } from './rebaser';


export enum ConflictChoiceType {
    KEEP_LOCAL = 0,
    KEEP_REMOTE = 1,
}

export interface Choice {
    choiceType: ConflictChoiceType;
    id: EntityId;
    text: string;
    action(): void;
}

export interface Conflict {
    id: EntityId;
    name: string;
    details: d3.Selector[];
    chosen: ConflictChoiceType;
    choices: Choice[];
}

export interface ConflictError {
    msg: string;
    details?: string[];
}

interface EventMap {
    saveStarted: [];
    saveEnded: [];

    willAttemptUpload: [];
    progressChanged: [current: number, total: number];

    resultNoChanges: [];
    resultErrors: [errors: ConflictError[]];
    resultConflicts: [changeset: osmChangeset, conflicts: Conflict[], origChanges: OsmChange | undefined];
    resultSuccess: [changeset: osmChangeset];
}

export function coreUploader(context: coreContext) {

    const dispatch = d3_dispatch<object, EventMap>(
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

    let _anyConflictsAutomaticallyResolved = false;
    let _conflicts: Conflict[] = [];
    let _errors: ConflictError[] = [];
    let _origChanges: OsmChange | undefined;

    let _discardTags: Discarded = {};
    fileFetcher.get('discarded')
        .then(function(d) { _discardTags = d; })
        .catch(function() { /* ignore */ });

    const uploader = function() {};

    uploader.isSaving = function() {
        return _isSaving;
    };

    uploader.save = function(changeset: osmChangeset, tryAgain?: boolean, checkConflicts?: boolean) {
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

        _anyConflictsAutomaticallyResolved = false;
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


    function performFullConflictCheck(this: any, changeset: osmChangeset) {

        var osm = context.connection();
        if (!osm) return;

        var history = context.history();

        var localGraph = context.graph();
        var remoteGraph = new coreGraph(history.base(), true);

        const difference = history.difference();
        const _toCheck = [
            ...difference.modified(),
            ...difference.deleted(),
        ].map(entity => entity.id);

        var _toLoad = withChildNodes(_toCheck, localGraph);
        var _loaded: { [id: string]: boolean } = {};
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

        function withChildNodes(ids: EntityId[], graph: coreGraph) {
            var s = new Set(ids);
            ids.forEach(function(id) {
                var entity = graph.hasEntity(id);
                if (entity?.type !== 'way') return;

                graph.childNodes(entity).forEach(function(child) {
                    if (child.version !== undefined) {
                        s.add(child.id);
                    }
                });
            });

            return Array.from(s);
        }


        // Reload modified entities into an alternate graph and check for conflicts..
        function loaded(this: any, err: any, result: { data: OsmEntity[] }) {
            if (_errors.length) return;

            if (err) {
                _errors.push({
                    msg: err.message || err.responseText,
                    details: [ t('save.status_code', { code: err.status }) ]
                });
                didResultInErrors();

            } else {
                var loadMore: EntityId[] = [];

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
            function choice(choiceType: ConflictChoiceType, id: EntityId, text: string, action: Action): Choice {
                return {
                    choiceType,
                    id: id,
                    text: text,
                    action: function() {
                        history.replace(action);
                    }
                };
            }
            function formatUser(selection: d3.Selection, d: string) {
                selection
                    .append('a')
                    .attr('href', osm.userURL(d))
                    .attr('target', '_blank')
                    .text(d);
            }
            function entityName(entity: OsmEntity) {
                return utilDisplayName(entity) || (utilDisplayType(entity.id) + ' ' + entity.id);
            }

            function sameVersions(local: OsmEntity, remote: OsmEntity) {
                if (local.version !== remote.version) return false;

                // if the local version was deleted, no need to continue
                if (!localGraph.hasEntity(local.id)) return true;

                if (local.type === 'way' && remote.type === 'way') {
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
                // for local_delete, we need to find the feature from the base graph
                var local = localGraph.hasEntity(id) || localGraph.base().entities[id]!;
                var remote = remoteGraph.entity(id);

                if (sameVersions(local, remote)) return;

                if (!localGraph.hasEntity(id) && remote.visible) {
                    // local_delete + remote_modify
                    rebaseRemoteChangesIntoBaseGraph(context, remote, remoteGraph);
                }

                var merge = actionMergeRemoteChanges(id, localGraph, remoteGraph, _discardTags, formatUser);

                history.replace(merge);

                var mergeConflicts = merge.conflicts();
                if (!mergeConflicts.length) {
                    _anyConflictsAutomaticallyResolved = true;
                    return; // merged safely
                }

                var forceLocal = actionMergeRemoteChanges(id, localGraph, remoteGraph, _discardTags).withOption('force_local');
                var forceRemote = actionMergeRemoteChanges(id, localGraph, remoteGraph, _discardTags).withOption('force_remote');
                var keepMine = t('save.conflict.' + (remote.visible ? 'keep_local' : 'restore'));
                var keepTheirs = t('save.conflict.' + (remote.visible ? 'keep_remote' : 'delete'));

                _conflicts.push({
                    id: id,
                    name: entityName(local),
                    details: mergeConflicts,
                    chosen: ConflictChoiceType.KEEP_LOCAL,
                    choices: [
                        choice(ConflictChoiceType.KEEP_LOCAL, id, keepMine, forceLocal),
                        choice(ConflictChoiceType.KEEP_REMOTE, id, keepTheirs, forceRemote)
                    ]
                });
            });
        }
    }


    async function upload(this: any, changeset: osmChangeset) {
        var osm = context.connection();
        if (!osm) {
            _errors.push({ msg: 'No OSM Service' });
        }

        if (_conflicts.length) {
            didResultInConflicts(changeset);

        } else if (_errors.length) {
            didResultInErrors();

        } else {
            if (_anyConflictsAutomaticallyResolved) {
                // add a changeset tag to aid reviewers
                changeset = changeset.mergeTags({ merge_conflict_resolved: 'automatically' });
                await osm.updateChangesetTags(changeset);
            }
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


    function uploadCallback(err: any, changeset: osmChangeset) {
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

    function didResultInNoChanges(this: any) {

        dispatch.call('resultNoChanges', this);

        endSave();

        context.flush(); // reset iD
    }

    function didResultInErrors(this: any) {

        context.history().pop();

        dispatch.call('resultErrors', this, _errors);

        endSave();
    }


    function didResultInConflicts(this: any, changeset: osmChangeset) {
        // add a changeset tag to aid reviewers
        changeset = changeset.mergeTags({ merge_conflict_resolved: 'manually' });
        context.connection().updateChangesetTags(changeset);

        _conflicts.sort(function(a, b) { return b.id.localeCompare(a.id); });

        dispatch.call('resultConflicts', this, changeset, _conflicts, _origChanges);

        endSave();
    }


    function didResultInSuccess(this: any, changeset: osmChangeset) {

        // delete the edit stack cached to local storage
        context.history().clearSaved();

        dispatch.call('resultSuccess', this, changeset);

        // Add delay to allow for postgres replication #1646 #2678
        window.setTimeout(function() {

            endSave();

            context.flush(); // reset iD
        }, window.VITEST ? 0 : 2500);
    }


    function endSave(this: any) {
        _isSaving = false;

        dispatch.call('saveEnded', this);
    }


    uploader.cancelConflictResolution = function() {
        // this doesn't work, and it seems like it hasn't worked
        // properly for many years.
        // TODO: consider disabling the cancel button, since we know it's broken?
        context.history().pop();
    };


    uploader.processResolvedConflicts = function(changeset: osmChangeset) {
        var history = context.history();

        for (var i = 0; i < _conflicts.length; i++) {
            if (_conflicts[i].chosen === ConflictChoiceType.KEEP_REMOTE) {  // user chose "use theirs"
                history.replace(actionRevert(_conflicts[i].id));
            }
        }

        uploader.save(changeset, true, false);  // tryAgain = true, checkConflicts = false
    };


    uploader.reset = function() {

    };


    return utilRebind(uploader, dispatch, 'on');
}

export interface coreUploader extends ReturnType<typeof coreUploader> {}
