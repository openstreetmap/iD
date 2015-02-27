iD.modes.Save = function(context) {
    var ui = iD.ui.Commit(context)
            .on('cancel', cancel)
            .on('save', save);

    function cancel() {
        context.enter(iD.modes.Browse(context));
    }

    function save(e, tryAgain) {
        var loading = iD.ui.Loading(context).message(t('save.uploading')).blocking(true),
            history = context.history(),
            origChanges = history.changes(iD.actions.DiscardTags(history.difference())),
            localGraph = context.graph(),
            remoteGraph = iD.Graph(history.base(), true),
            modified = _.filter(history.difference().summary(), {changeType: 'modified'}),
            toCheck = _.pluck(_.pluck(modified, 'entity'), 'id'),
            deletedIds = [],
            conflicts = [],
            errors = [];

        if (!tryAgain) history.perform(iD.actions.Noop());  // checkpoint
        context.container().call(loading);

        if (toCheck.length) {
            _.each(toCheck, loadAndCheck);
        } else {
            finalize();
        }


        // Reload modified entities into an alternate graph and check for conflicts..
        function loadAndCheck(id) {
            context.connection().loadEntity(id, function(err, result) {
                toCheck = _.without(toCheck, id);

                if (err) {
                    if (err.status === 410) {   // Status: Gone (contains no responseText)
                        addDeleteConflict(id);
                    } else {
                        errors.push({
                            id: id,
                            msg: err.responseText,
                            details: [ t('save.status_code', { code: err.status }) ]
                        });
                    }

                } else {
                    _.each(result.data, function(entity) { remoteGraph.replace(entity); });
                    checkConflicts(id);
                }

                if (!toCheck.length) {
                    finalize();
                }
            });
        }


        function addDeleteConflict(id) {
            if (deletedIds.indexOf(id) !== -1) return;
            else deletedIds.push(id);

            var local = localGraph.entity(id);

            conflicts.push({
                id: id,
                name: entityName(local),
                details: [ t('save.conflict.deleted') ],
                chosen: 1,
                choices: [
                    choice(id, t('save.conflict.restore'), undelete(local)),
                    choice(id, t('save.conflict.delete'), iD.actions.DeleteMultiple([id]))
                ],
            });

            function undelete(entity) {
                return function(graph) {
                    var target = iD.Entity(entity, { version: +entity.version + 1 });
                    return graph.replace(target);
                };
            }
        }


        function checkConflicts(id) {
            var local = localGraph.entity(id),
                remote = remoteGraph.entity(id);

            if (compareVersions(local, remote)) return;

            var action = iD.actions.MergeRemoteChanges,
                merge = action(id, localGraph, remoteGraph, formatUser),
                diff = history.replace(merge);

            if (diff.length()) return;  // merged safely

            var forceLocal = action(id, localGraph, remoteGraph, formatUser).withOption('force_local'),
                forceRemote = action(id, localGraph, remoteGraph, formatUser).withOption('force_remote');

            conflicts.push({
                id: id,
                name: entityName(local),
                details: merge.conflicts(),
                chosen: 1,
                choices: [
                    choice(id, t('save.conflict.keep_local'), forceLocal),
                    choice(id, t('save.conflict.keep_remote'), forceRemote)
                ]
            });
        }

        function compareVersions(local, remote) {
            if (local.version !== remote.version) return false;

            if (local.type === 'way') {
                var children = _.union(local.nodes, remote.nodes);

                for (var i = 0; i < children.length; i++) {
                    var a = localGraph.hasEntity(children[i]),
                        b = remoteGraph.hasEntity(children[i]);

                    if (!a || !b || a.version !== b.version) return false;
                }
            }

            return true;
        }


        function finalize() {
            if (conflicts.length) {
                conflicts.sort(function(a,b) { return b.id.localeCompare(a.id); });
                showConflicts();
            } else if (errors.length) {
                showErrors();
            } else {
                context.connection().putChangeset(
                    history.changes(iD.actions.DiscardTags(history.difference())),
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
                            loading.close();
                            context.flush();
                            success(e, changeset_id);
                        }
                    });
            }
        }


        function showConflicts() {
            var selection = context.container()
                .select('#sidebar')
                .append('div')
                .attr('class','sidebar-component');

            loading.close();

            var header = selection
                .append('div')
                .attr('class', 'header fillL');

            header
                .append('button')
                .attr('class', 'fr')
                .on('click', function() {
                    history.pop();
                    selection.remove();
                })
                .append('span')
                .attr('class', 'icon close');

            header
                .append('h3')
                .text(t('save.conflict.header'));

            var body = selection
                .append('div')
                .attr('class', 'body fillL');

            body
                .append('div')
                .attr('class', 'conflicts-help')
                .text(t('save.conflict.help'))
                .append('a')
                .attr('class', 'conflicts-download')
                .text(t('save.conflict.download_changes'))
                .on('click.download', function() {
                    var data = JXON.stringify(context.connection().osmChangeJXON('CHANGEME', origChanges)),
                        win = window.open('data:text/xml,' + encodeURIComponent(data), '_blank');
                    win.focus();
                });

            body
                .append('div')
                .attr('class', 'conflict-container fillL3')
                .call(showConflict, 0);

            body
                .append('div')
                .attr('class', 'conflicts-done')
                .attr('opacity', 0)
                .style('display', 'none')
                .text(t('save.conflict.done'));

            var buttons = body
                .append('div')
                .attr('class','buttons col12 joined conflicts-buttons');

            buttons
                .append('button')
                .attr('disabled', conflicts.length > 1)
                .attr('class', 'action conflicts-button col6')
                .text(t('save.title'))
                .on('click.try_again', function() {
                    selection.remove();
                    save(e, true);
                });

            buttons
                .append('button')
                .attr('class', 'secondary-action conflicts-button col6')
                .text(t('confirm.cancel'))
                .on('click.cancel', function() {
                    history.pop();
                    selection.remove();
                });
        }


        function showConflict(selection, index) {
            var parent = d3.select(selection.node().parentElement);

            // enable save button if this is the last conflict being reviewed..
            if (index === conflicts.length - 1) {
                window.setTimeout(function() {
                    parent.select('.conflicts-button')
                        .attr('disabled', null);

                    parent.select('.conflicts-done')
                        .transition()
                        .attr('opacity', 1)
                        .style('display', 'block');
                }, 250);
            }

            var item = selection
                .selectAll('.conflict')
                .data([conflicts[index]]);

            var enter = item.enter()
                .append('div')
                .attr('class', 'conflict');

            enter
                .append('h4')
                .attr('class', 'conflict-count')
                .text(t('save.conflict.count', { num: index + 1, total: conflicts.length }));

            enter
                .append('a')
                .attr('class', 'conflict-description')
                .attr('href', '#')
                .text(function(d) { return d.name; })
                .on('click', function(d) {
                    zoomToEntity(d.id);
                    d3.event.preventDefault();
                });

            var details = enter
                .append('div')
                .attr('class', 'conflict-detail-container');

            details
                .append('ul')
                .attr('class', 'conflict-detail-list')
                .selectAll('li')
                .data(function(d) { return d.details || []; })
                .enter()
                .append('li')
                .attr('class', 'conflict-detail-item')
                .html(function(d) { return d; });

            details
                .append('div')
                .attr('class', 'conflict-choices')
                .call(addChoices);

            details
                .append('div')
                .attr('class', 'conflict-nav-buttons joined cf')
                .selectAll('button')
                .data(['previous', 'next'])
                .enter()
                .append('button')
                .text(function(d) { return t('save.conflict.' + d); })
                .attr('class', 'conflict-nav-button action col6')
                .attr('disabled', function(d, i) {
                    return (i === 0 && index === 0) ||
                        (i === 1 && index === conflicts.length - 1) || null;
                })
                .on('click', function(d, i) {
                    var container = parent.select('.conflict-container'), //d3.select(this.parentElement.parentElement.parentElement.parentElement),
                    sign = (i === 0 ? -1 : 1);

                    container
                        .selectAll('.conflict')
                        .remove();

                    container
                        .call(showConflict, index + sign);

                    d3.event.preventDefault();
                });

            item.exit()
                .remove();

        }

        function addChoices(selection) {
            var choices = selection
                .append('ul')
                .attr('class', 'layer-list')
                .selectAll('li')
                .data(function(d) { return d.choices || []; });

            var enter = choices.enter()
                .append('li')
                .attr('class', 'layer');

            var label = enter
                .append('label');

            label
                .append('input')
                .attr('type', 'radio')
                .attr('name', function(d) { return d.id; })
                .on('change', function(d, i) {
                    var ul = this.parentElement.parentElement.parentElement;
                    ul.__data__.chosen = i;
                    choose(ul, d);
                });

            label
                .append('span')
                .text(function(d) { return d.text; });

            choices
                .each(function(d, i) {
                    var ul = this.parentElement;
                    if (ul.__data__.chosen === i) choose(ul, d);
                });
        }

        function choose(ul, datum) {
            if (d3.event) d3.event.preventDefault();

            d3.select(ul)
                .selectAll('li')
                .classed('active', function(d) { return d === datum; })
                .selectAll('input')
                .property('checked', function(d) { return d === datum; });

            datum.action();
            zoomToEntity(datum.id);
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


        function formatUser(d) {
            return '<a href="' + context.connection().userURL(d) + '" target="_blank">' + d + '</a>';
        }

        function entityName(entity) {
            return iD.util.displayName(entity) || (iD.util.displayType(entity.id) + ' ' + entity.id);
        }

        function choice(id, text, action) {
            return {
                id: id,
                text: text,
                action: function() { history.replace(action); }
            };
        }

        function zoomToEntity(id) {
            context.surface().selectAll('.hover')
                .classed('hover', false);

            var entity = context.graph().hasEntity(id);
            if (entity) {
                context.map().zoomTo(entity);
                context.surface().selectAll(
                    iD.util.entityOrMemberSelector([entity.id], context.graph()))
                    .classed('hover', true);
            }
        }

    }

    function success(e, changeset_id) {
        context.enter(iD.modes.Browse(context)
            .sidebar(iD.ui.Success(context)
                .changeset({
                    id: changeset_id,
                    comment: e.comment
                })
                .on('cancel', function(ui) {
                    context.ui().sidebar.hide(ui);
                })));
    }

    var mode = {
        id: 'save'
    };

    mode.enter = function() {
        context.connection().authenticate(function() {
            context.ui().sidebar.show(ui);
        });
    };

    mode.exit = function() {
        context.ui().sidebar.hide(ui);
    };

    return mode;
};
