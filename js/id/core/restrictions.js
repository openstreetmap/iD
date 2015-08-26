iD.Restrictions = function(context) {
    var _restrict = {};

    var restrictions = {
        editingLocked: function(ids) {
            return this.test(_restrict.all, ids);
        },

        geometryLocked: function(ids) {
            return this.test(_restrict.geometry, ids);
        },

        tagsLocked: function(ids) {
            return this.test(_restrict.tags, ids);
        },

        reload: function() {
            _restrict.all = _.map(iD.restrictions, function(fn) { return fn(context); });
            _restrict.geometry = _.filter(_restrict.all, 'lockGeometry');
            _restrict.tags = _.filter(_restrict.all, 'lockTags');
            return this;
        },

        test: function(ruleset, ids) {
            var tkey = 'restrictions.restrict_' + (ruleset === _restrict.tags ? 'tag' : 'edit'),
                reason = _.reduce(ruleset, function(result, restriction) {
                    return result || restriction.restrict(ids);
                }, false);
            return reason ? t(tkey, {reason: reason}) : false;
        }

    };

    return restrictions.reload();
};
