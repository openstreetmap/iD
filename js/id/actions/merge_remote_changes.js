iD.actions.MergeRemoteChanges = function(base, local, remote) {
    var option = 'safe',  // 'safe', 'force_local', 'force_remote'
        target;

    function assertIds() {
        return (base.id === local.id) && (base.id === remote.id);
    }

    function sameLocation() {
        var epsilon = 1e-6;
        return (Math.abs(remote.loc[0] - local.loc[0]) < epsilon) &&
                (Math.abs(remote.loc[1] - local.loc[1]) < epsilon);
    }

    function mergeChildren() {
        // todo, support non-destructive merging
        return _.isEqual(local.nodes, remote.nodes);
    }

    function mergeMembers() {
        // todo, support non-destructive merging
        return _.isEqual(local.members, remote.members);
    }

    function mergeTags() {
        var keys = _.reject(_.union(_.keys(base.tags), _.keys(remote.tags)), ignoreKey),
            tags = _.cloneDeep(target.tags);

        function ignoreKey(k) {
            return k.indexOf('tiger:') === 0 || _.contains(iD.data.discarded, k);
        }

        for (var i = 0, imax = keys.length; i !== imax; i++) {
            var k = keys[i];
            if (remote.tags[k] !== base.tags[k]) {  // tag modified remotely..
                if (local.tags[k] && local.tags[k] !== remote.tags[k]) {
                    return false;
                } else {
                    tags[k] = remote.tags[k];
                }
            }
        }

        target = target.update({tags: tags});
        return true;
    }

    var action = function(graph) {
        if (!assertIds()) { return graph; }

        target = iD.Entity(local, {version: remote.version});
        if (option === 'force_remote') { return graph.replace(remote); }
        if (option === 'force_local') { return graph.replace(target); }

        // otherwise, safe mode: only permit non-destructive merges..
        var doMerge;
        if (target.type === 'node') {
            doMerge = (sameLocation() && mergeTags());
        } else if (target.type === 'way') {
            doMerge = (mergeChildren() && mergeTags());
        } else if (target.type === 'relation') {
            doMerge = (mergeMembers() && mergeTags());
        }

        return doMerge ? graph.replace(target) : graph;
    };

    action.withOption = function(opt) {
        option = opt;
        return action;
    };

    return action;
};
