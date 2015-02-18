iD.actions.MergeRemoteChanges = function(id, remoteGraph, formatUser) {
    var option = 'safe',  // 'safe', 'force_local', 'force_remote'
        conflicts = [];

    function user(d) {
        return _.isFunction(formatUser) ? formatUser(d) : d;
    }

    function mergeChildNodes(target, children, replacements) {
        if (!target) return;

        for (var i = 0; i < children.length; i++) {
            var localNode = children[i],
                remoteNode = remoteGraph.hasEntity(localNode.id);

            if (!remoteNode) continue;

            if (option === 'force_remote') {
                replacements.push(remoteNode);
            } else {
                var targetNode = iD.Entity(localNode, { version: remoteNode.version });
                targetNode = mergeLocation(remoteNode, targetNode);
                if (targetNode) {
                    replacements.push(targetNode);
                } else {
                    return;  // fail merge
                }
            }
        }

        return target;
    }


    function mergeLocation(remote, target) {
        if (!target) return;

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
        return;  // fail merge
    }


    function mergeNodes(base, remote, target) {
        if (!target) return;

        if (option === 'force_local' || _.isEqual(target.nodes, remote.nodes)) {
            return target;
        }
        if (option === 'force_remote') {
            return target.update({nodes: remote.nodes});
        }

        var o = base.nodes || [],
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
                    return;  // fail merge..
                }
            }
        }

        return target.update({nodes: nodes});
    }


    function mergeMembers(remote, target) {
        if (!target) return;

        if (option === 'force_local' || _.isEqual(target.members, remote.members)) {
            return target;
        }
        if (option === 'force_remote') {
            return target.update({members: remote.members});
        }

        conflicts.push(t('merge_remote_changes.conflict.memberlist', { user: user(remote.user) }));
        return;  // fail merge
    }


    function mergeTags(base, remote, target) {
        if (!target) return;

        if (option === 'force_local' || _.isEqual(target.tags, remote.tags)) {
            return target;
        }
        if (option === 'force_remote') {
            return target.update({tags: remote.tags});
        }

        var keys = _.reject(_.union(_.keys(base.tags), _.keys(remote.tags)), ignoreKey),
            tags = _.clone(target.tags),
            changed = false,
            fail = false;

        function ignoreKey(k) {
            return _.contains(iD.data.discarded, k);
        }

        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            if (remote.tags[k] !== base.tags[k]) {  // tag modified remotely..
                if (target.tags[k] && target.tags[k] !== remote.tags[k]) {
                    conflicts.push(t('merge_remote_changes.conflict.tags',
                        { tag: k, local: target.tags[k], remote: remote.tags[k], user: user(remote.user) }));
                    fail = true;
                } else {
                    tags[k] = remote.tags[k];
                    changed = true;
                }
            }
        }

        return fail ? undefined : changed ? target.update({tags: tags}) : target;
    }


    var action = function(graph) {
        var base = graph.base().entities[id],
            local = graph.entity(id),
            remote = remoteGraph.entity(id),
            target = iD.Entity(local, { version: remote.version }),
            replacements = [];

        if (target.type === 'node') {
            target = mergeLocation(remote, target);
        } else if (target.type === 'way') {
            graph.rebase(remoteGraph.childNodes(remote), [graph], false);
            target = mergeChildNodes(target, graph.childNodes(local), replacements);
            target = mergeNodes(base, remote, target);
        } else if (target.type === 'relation') {
            target = mergeMembers(remote, target);
        }

        target = mergeTags(base, remote, target);

        if (target) {
            graph = graph.replace(target);
            for (var i = 0; i < replacements.length; i++) {
                graph = graph.replace(replacements[i]);
            }
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
