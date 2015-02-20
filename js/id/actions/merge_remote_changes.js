iD.actions.MergeRemoteChanges = function(id, remoteGraph, formatUser) {
    var option = 'safe',  // 'safe', 'force_local', 'force_remote'
        conflicts = [];

    function user(d) {
        return _.isFunction(formatUser) ? formatUser(d) : d;
    }

    function mergeChildNodes(target, children, replacements) {
        var ccount = conflicts.length;

        for (var i = 0; i < children.length; i++) {
            var localNode = children[i],
                remoteNode = remoteGraph.hasEntity(localNode.id);

            if (!remoteNode) continue;

            var targetNode = iD.Entity(localNode, { version: remoteNode.version });
            targetNode = mergeLocation(remoteNode, targetNode);
            if (conflicts.length !== ccount) break;

            replacements.push(targetNode);
        }

        return target;
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
            return _.contains(iD.data.discarded, k);
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
            if (o[k] !== b[k] && a[k] !== b[k]) {   // changed remotely..
                if (o[k] !== a[k]) {   // changed locally..
                    conflicts.push(t('merge_remote_changes.conflict.tags',
                        { tag: k, local: a[k], remote: b[k], user: user(remote.user) }));
                } else {
                    tags[k] = b[k];    // unchanged locally, accept remote tag..
                    changed = true;
                }
            }
        }

        return (changed && conflicts.length === ccount) ? target.update({tags: tags}) : target;
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

        if (!conflicts.length) {
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
