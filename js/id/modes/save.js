iD.modes.Save = function(context) {
    var ui = iD.ui.Commit(context)
            .on('cancel', cancel)
            .on('save', save);

    function cancel() {
        context.enter(iD.modes.Browse(context));
    }

    function save(e, tryAgain) {
        function withChildNodes(ids, graph) {
            return _.uniq(_.reduce(ids, function(result, id) {
                var e = graph.entity(id);
                if (e.type === 'way') {
                    try {
                        var cn = graph.childNodes(e);
                        result.push.apply(result, _.pluck(_.filter(cn, 'version'), 'id'));
                    } catch(err) {
                        /* eslint-disable no-console */
                        if (typeof console !== 'undefined') console.error(err);
                        /* eslint-enable no-console */
                    }
                }
                return result;
            }, _.clone(ids)));
        }

        var loading = iD.ui.Loading(context).message(t('save.uploading')).blocking(true),
            history = context.history(),
            origChanges = history.changes(iD.actions.DiscardTags(history.difference())),
            localGraph = context.graph(),
            remoteGraph = iD.Graph(history.base(), true),
            modified = _.filter(history.difference().summary(), {changeType: 'modified'}),
            toCheck = _.pluck(_.pluck(modified, 'entity'), 'id'),
            toLoad = withChildNodes(toCheck, localGraph),
            conflicts = [],
            errors = [];

        if (!tryAgain) history.perform(iD.actions.Noop());  // checkpoint
        context.container().call(loading);

        if (toCheck.length) {
            context.connection().loadMultiple(toLoad, loaded);
        } else {
            finalize();
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
                            _.difference(_.pluck(entity.members, 'id'), toCheck, toLoad, loadMore));
                    }
                });

                if (loadMore.length) {
                    toLoad.push.apply(toLoad, loadMore);
                    context.connection().loadMultiple(loadMore, loaded);
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
                return '<a href="' + context.connection().userURL(d) + '" target="_blank">' + d + '</a>';
            }
            function entityName(entity) {
                return iD.util.displayName(entity) || (iD.util.displayType(entity.id) + ' ' + entity.id);
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

                var action = iD.actions.MergeRemoteChanges,
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

            finalize();
        }


        function finalize() {
            if (conflicts.length) {
                conflicts.sort(function(a,b) { return b.id.localeCompare(a.id); });
                showConflicts();
            } else if (errors.length) {
                showErrors();
            } else {
                var changes = history.changes(iD.actions.DiscardTags(history.difference()));
                if (changes.modified.length || changes.created.length || changes.deleted.length) {
                    context.connection().putChangeset(
                        changes,
                        e.comment,
                        history.imageryUsed(),
                        function(err, changeset_id) {
                            if (err) {
                                errors.push({
                                    msg: err.responseText,
                                    details: [ t('save.status_code', { code: err.status }) ]
                                });
                                showErrors();
                            } else {
                                history.clearSaved();
                                success(e, changeset_id);
                                // Add delay to allow for postgres replication #1646 #2678
                                window.setTimeout(function() {
                                    loading.close();
                                    context.flush();
                                }, 2500);
                            }
                        });
                } else {        // changes were insignificant or reverted by user
                    loading.close();
                    context.flush();
                    cancel();
                }
            }
        }


        function showConflicts() {
            var selection = context.container()
                .select('#sidebar')
                .append('div')
                .attr('class','sidebar-component');

            loading.close();

            selection.call(iD.ui.Conflicts(context)
                .list(conflicts)
                .on('download', function() {
                    var data = JXON.stringify(context.connection().osmChangeJXON('CHANGEME', origChanges)),
                        win = window.open('data:text/xml,' + encodeURIComponent(data), '_blank');
                    win.focus();
                })
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
                                    history.replace(iD.actions.Revert(children[j]));
                                }
                            }
                            history.replace(iD.actions.Revert(conflicts[i].id));
                        }
                    }

                    selection.remove();
                    save(e, true);
                })
            );
        }


        function showErrors() {
            var selection = iD.ui.confirm(context.container());

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


    function success(e, changeset_id) {
        context.enter(iD.modes.Browse(context)
            .sidebar(iD.ui.Success(context)
                .changeset({
                    id: changeset_id,
                    comment: e.comment
                })
                .on('cancel', function() {
                    context.ui().sidebar.hide();
                })));
    }

    var mode = {
        id: 'save'
    };

    mode.enter = function() {
        context.connection().authenticate(function(err) {
            if (err) {
                cancel();
            } else {
                context.ui().sidebar.show(ui);
            }
        });
    };

    mode.exit = function() {
        context.ui().sidebar.hide();
    };

    return mode;
};
