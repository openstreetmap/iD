import _extend from 'lodash-es/extend';
import _filter from 'lodash-es/filter';
import _groupBy from 'lodash-es/groupBy';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../util/locale';

import {
    actionAddEntity,
    actionAddMember,
    actionChangeMember,
    actionDeleteMember
} from '../actions';

import { modeSelect } from '../modes';
import { osmEntity, osmRelation } from '../osm';
import { services } from '../services';
import { svgIcon } from '../svg';
import { uiCombobox, uiDisclosure } from './index';
import { utilDisplayName, utilNoAuto, utilHighlightEntity } from '../util';


export function uiRawMembershipEditor(context) {
    var taginfo = services.taginfo;
    var nearbyCombo = uiCombobox(context, 'parent-relation')
        .minItems(1)
        .fetcher(fetchNearbyRelations);
    var _entityID;
    var _showBlank;


    function selectRelation(d) {
        d3_event.preventDefault();

        // remove the hover-highlight styling
        utilHighlightEntity(d.relation.id, false, context);

        context.enter(modeSelect(context, [d.relation.id]));
    }


    function changeRole(d) {
        if (d === 0) return;   // called on newrow (shoudn't happen)
        var oldRole = d.member.role;
        var newRole = d3_select(this).property('value');

        if (oldRole !== newRole) {
            context.perform(
                actionChangeMember(d.relation.id, _extend({}, d.member, { role: newRole }), d.index),
                t('operations.change_role.annotation')
            );
        }
    }


    function addMembership(d, role) {
        this.blur();           // avoid keeping focus on the button
        _showBlank = false;

        var member = { id: _entityID, type: context.entity(_entityID).type, role: role };

        if (d.relation) {
            context.perform(
                actionAddMember(d.relation.id, member),
                t('operations.add_member.annotation')
            );

        } else {
            var relation = osmRelation();
            context.perform(
                actionAddEntity(relation),
                actionAddMember(relation.id, member),
                t('operations.add.annotation.relation')
            );

            context.enter(modeSelect(context, [relation.id]));
        }
    }


    function deleteMembership(d) {
        this.blur();           // avoid keeping focus on the button
        if (d === 0) return;   // called on newrow (shoudn't happen)

        context.perform(
            actionDeleteMember(d.relation.id, d.index),
            t('operations.delete_member.annotation')
        );
    }


    function fetchNearbyRelations(q, callback) {
        var newRelation = { relation: null, value: t('inspector.new_relation') };
        var result = [];
        var graph = context.graph();

        context.intersects(context.extent()).forEach(function(entity) {
            if (entity.type !== 'relation' || entity.id === _entityID) return;

            var matched = context.presets().match(entity, graph);
            var presetName = (matched && matched.name()) || t('inspector.relation');
            var entityName = utilDisplayName(entity) || '';

            var value = presetName + ' ' + entityName;
            if (q && value.toLowerCase().indexOf(q.toLowerCase()) === -1) return;

            result.push({ relation: entity, value: value });
        });

        result.sort(function(a, b) {
            return osmRelation.creationOrder(a.relation, b.relation);
        });

        // Dedupe identical names by appending relation id - see #2891
        var dupeGroups = _filter(
            _groupBy(result, 'value'),
            function(v) { return v.length > 1; }
        );

        dupeGroups.forEach(function(group) {
            group.forEach(function(obj) {
                obj.value += ' ' + obj.relation.id;
            });
        });

        result.forEach(function(obj) {
            obj.title = obj.value;
        });

        result.unshift(newRelation);
        callback(result);
    }


    function rawMembershipEditor(selection) {
        var entity = context.entity(_entityID);
        var parents = context.graph().parentRelations(entity);
        var memberships = [];

        parents.slice(0, 1000).forEach(function(relation) {
            relation.members.forEach(function(member, index) {
                if (member.id === entity.id) {
                    memberships.push({ relation: relation, member: member, index: index });
                }
            });
        });

        var gt = parents.length > 1000 ? '>' : '';
        selection.call(uiDisclosure(context, 'raw_membership_editor', true)
            .title(t('inspector.all_relations') + ' (' + gt + memberships.length + ')')
            .expanded(true)
            .updatePreference(false)
            .on('toggled', function(expanded) {
                if (expanded) { selection.node().parentNode.scrollTop += 200; }
            })
            .content(content)
        );


        function content(selection) {
            var list = selection.selectAll('.member-list')
                .data([0]);

            list = list.enter()
                .append('ul')
                .attr('class', 'member-list')
                .merge(list);


            var items = list.selectAll('li.member-row-normal')
                .data(memberships, function(d) {
                    return osmEntity.key(d.relation) + ',' + d.index;
                });

            items.exit()
                .each(unbind)
                .remove();

            // Enter
            var itemsEnter = items.enter()
                .append('li')
                .attr('class', 'member-row member-row-normal form-field');

            itemsEnter.each(function(d){
                // highlight the relation in the map while hovering on the list item
                d3_select(this).on('mouseover', function() {
                    utilHighlightEntity(d.relation.id, true, context);
                });
                d3_select(this).on('mouseout', function() {
                    utilHighlightEntity(d.relation.id, false, context);
                });
            });

            var labelEnter = itemsEnter
                .append('label')
                .attr('class', 'form-field-label')
                .append('span')
                .attr('class', 'label-text')
                .append('a')
                .attr('href', '#')
                .on('click', selectRelation);

            labelEnter
                .append('span')
                .attr('class', 'member-entity-type')
                .text(function(d) {
                    var matched = context.presets().match(d.relation, context.graph());
                    return (matched && matched.name()) || t('inspector.relation');
                });

            labelEnter
                .append('span')
                .attr('class', 'member-entity-name')
                .text(function(d) { return utilDisplayName(d.relation); });

            var wrapEnter = itemsEnter
                .append('div')
                .attr('class', 'form-field-input-wrap form-field-input-member');

            wrapEnter
                .append('input')
                .attr('class', 'member-role')
                .property('type', 'text')
                .attr('maxlength', 255)
                .attr('placeholder', t('inspector.role'))
                .call(utilNoAuto)
                .property('value', function(d) { return d.member.role; })
                .on('blur', changeRole)
                .on('change', changeRole);

            wrapEnter
                .append('button')
                .attr('tabindex', -1)
                .attr('class', 'remove form-field-button member-delete')
                .call(svgIcon('#iD-operation-delete'))
                .on('click', deleteMembership);

            if (taginfo) {
                wrapEnter.each(bindTypeahead);
            }


            var newMembership = list.selectAll('.member-row-new')
                .data(_showBlank ? [0] : []);

            // Exit
            newMembership.exit()
                .remove();

            // Enter
            var newMembershipEnter = newMembership.enter()
                .append('li')
                .attr('class', 'member-row member-row-new form-field');

            newMembershipEnter
                .append('label')
                .attr('class', 'form-field-label')
                .append('input')
                .attr('placeholder', t('inspector.choose_relation'))
                .attr('type', 'text')
                .attr('class', 'member-entity-input')
                .call(utilNoAuto);

            var newWrapEnter = newMembershipEnter
                .append('div')
                .attr('class', 'form-field-input-wrap form-field-input-member');

            newWrapEnter
                .append('input')
                .attr('class', 'member-role')
                .property('type', 'text')
                .attr('maxlength', 255)
                .attr('placeholder', t('inspector.role'))
                .call(utilNoAuto);

            newWrapEnter
                .append('button')
                .attr('tabindex', -1)
                .attr('class', 'remove form-field-button member-delete')
                .on('click', function() {
                    list.selectAll('.member-row-new')
                        .remove();
                })
                .call(svgIcon('#iD-operation-delete'));

            // Update
            newMembership = newMembership
                .merge(newMembershipEnter);

            newMembership.selectAll('.member-entity-input')
                .call(nearbyCombo
                    .on('accept', function (d) {
                        var role = list.selectAll('.member-row-new .member-role').property('value');
                        addMembership(d, role);
                    })
                    .on('cancel', function() { delete this.value; })
                );


            var addrel = selection.selectAll('.add-relation')
                .data([0]);

            // Enter
            var addrelEnter = addrel.enter()
                .append('button')
                .attr('class', 'add-relation');

            // Update
            addrel
                .merge(addrelEnter)
                .call(svgIcon('#iD-icon-plus', 'light'))
                .on('click', function() {
                    _showBlank = true;
                    content(selection);
                    list.selectAll('.member-entity-input').node().focus();
                });


            function bindTypeahead(d) {
                var row = d3_select(this);
                var role = row.selectAll('input.member-role');
                var origValue = role.property('value');

                function sort(value, data) {
                    var sameletter = [];
                    var other = [];
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].value.substring(0, value.length) === value) {
                            sameletter.push(data[i]);
                        } else {
                            other.push(data[i]);
                        }
                    }
                    return sameletter.concat(other);
                }

                role.call(uiCombobox(context, 'member-role')
                    .fetcher(function(role, callback) {
                        var rtype = d.relation.tags.type;
                        taginfo.roles({
                            debounce: true,
                            rtype: rtype || '',
                            geometry: context.geometry(_entityID),
                            query: role
                        }, function(err, data) {
                            if (!err) callback(sort(role, data));
                        });
                    })
                    .on('cancel', function() {
                        role.property('value', origValue);
                    })
                );
            }


            function unbind() {
                var row = d3_select(this);

                row.selectAll('input.member-role')
                    .call(uiCombobox.off);
            }
        }
    }


    rawMembershipEditor.entityID = function(_) {
        if (!arguments.length) return _entityID;
        _entityID = _;
        _showBlank = false;
        return rawMembershipEditor;
    };


    return rawMembershipEditor;
}
