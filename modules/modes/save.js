import * as d3 from 'd3';
import _ from 'lodash';

import { d3keybinding } from '../lib/d3.keybinding.js';
import { t } from '../util/locale';

import {
    actionDiscardTags,
    actionMergeRemoteChanges,
    actionNoop,
    actionRevert
} from '../actions';

import { coreGraph } from '../core';
import { modeBrowse } from './index';

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



export function modeSave(context) {
    var mode = {
        id: 'save'
    };

    var keybinding = d3keybinding('select');

    var commit = uiCommit(context)
        .on('cancel', cancel)
        .on('save', save);


    function cancel() {
        context.enter(modeBrowse(context));
    }


    function save(changeset, tryAgain) {

        var osm = context.connection(),
            loading = uiLoading(context).message(t('save.uploading')).blocking(true),
            history = context.history(),
            origChanges = history.changes(actionDiscardTags(history.difference())),
            localGraph = context.graph(),
            remoteGraph = coreGraph(history.base(), true),
            modified = _.filter(history.difference().summary(), {changeType: 'modified'}),
            toCheck = _.map(_.map(modified, 'entity'), 'id'),
            toLoad = withChildNodes(toCheck, localGraph),
            conflicts = [],
            errors = [];

        if (!osm) return;

        if (!tryAgain) {
            history.perform(actionNoop());  // checkpoint
        }

        context.container().call(loading);

        upload();


        function withChildNodes(ids, graph) {
            return _.uniq(_.reduce(ids, function(result, id) {
                var entity = graph.entity(id);
                if (entity.type === 'way') {
                    try {
                        var cn = graph.childNodes(entity);
                        result.push.apply(result, _.map(_.filter(cn, 'version'), 'id'));
                    } catch (err) {
                        /* eslint-disable no-console */
                        if (typeof console !== 'undefined') console.error(err);
                        /* eslint-enable no-console */
                    }
                }
                return result;
            }, _.clone(ids)));
        }


        // Reload modified entities into an alternate graph and check for conflicts..
        function loaded(err, result) {
            if (errors.length) return;

            if (err) {
                errors.push({
                    msg: err.responseText,
                    details: [ t('save.status_code', { code: err.status }) ]
                });
                showErrors();

            } else {
                var loadMore = [];
                _.each(result.data, function(entity) {
                    remoteGraph.replace(entity);
                    toLoad = _.without(toLoad, entity.id);

                    // Because loadMultiple doesn't download /full like loadEntity,
                    // need to also load children that aren't already being checked..
                    if (!entity.visible) return;
                    if (entity.type === 'way') {
                        loadMore.push.apply(loadMore,
                            _.difference(entity.nodes, toCheck, toLoad, loadMore));
                    } else if (entity.type === 'relation' && entity.isMultipolygon()) {
                        loadMore.push.apply(loadMore,
                            _.difference(_.map(entity.members, 'id'), toCheck, toLoad, loadMore));
                    }
                });

                if (loadMore.length) {
                    toLoad.push.apply(toLoad, loadMore);
                    osm.loadMultiple(loadMore, loaded);
                }

                if (!toLoad.length) {
                    checkConflicts();
                }
            }
        }


        function checkConflicts() {
            function choice(id, text, action) {
                return { id: id, text: text, action: function() { history.replace(action); } };
            }
            function formatUser(d) {
                return '<a href="' + osm.userURL(d) + '" target="_blank">' + d + '</a>';
            }
            function entityName(entity) {
                return utilDisplayName(entity) || (utilDisplayType(entity.id) + ' ' + entity.id);
            }

            function compareVersions(local, remote) {
                if (local.version !== remote.version) return false;

                if (local.type === 'way') {
                    var children = _.union(local.nodes, remote.nodes);

                    for (var i = 0; i < children.length; i++) {
                        var a = localGraph.hasEntity(children[i]),
                            b = remoteGraph.hasEntity(children[i]);

                        if (a && b && a.version !== b.version) return false;
                    }
                }

                return true;
            }

            _.each(toCheck, function(id) {
                var local = localGraph.entity(id),
                    remote = remoteGraph.entity(id);

                if (compareVersions(local, remote)) return;

                var action = actionMergeRemoteChanges,
                    merge = action(id, localGraph, remoteGraph, formatUser);

                history.replace(merge);

                var mergeConflicts = merge.conflicts();
                if (!mergeConflicts.length) return;  // merged safely

                var forceLocal = action(id, localGraph, remoteGraph).withOption('force_local'),
                    forceRemote = action(id, localGraph, remoteGraph).withOption('force_remote'),
                    keepMine = t('save.conflict.' + (remote.visible ? 'keep_local' : 'restore')),
                    keepTheirs = t('save.conflict.' + (remote.visible ? 'keep_remote' : 'delete'));

                conflicts.push({
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

            upload();
        }


        function upload() {
            if (conflicts.length) {
                conflicts.sort(function(a,b) { return b.id.localeCompare(a.id); });
                showConflicts();
            } else if (errors.length) {
                showErrors();
            } else {
                var changes = history.changes(actionDiscardTags(history.difference()));
                if (changes.modified.length || changes.created.length || changes.deleted.length) {
                    osm.putChangeset(changeset, changes, uploadCallback);
                } else {        // changes were insignificant or reverted by user
                    d3.select('.inspector-wrap *').remove();
                    loading.close();
                    context.flush();
                    cancel();
                }
            }
        }


        function uploadCallback(err, changeset) {
            if (err) {
                errors.push({
                    msg: err.responseText,
                    details: [ t('save.status_code', { code: err.status }) ]
                });
                showErrors();
            } else {
                history.clearSaved();
                success(changeset);
                // Add delay to allow for postgres replication #1646 #2678
                window.setTimeout(function() {
                    d3.select('.inspector-wrap *').remove();
                    loading.close();
                    context.flush();
                }, 2500);
            }
        }


        function showConflicts() {
            var selection = context.container()
                .select('#sidebar')
                .append('div')
                .attr('class','sidebar-component');

            loading.close();

            selection.call(uiConflicts(context)
                .list(conflicts)
                .origChanges(origChanges)
                .on('cancel', function() {
                    history.pop();
                    selection.remove();
                })
                .on('save', function() {
                    for (var i = 0; i < conflicts.length; i++) {
                        if (conflicts[i].chosen === 1) {  // user chose "keep theirs"
                            var entity = context.hasEntity(conflicts[i].id);
                            if (entity && entity.type === 'way') {
                                var children = _.uniq(entity.nodes);
                                for (var j = 0; j < children.length; j++) {
                                    history.replace(actionRevert(children[j]));
                                }
                            }
                            history.replace(actionRevert(conflicts[i].id));
                        }
                    }

                    selection.remove();
                    save(changeset, true);
                })
            );
        }


        function showErrors() {
            var selection = uiConfirm(context.container());

            history.pop();
            loading.close();

            selection
                .select('.modal-section.header')
                .append('h3')
                .text(t('save.error'));

            addErrors(selection, errors);
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
                    var error = d3.select(this),
                        detail = d3.select(this.nextElementSibling),
                        exp = error.classed('expanded');

                    detail.style('display', exp ? 'none' : 'block');
                    error.classed('expanded', !exp);

                    d3.event.preventDefault();
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

    }


    function success(changeset) {
        commit.reset();
        context.enter(modeBrowse(context)
            .sidebar(uiSuccess(context)
                .changeset(changeset)
                .on('cancel', function() {
                    context.ui().sidebar.hide();
                })
            )
        );
    }


    mode.enter = function() {
        function done() {
            context.ui().sidebar.show(commit);
        }

        keybinding
            .on('⎋', cancel, true);

        d3.select(document)
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
        keybinding.off();

        context.container().selectAll('#content')
            .attr('class', 'active');

        context.ui().sidebar.hide();
    };

    return mode;
}
