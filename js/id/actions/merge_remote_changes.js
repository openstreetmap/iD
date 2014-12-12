iD.actions.MergeRemoteChanges = function(id, localGraph, remoteGraph) {
    var base = localGraph.base().entities[id],
        local = localGraph.entity(id),
        remote = remoteGraph.entity(id),
        option = 'safe';  // 'safe', 'force_local', 'force_remote'


    function mergeLocation(target) {
        function pointEqual(a, b) {
            var epsilon = 1e-6;
            return (Math.abs(a[0] - b[0]) < epsilon) && (Math.abs(a[1] - b[1]) < epsilon);
        }

        if (!pointEqual(remote.loc, local.loc)) {
            return (option === 'force_remote') ? target.update({loc: remote.loc}) : undefined;
        }
        return target;
    }

    function mergeRemoteChildren(target) {
        if (option === 'force_remote') {
            return target.update({nodes: remote.nodes});
        }

        // todo, support non-destructive merging
        // for now fail on any change..
        if (!_.isEqual(local.nodes, remote.nodes)) {
            return;
        }
        return target;
    }

    function mergeRemoteMembers(target) {
        if (option === 'force_remote') {
            return target.update({members: remote.members});
        }

        // todo, support non-destructive merging
        // for now fail on any change..
        if (!_.isEqual(local.members, remote.members)) {
            return;
        }
        return target;
    }

    function mergeRemoteTags(target) {
        if (!target) { return; }
        if (option === 'force_remote') {
            return target.update({tags: remote.tags});
        }

        var keys = _.reject(_.union(_.keys(base.tags), _.keys(remote.tags)), ignoreKey),
            tags = _.cloneDeep(target.tags),
            changed = false;

        function ignoreKey(k) {
            return k.indexOf('tiger:') === 0 || _.contains(iD.data.discarded, k);
        }

        for (var i = 0, imax = keys.length; i !== imax; i++) {
            var k = keys[i];
            if (remote.tags[k] !== base.tags[k]) {  // tag modified remotely..
                if (local.tags[k] && local.tags[k] !== remote.tags[k]) {
                    return;
                } else {
                    tags[k] = remote.tags[k];
                    changed = true;
                }
            }
        }

        return changed ? target.update({tags: tags}) : target;
    }

    var action = function(graph) {
        var target = iD.Entity(local, {version: remote.version});

        if (option === 'force_local') {
            return graph.replace(target);
        }

        if (target.type === 'node') {
            target = mergeLocation(target);
        } else if (target.type === 'way') {
            graph.rebase(remoteGraph.childNodes(remote), [graph], false);
            target = mergeRemoteChildren(target);
        } else if (target.type === 'relation') {
            target = mergeRemoteMembers(target);
        }

        target = mergeRemoteTags(target);
        return target ? graph.replace(target) : graph;
    };

    action.withOption = function(opt) {
        option = opt;
        return action;
    };

    return action;
};
