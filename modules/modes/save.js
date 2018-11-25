import _clone from 'lodash-es/clone';
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

import { services } from '../services';

import {
    uiConflicts,
    uiConfirm,
    uiCommit,
    uiLoading,
    uiSuccess
} from '../ui';

import {
    utilDisplayName,
    utilDisplayType,
    utilKeybinding
} from '../util';


var _isSaving = false;


export function modeSave(context) {
    var mode = { id: 'save' };
    var keybinding = utilKeybinding('modeSave');

    var loading = uiLoading(context)
        .message(t('save.uploading'))
        .blocking(true);

    var commit = uiCommit(context)
        .on('cancel', cancel)
        .on('save', save);

    var _toCheck = [];
    var _toLoad = [];
    var _loaded = {};
    var _toLoadCount = 0;
    var _toLoadTotal = 0;

    var _conflicts = [];
    var _errors = [];
    var _origChanges;
    var _location;


    function cancel(selectedID) {
        if (selectedID) {
            context.enter(modeSelect(context, [selectedID]));
        } else {
            context.enter(modeBrowse(context));
        }
    }


    function save(changeset, tryAgain, checkConflicts) {
        // Guard against accidentally entering save code twice - #4641
        if (_isSaving && !tryAgain) {
            return;
        }

        var osm = context.connection();
        if (!osm) {
            cancel();
            return;
        }

        // If user somehow got logged out mid-save, try to reauthenticate..
        // This can happen if they were logged in from before, but the tokens are no longer valid.
        if (!osm.authenticated()) {
            osm.authenticate(function(err) {
                if (err) {
                    cancel();   // quit save mode..
                } else {
                    save(changeset, tryAgain, checkConflicts);  // continue where we left off..
                }
            });
            return;
        }

        if (!_isSaving) {
            keybindingOff();
            context.container().call(loading);  // block input
            _isSaving = true;
        }

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
            _loaded = {};
            _toLoadCount = 0;
            _toLoadTotal = _toLoad.length;

            if (_toCheck.length) {
                showProgress(_toLoadCount, _toLoadTotal);
                _toLoad.forEach(function(id) { _loaded[id] = false; });
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
                    msg: err.message || err.responseText,
                    details: [ t('save.status_code', { code: err.status }) ]
                });
                showErrors();

            } else {
                var loadMore = [];

                result.data.forEach(function(entity) {
                    remoteGraph.replace(entity);
                    _loaded[entity.id] = true;
                    _toLoad = _without(_toLoad, entity.id);

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
                showProgress(_toLoadCount, _toLoadTotal);

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
                loadLocation();  // so it is ready when we display the save screen
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
                    msg: err.message || err.responseText,
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


    function showProgress(num, total) {
        var modal = context.container().select('.loading-modal .modal-section');
        var progress = modal.selectAll('.progress')
            .data([0]);

        // enter/update
        progress.enter()
            .append('div')
            .attr('class', 'progress')
            .merge(progress)
            .text(t('save.conflict_progress', { num: num, total: total }));
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
                keybindingOn();
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
        keybindingOn();
        context.history().pop();
        loading.close();
        _isSaving = false;

        var selection = uiConfirm(context.container());
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
            .location(_location)
            .on('cancel', function() { context.ui().sidebar.hide(); });

        context.enter(modeBrowse(context).sidebar(ui));
    }


    function keybindingOn() {
        d3_select(document)
            .call(keybinding.on('⎋', cancel, true));
    }


    function keybindingOff() {
        d3_select(document)
            .call(keybinding.unbind);
    }


    // Reverse geocode current map location so we can display a message on
    // the success screen like "Thank you for editing around city, state."
    function loadLocation() {
        _location = null;
        if (!services.geocoder) return;

        services.geocoder.reverse(context.map().center(), function(err, result) {
            if (err || !result || !result.address) return;

            var parts = [];
            var addr = result.address;
            var city = addr && (addr.town || addr.city || addr.county);
            if (city) parts.push(city);
            var region = addr && (addr.state || addr.country);
            if (region) parts.push(region);

            _location = parts.join(', ');
        });
    }


    mode.enter = function() {
        function done() {
            context.ui().sidebar.show(commit);
        }

        keybindingOn();

        context.container().selectAll('#content')
            .attr('class', 'inactive');

        var osm = context.connection();
        if (!osm) {
            cancel();
            return;
        }

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
        _isSaving = false;

        keybindingOff();

        context.container().selectAll('#content')
            .attr('class', 'active');

        context.ui().sidebar.hide();
    };

    return mode;
}
