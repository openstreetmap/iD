iD.ui.RawMembershipEditor = function(context) {
    var id, showBlank;

    function selectRelation(d) {
        d3.event.preventDefault();
        context.enter(iD.modes.Select(context, [d.relation.id]));
    }

    function changeRole(d) {
        var role = d3.select(this).property('value');
        context.perform(
            iD.actions.ChangeMember(d.relation.id, _.extend({}, d.member, {role: role}), d.index),
            t('operations.change_role.annotation'));
    }

    function addMembership(d, role) {
        showBlank = false;

        if (d.relation) {
            context.perform(
                iD.actions.AddMember(d.relation.id, {id: id, type: context.entity(id).type, role: role}),
                t('operations.add_member.annotation'));

        } else {
            var relation = iD.Relation();

            context.perform(
                iD.actions.AddEntity(relation),
                iD.actions.AddMember(relation.id, {id: id, type: context.entity(id).type, role: role}),
                t('operations.add.annotation.relation'));

            context.enter(iD.modes.Select(context, [relation.id]));
        }
    }

    function deleteMembership(d) {
        context.perform(
            iD.actions.DeleteMember(d.relation.id, d.index),
            t('operations.delete_member.annotation'));
    }

    function relations(q) {
        var newRelation = {
                relation: null,
                value: t('inspector.new_relation')
            },
            result = [],
            graph = context.graph();

        context.intersects(context.extent()).forEach(function(entity) {
            if (entity.type !== 'relation' || entity.id === id)
                return;

            var presetName = context.presets().match(entity, graph).name(),
                entityName = iD.util.displayName(entity) || '';

            var value = presetName + ' ' + entityName;
            if (q && value.toLowerCase().indexOf(q.toLowerCase()) === -1)
                return;

            result.push({
                relation: entity,
                value: value
            });
        });

        result.sort(function(a, b) {
            return iD.Relation.creationOrder(a.relation, b.relation);
        });
        result.unshift(newRelation);

        return result;
    }

    function rawMembershipEditor(selection) {
        var entity = context.entity(id),
            memberships = [];

        context.graph().parentRelations(entity).forEach(function(relation) {
            relation.members.forEach(function(member, index) {
                if (member.id === entity.id) {
                    memberships.push({relation: relation, member: member, index: index});
                }
            });
        });

        selection.call(iD.ui.Disclosure()
            .title(t('inspector.all_relations') + ' (' + memberships.length + ')')
            .expanded(true)
            .on('toggled', toggled)
            .content(content));

        function toggled(expanded) {
            if (expanded) {
                selection.node().parentNode.scrollTop += 200;
            }
        }

        function content($wrap) {
            var $list = $wrap.selectAll('.member-list')
                .data([0]);

            $list.enter().append('ul')
                .attr('class', 'member-list');

            var $items = $list.selectAll('li.member-row-normal')
                .data(memberships, function(d) { return iD.Entity.key(d.relation) + ',' + d.index; });

            var $enter = $items.enter().append('li')
                .attr('class', 'member-row member-row-normal form-field');

            var $label = $enter.append('label')
                .attr('class', 'form-label')
                .append('a')
                .attr('href', '#')
                .on('click', selectRelation);

            $label.append('span')
                .attr('class', 'member-entity-type')
                .text(function(d) { return context.presets().match(d.relation, context.graph()).name(); });

            $label.append('span')
                .attr('class', 'member-entity-name')
                .text(function(d) { return iD.util.displayName(d.relation); });

            $enter.append('input')
                .attr('class', 'member-role')
                .property('type', 'text')
                .attr('maxlength', 255)
                .attr('placeholder', t('inspector.role'))
                .property('value', function(d) { return d.member.role; })
                .on('change', changeRole);

            $enter.append('button')
                .attr('tabindex', -1)
                .attr('class', 'remove button-input-action member-delete minor')
                .on('click', deleteMembership)
                .call(iD.svg.Icon('#operation-delete'));

            $items.exit()
                .remove();

            if (showBlank) {
                var $new = $list.selectAll('.member-row-new')
                    .data([0]);

                $enter = $new.enter().append('li')
                    .attr('class', 'member-row member-row-new form-field');

                $enter.append('input')
                    .attr('type', 'text')
                    .attr('class', 'member-entity-input')
                    .call(d3.combobox()
                        .minItems(1)
                        .fetcher(function(value, callback) {
                            callback(relations(value));
                        })
                        .on('accept', function(d) {
                            addMembership(d, $new.select('.member-role').property('value'));
                        }));

                $enter.append('input')
                    .attr('class', 'member-role')
                    .property('type', 'text')
                    .attr('maxlength', 255)
                    .attr('placeholder', t('inspector.role'))
                    .on('change', changeRole);

                $enter.append('button')
                    .attr('tabindex', -1)
                    .attr('class', 'remove button-input-action member-delete minor')
                    .on('click', deleteMembership)
                    .call(iD.svg.Icon('#operation-delete'));

            } else {
                $list.selectAll('.member-row-new')
                    .remove();
            }

            var $add = $wrap.selectAll('.add-relation')
                .data([0]);

            $add.enter()
                .append('button')
                .attr('class', 'add-relation')
                .call(iD.svg.Icon('#icon-plus', 'light'));

            $wrap.selectAll('.add-relation')
                .on('click', function() {
                    showBlank = true;
                    content($wrap);
                    $list.selectAll('.member-entity-input').node().focus();
                });
        }
    }

    rawMembershipEditor.entityID = function(_) {
        if (!arguments.length) return id;
        id = _;
        return rawMembershipEditor;
    };

    return rawMembershipEditor;
};
