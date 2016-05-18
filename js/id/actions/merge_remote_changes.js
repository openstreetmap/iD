iD.actions.MergeRemoteChanges = function(id, localGraph, remoteGraph, formatUser) {
    var option = 'safe',  // 'safe', 'force_local', 'force_remote'
        conflicts = [];

    function user(d) {
        return _.isFunction(formatUser) ? formatUser(d) : d;
    }


    function mergeLocation(remote, target) {
        function pointEqual(a, b) {
            var epsilon = 1e-6;
            return (Math.abs(a[0] - b[0]) < epsilon) && (Math.abs(a[1] - b[1]) < epsilon);
        }

        if (option === 'force_local' || pointEqual(target.loc, remote.loc)) {
            return target;
        }
        if (option === 'force_remote') {
            return target.update({loc: remote.loc});
        }

        conflicts.push(t('merge_remote_changes.conflict.location', { user: user(remote.user) }));
        return target;
    }


    function mergeNodes(base, remote, target) {
        if (option === 'force_local' || _.isEqual(target.nodes, remote.nodes)) {
            return target;
        }
        if (option === 'force_remote') {
            return target.update({nodes: remote.nodes});
        }

        var ccount = conflicts.length,
            o = base.nodes || [],
            a = target.nodes || [],
            b = remote.nodes || [],
            nodes = [],
            hunks = Diff3.diff3_merge(a, o, b, true);

        for (var i = 0; i < hunks.length; i++) {
            var hunk = hunks[i];
            if (hunk.ok) {
                nodes.push.apply(nodes, hunk.ok);
            } else {
                // for all conflicts, we can assume c.a !== c.b
                // because `diff3_merge` called with `true` option to exclude false conflicts..
                var c = hunk.conflict;
                if (_.isEqual(c.o, c.a)) {  // only changed remotely
                    nodes.push.apply(nodes, c.b);
                } else if (_.isEqual(c.o, c.b)) {  // only changed locally
                    nodes.push.apply(nodes, c.a);
                } else {       // changed both locally and remotely
                    conflicts.push(t('merge_remote_changes.conflict.nodelist', { user: user(remote.user) }));
                    break;
                }
            }
        }

        return (conflicts.length === ccount) ? target.update({nodes: nodes}) : target;
    }


    function mergeChildren(targetWay, children, updates, graph) {
        function isUsed(node, targetWay) {
            var parentWays = _.map(graph.parentWays(node), 'id');
            return node.hasInterestingTags() ||
                _.without(parentWays, targetWay.id).length > 0 ||
                graph.parentRelations(node).length > 0;
        }

        var ccount = conflicts.length;

        for (var i = 0; i < children.length; i++) {
            var id = children[i],
                node = graph.hasEntity(id);

            // remove unused childNodes..
            if (targetWay.nodes.indexOf(id) === -1) {
                if (node && !isUsed(node, targetWay)) {
                    updates.removeIds.push(id);
                }
                continue;
            }

            // restore used childNodes..
            var local = localGraph.hasEntity(id),
                remote = remoteGraph.hasEntity(id),
                target;

            if (option === 'force_remote' && remote && remote.visible) {
                updates.replacements.push(remote);

            } else if (option === 'force_local' && local) {
                target = iD.Entity(local);
                if (remote) {
                    target = target.update({ version: remote.version });
                }
                updates.replacements.push(target);

            } else if (option === 'safe' && local && remote && local.version !== remote.version) {
                target = iD.Entity(local, { version: remote.version });
                if (remote.visible) {
                    target = mergeLocation(remote, target);
                } else {
                    conflicts.push(t('merge_remote_changes.conflict.deleted', { user: user(remote.user) }));
                }

                if (conflicts.length !== ccount) break;
                updates.replacements.push(target);
            }
        }

        return targetWay;
    }


    function updateChildren(updates, graph) {
        for (var i = 0; i < updates.replacements.length; i++) {
            graph = graph.replace(updates.replacements[i]);
        }
        if (updates.removeIds.length) {
            graph = iD.actions.DeleteMultiple(updates.removeIds)(graph);
        }
        return graph;
    }


    function mergeMembers(remote, target) {
        if (option === 'force_local' || _.isEqual(target.members, remote.members)) {
            return target;
        }
        if (option === 'force_remote') {
            return target.update({members: remote.members});
        }

        conflicts.push(t('merge_remote_changes.conflict.memberlist', { user: user(remote.user) }));
        return target;
    }


    function mergeTags(base, remote, target) {
        function ignoreKey(k) {
            return _.includes(iD.data.discarded, k);
        }

        if (option === 'force_local' || _.isEqual(target.tags, remote.tags)) {
            return target;
        }
        if (option === 'force_remote') {
            return target.update({tags: remote.tags});
        }

        var ccount = conflicts.length,
            o = base.tags || {},
            a = target.tags || {},
            b = remote.tags || {},
            keys = _.reject(_.union(_.keys(o), _.keys(a), _.keys(b)), ignoreKey),
            tags = _.clone(a),
            changed = false;

        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];

            if (o[k] !== b[k] && a[k] !== b[k]) {    // changed remotely..
                if (o[k] !== a[k]) {      // changed locally..
                    conflicts.push(t('merge_remote_changes.conflict.tags',
                        { tag: k, local: a[k], remote: b[k], user: user(remote.user) }));

                } else {                  // unchanged locally, accept remote change..
                    if (b.hasOwnProperty(k)) {
                        tags[k] = b[k];
                    } else {
                        delete tags[k];
                    }
                    changed = true;
                }
            }
        }

        return (changed && conflicts.length === ccount) ? target.update({tags: tags}) : target;
    }


    //  `graph.base()` is the common ancestor of the two graphs.
    //  `localGraph` contains user's edits up to saving
    //  `remoteGraph` contains remote edits to modified nodes
    //  `graph` must be a descendent of `localGraph` and may include
    //      some conflict resolution actions performed on it.
    //
    //                  --- ... --- `localGraph` -- ... -- `graph`
    //                 /
    //  `graph.base()` --- ... --- `remoteGraph`
    //
    var action = function(graph) {
        var updates = { replacements: [], removeIds: [] },
            base = graph.base().entities[id],
            local = localGraph.entity(id),
            remote = remoteGraph.entity(id),
            target = iD.Entity(local, { version: remote.version });

        // delete/undelete
        if (!remote.visible) {
            if (option === 'force_remote') {
                return iD.actions.DeleteMultiple([id])(graph);

            } else if (option === 'force_local') {
                if (target.type === 'way') {
                    target = mergeChildren(target, _.uniq(local.nodes), updates, graph);
                    graph = updateChildren(updates, graph);
                }
                return graph.replace(target);

            } else {
                conflicts.push(t('merge_remote_changes.conflict.deleted', { user: user(remote.user) }));
                return graph;  // do nothing
            }
        }

        // merge
        if (target.type === 'node') {
            target = mergeLocation(remote, target);

        } else if (target.type === 'way') {
            // pull in any child nodes that may not be present locally..
            graph.rebase(remoteGraph.childNodes(remote), [graph], false);
            target = mergeNodes(base, remote, target);
            target = mergeChildren(target, _.union(local.nodes, remote.nodes), updates, graph);

        } else if (target.type === 'relation') {
            target = mergeMembers(remote, target);
        }

        target = mergeTags(base, remote, target);

        if (!conflicts.length) {
            graph = updateChildren(updates, graph).replace(target);
        }

        return graph;
    };

    action.withOption = function(opt) {
        option = opt;
        return action;
    };

    action.conflicts = function() {
        return conflicts;
    };

    return action;
};
