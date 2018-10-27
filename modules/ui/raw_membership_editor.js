import _extend from 'lodash-es/extend';
import _filter from 'lodash-es/filter';
import _forEach from 'lodash-es/forEach';
import _groupBy from 'lodash-es/groupBy';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { d3combobox as d3_combobox } from '../lib/d3.combobox.js';

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
import { uiDisclosure } from './disclosure';
import { utilDisplayName, utilNoAuto, utilHighlightEntity } from '../util';


export function uiRawMembershipEditor(context) {
    var taginfo = services.taginfo,
        _entityID,
        _showBlank;


    function selectRelation(d) {
        d3_event.preventDefault();
        context.enter(modeSelect(context, [d.relation.id]));
    }


    function changeRole(d) {
        var role = d3_select(this).property('value');
        context.perform(
            actionChangeMember(d.relation.id, _extend({}, d.member, { role: role }), d.index),
            t('operations.change_role.annotation')
        );
    }


    function addMembership(d, role) {
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
        context.perform(
            actionDeleteMember(d.relation.id, d.index),
            t('operations.delete_member.annotation')
        );
    }


    function relations(q) {
        var newRelation = { relation: null, value: t('inspector.new_relation') };
        var result = [];
        var graph = context.graph();

        context.intersects(context.extent()).forEach(function(entity) {
            if (entity.type !== 'relation' || entity.id === _entityID)
                return;

            var matched = context.presets().match(entity, graph),
                presetName = (matched && matched.name()) || t('inspector.relation'),
                entityName = utilDisplayName(entity) || '';

            var value = presetName + ' ' + entityName;
            if (q && value.toLowerCase().indexOf(q.toLowerCase()) === -1)
                return;

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

        _forEach(result, function(obj) {
            obj.title = obj.value;
        });

        result.unshift(newRelation);
        return result;
    }


    function rawMembershipEditor(selection) {
        var entity = context.entity(_entityID),
            parents = context.graph().parentRelations(entity),
            memberships = [];

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


        function content(wrap) {
            var list = wrap.selectAll('.member-list')
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

            var enter = items.enter()
                .append('li')
                .attr('class', 'member-row member-row-normal form-field');

            enter.each(function(d){
                // highlight the relation in the map while hovering on the list item
                d3_select(this).on('mouseover', function() {
                    utilHighlightEntity(d.relation.id, true, context);
                });
                d3_select(this).on('mouseout', function() {
                    utilHighlightEntity(d.relation.id, false, context);
                });
            });

            var label = enter
                .append('label')
                .attr('class', 'form-label')
                .append('a')
                .attr('href', '#')
                .on('click', selectRelation);

            label
                .append('span')
                .attr('class', 'member-entity-type')
                .text(function(d) {
                    var matched = context.presets().match(d.relation, context.graph());
                    return (matched && matched.name()) || t('inspector.relation');
                });

            label
                .append('span')
                .attr('class', 'member-entity-name')
                .text(function(d) { return utilDisplayName(d.relation); });

            enter
                .append('input')
                .attr('class', 'member-role')
                .property('type', 'text')
                .attr('maxlength', 255)
                .attr('placeholder', t('inspector.role'))
                .call(utilNoAuto)
                .property('value', function(d) { return d.member.role; })
                .on('change', changeRole);

            enter
                .append('button')
                .attr('tabindex', -1)
                .attr('class', 'remove button-input-action member-delete minor')
                .on('click', deleteMembership)
                .call(svgIcon('#iD-operation-delete'));

            if (taginfo) {
                enter.each(bindTypeahead);
            }


            var newrow = list.selectAll('.member-row-new')
                .data(_showBlank ? [0] : []);

            newrow.exit()
                .remove();

            enter = newrow.enter()
                .append('li')
                .attr('class', 'member-row member-row-new form-field');

            enter
                .append('input')
                .attr('type', 'text')
                .attr('class', 'member-entity-input')
                .call(utilNoAuto);

            enter
                .append('input')
                .attr('class', 'member-role')
                .property('type', 'text')
                .attr('maxlength', 255)
                .attr('placeholder', t('inspector.role'))
                .call(utilNoAuto)
                .on('change', changeRole);

            enter
                .append('button')
                .attr('tabindex', -1)
                .attr('class', 'remove button-input-action member-delete minor')
                .on('click', deleteMembership)
                .call(svgIcon('#iD-operation-delete'));

            newrow = newrow
                .merge(enter);

            newrow.selectAll('.member-entity-input')
                .call(d3_combobox()
                    .container(context.container())
                    .minItems(1)
                    .fetcher(function(value, callback) { callback(relations(value)); })
                    .on('accept', onAccept)
                );


            var addrel = wrap.selectAll('.add-relation')
                .data([0]);

            addrel = addrel.enter()
                .append('button')
                .attr('class', 'add-relation')
                .merge(addrel);

            addrel
                .call(svgIcon('#iD-icon-plus', 'light'))
                .on('click', function() {
                    _showBlank = true;
                    content(wrap);
                    list.selectAll('.member-entity-input').node().focus();
                });


            function onAccept(d) {
                var role = list.selectAll('.member-row-new .member-role').property('value');
                addMembership(d, role);
            }


            function bindTypeahead(d) {
                var row = d3_select(this),
                    role = row.selectAll('input.member-role');

                function sort(value, data) {
                    var sameletter = [],
                        other = [];
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].value.substring(0, value.length) === value) {
                            sameletter.push(data[i]);
                        } else {
                            other.push(data[i]);
                        }
                    }
                    return sameletter.concat(other);
                }

                role.call(d3_combobox()
                    .container(context.container())
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
                    }));
            }


            function unbind() {
                var row = d3_select(this);

                row.selectAll('input.member-role')
                    .call(d3_combobox.off);
            }
        }
    }


    rawMembershipEditor.entityID = function(_) {
        if (!arguments.length) return _entityID;
        _entityID = _;
        return rawMembershipEditor;
    };


    return rawMembershipEditor;
}
