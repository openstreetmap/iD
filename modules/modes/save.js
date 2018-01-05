import _clone from 'lodash-es/clone';
import _difference from 'lodash-es/difference';
import _filter from 'lodash-es/filter';
import _map from 'lodash-es/map';
import _reduce from 'lodash-es/reduce';
import _union from 'lodash-es/union';
import _uniq from 'lodash-es/uniq';
import _without from 'lodash-es/without';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';
import { t } from '../util/locale';

import {
    actionDiscardTags,
    actionMergeRemoteChanges,
    actionNoop,
    actionRevert
} from '../actions';

import { coreGraph } from '../core';

import {
    modeBrowse,
    modeSelect
} from './index';

import {
    uiConflicts,
    uiConfirm,
    uiCommit,
    uiLoading,
    uiSuccess
} from '../ui';

import {
    utilDisplayName,
    utilDisplayType
} from '../util';


var _isSaving = false;


export function modeSave(context) {
    var mode = { id: 'save' };
    var keybinding = d3_keybinding('select');

    var loading = uiLoading(context)
        .message(t('save.uploading'))
        .blocking(true);

    var commit = uiCommit(context)
        .on('cancel', cancel)
        .on('save', save);

    var _toCheck = [];
    var _toLoad = [];
    var _conflicts = [];
    var _errors = [];
    var _origChanges;


    function cancel(selectedID) {
        if (selectedID) {
            context.enter(modeSelect(context, [selectedID]));
        } else {
            context.enter(modeBrowse(context));
        }
    }


    function save(changeset, tryAgain, checkConflicts) {
        // Guard against accidentally entering save code twice - #4641
        if (_isSaving && !tryAgain) return;

        var osm = context.connection();
        if (!osm) return;

        _isSaving = true;
        context.container().call(loading);  // block input

        var history = context.history();
        var localGraph = context.graph();
        var remoteGraph = coreGraph(history.base(), true);

        _conflicts = [];
        _errors = [];

        // Store original changes, in case user wants to download them as an .osc file
        _origChanges = history.changes(actionDiscardTags(history.difference()));

        // First time, `history.perform` a no-op action.
        // Any conflict resolutions will be done as `history.replace`
        if (!tryAgain) {
            history.perform(actionNoop());
        }

        // Attempt a fast upload.. If there are conflicts, re-enter with `checkConflicts = true`
        if (!checkConflicts) {
            upload(changeset);

        // Do the full (slow) conflict check..
        } else {
            var modified = _filter(history.difference().summary(), { changeType: 'modified' });
            _toCheck = _map(_map(modified, 'entity'), 'id');
            _toLoad = withChildNodes(_toCheck, localGraph);
            if (_toCheck.length) {
                osm.loadMultiple(_toLoad, loaded);
            } else {
                upload(changeset);
            }
        }

        return;


        function withChildNodes(ids, graph) {
            return _uniq(_reduce(ids, function(result, id) {
                var entity = graph.entity(id);
                if (entity.type === 'way') {
                    try {
                        var children = graph.childNodes(entity);
                        result.push.apply(result, _map(_filter(children, 'version'), 'id'));
                    } catch (err) {
                        /* eslint-disable no-console */
                        if (typeof console !== 'undefined') console.error(err);
                        /* eslint-enable no-console */
                    }
                }
                return result;
            }, _clone(ids)));
        }

        // Reload modified entities into an alternate graph and check for conflicts..
        function loaded(err, result) {
            if (_errors.length) return;

            if (err) {
                _errors.push({
                    msg: err.responseText,
                    details: [ t('save.status_code', { code: err.status }) ]
                });
                showErrors();

            } else {
                var loadMore = [];
                result.data.forEach(function(entity) {
                    remoteGraph.replace(entity);
                    _toLoad = _without(_toLoad, entity.id);

                    // Because loadMultiple doesn't download /full like loadEntity,
                    // need to also load children that aren't already being checked..
                    if (!entity.visible) return;
                    if (entity.type === 'way') {
                        loadMore.push.apply(loadMore,
                            _difference(entity.nodes, _toCheck, _toLoad, loadMore));
                    } else if (entity.type === 'relation' && entity.isMultipolygon()) {
                        loadMore.push.apply(loadMore,
                            _difference(_map(entity.members, 'id'), _toCheck, _toLoad, loadMore));
                    }
                });

                if (loadMore.length) {
                    _toLoad.push.apply(_toLoad, loadMore);
                    osm.loadMultiple(loadMore, loaded);
                }

                if (!_toLoad.length) {
                    detectConflicts();
                }
            }
        }


        function detectConflicts() {
            function choice(id, text, action) {
                return { id: id, text: text, action: function() { history.replace(action); } };
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
                    var children = _union(local.nodes, remote.nodes);
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

                var action = actionMergeRemoteChanges;
                var merge = action(id, localGraph, remoteGraph, formatUser);

                history.replace(merge);

                var mergeConflicts = merge.conflicts();
                if (!mergeConflicts.length) return;  // merged safely

                var forceLocal = action(id, localGraph, remoteGraph).withOption('force_local');
                var forceRemote = action(id, localGraph, remoteGraph).withOption('force_remote');
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

            upload(changeset);
        }
    }


    function upload(changeset) {
        var osm = context.connection();
        if (!osm) {
            _errors.push({ msg: 'No OSM Service' });
        }

        if (_conflicts.length) {
            _conflicts.sort(function(a, b) { return b.id.localeCompare(a.id); });
            showConflicts(changeset);

        } else if (_errors.length) {
            showErrors();

        } else {
            var history = context.history();
            var changes = history.changes(actionDiscardTags(history.difference()));
            if (changes.modified.length || changes.created.length || changes.deleted.length) {
                osm.putChangeset(changeset, changes, uploadCallback);
            } else {        // changes were insignificant or reverted by user
                d3_select('.inspector-wrap *').remove();
                loading.close();
                _isSaving = false;
                context.flush();
                cancel();
            }
        }
    }


    function uploadCallback(err, changeset) {
        if (err) {
            if (err.status === 409) {          // 409 Conflict
                save(changeset, true, true);   // tryAgain = true, checkConflicts = true
            } else {
                _errors.push({
                    msg: err.responseText,
                    details: [ t('save.status_code', { code: err.status }) ]
                });
                showErrors();
            }

        } else {
            context.history().clearSaved();
            success(changeset);
            // Add delay to allow for postgres replication #1646 #2678
            window.setTimeout(function() {
                d3_select('.inspector-wrap *').remove();
                loading.close();
                _isSaving = false;
                context.flush();
            }, 2500);
        }
    }


    function showConflicts(changeset) {
        var history = context.history();
        var selection = context.container()
            .select('#sidebar')
            .append('div')
            .attr('class','sidebar-component');

        loading.close();
        _isSaving = false;

        var ui = uiConflicts(context)
            .conflictList(_conflicts)
            .origChanges(_origChanges)
            .on('cancel', function() {
                history.pop();
                selection.remove();
            })
            .on('save', function() {
                for (var i = 0; i < _conflicts.length; i++) {
                    if (_conflicts[i].chosen === 1) {  // user chose "keep theirs"
                        var entity = context.hasEntity(_conflicts[i].id);
                        if (entity && entity.type === 'way') {
                            var children = _uniq(entity.nodes);
                            for (var j = 0; j < children.length; j++) {
                                history.replace(actionRevert(children[j]));
                            }
                        }
                        history.replace(actionRevert(_conflicts[i].id));
                    }
                }

                selection.remove();
                save(changeset, true, false);  // tryAgain = true, checkConflicts = false
            });

        selection.call(ui);
    }


    function showErrors() {
        var selection = uiConfirm(context.container());

        context.history().pop();
        loading.close();
        _isSaving = false;

        selection
            .select('.modal-section.header')
            .append('h3')
            .text(t('save.error'));

        addErrors(selection, _errors);
        selection.okButton();
    }


    function addErrors(selection, data) {
        var message = selection
            .select('.modal-section.message-text');

        var items = message
            .selectAll('.error-container')
            .data(data);

        var enter = items.enter()
            .append('div')
            .attr('class', 'error-container');

        enter
            .append('a')
            .attr('class', 'error-description')
            .attr('href', '#')
            .classed('hide-toggle', true)
            .text(function(d) { return d.msg || t('save.unknown_error_details'); })
            .on('click', function() {
                d3_event.preventDefault();

                var error = d3_select(this);
                var detail = d3_select(this.nextElementSibling);
                var exp = error.classed('expanded');

                detail.style('display', exp ? 'none' : 'block');
                error.classed('expanded', !exp);
            });

        var details = enter
            .append('div')
            .attr('class', 'error-detail-container')
            .style('display', 'none');

        details
            .append('ul')
            .attr('class', 'error-detail-list')
            .selectAll('li')
            .data(function(d) { return d.details || []; })
            .enter()
            .append('li')
            .attr('class', 'error-detail-item')
            .text(function(d) { return d; });

        items.exit()
            .remove();
    }


    function success(changeset) {
        commit.reset();

        var ui = uiSuccess(context)
            .changeset(changeset)
            .on('cancel', function() { context.ui().sidebar.hide(); });

        context.enter(modeBrowse(context).sidebar(ui));
    }


    mode.enter = function() {
        function done() {
            context.ui().sidebar.show(commit);
        }

        keybinding
            .on('⎋', cancel, true);

        d3_select(document)
            .call(keybinding);

        context.container().selectAll('#content')
            .attr('class', 'inactive');

        var osm = context.connection();
        if (!osm) return;

        if (osm.authenticated()) {
            done();
        } else {
            osm.authenticate(function(err) {
                if (err) {
                    cancel();
                } else {
                    done();
                }
            });
        }
    };


    mode.exit = function() {
        loading.close();
        _isSaving = false;

        keybinding.off();

        context.container().selectAll('#content')
            .attr('class', 'active');

        context.ui().sidebar.hide();
    };

    return mode;
}
