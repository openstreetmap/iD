import * as d3 from 'd3';
import _ from 'lodash';
import { d3combobox } from '../lib/d3.combobox.js';
import { t } from '../util/locale';

import {
    actionAddEntity,
    actionAddMember,
    actionChangeMember,
    actionDeleteMember
} from '../actions/index';

import { modeSelect } from '../modes/index';
import { osmEntity, osmRelation } from '../osm/index';
import { services } from '../services/index';
import { svgIcon } from '../svg/index';
import { uiDisclosure } from './disclosure';
import { utilDisplayName } from '../util/index';


export function uiRawMembershipEditor(context) {
    var taginfo = services.taginfo,
        id, showBlank;


    function selectRelation(d) {
        d3.event.preventDefault();
        context.enter(modeSelect(context, [d.relation.id]));
    }


    function changeRole(d) {
        var role = d3.select(this).property('value');
        context.perform(
            actionChangeMember(d.relation.id, _.extend({}, d.member, { role: role }), d.index),
            t('operations.change_role.annotation')
        );
    }


    function addMembership(d, role) {
        showBlank = false;

        if (d.relation) {
            context.perform(
                actionAddMember(d.relation.id, { id: id, type: context.entity(id).type, role: role }),
                t('operations.add_member.annotation')
            );

        } else {
            var relation = osmRelation();
            context.perform(
                actionAddEntity(relation),
                actionAddMember(relation.id, { id: id, type: context.entity(id).type, role: role }),
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
        var newRelation = {
                relation: null,
                value: t('inspector.new_relation')
            },
            result = [],
            graph = context.graph();

        context.intersects(context.extent()).forEach(function(entity) {
            if (entity.type !== 'relation' || entity.id === id)
                return;

            var matched = context.presets().match(entity, graph),
                presetName = (matched && matched.name()) || t('inspector.relation'),
                entityName = utilDisplayName(entity) || '';

            var value = presetName + ' ' + entityName;
            if (q && value.toLowerCase().indexOf(q.toLowerCase()) === -1)
                return;

            result.push({
                relation: entity,
                value: value
            });
        });

        result.sort(function(a, b) {
            return osmRelation.creationOrder(a.relation, b.relation);
        });

        // Dedupe identical names by appending relation id - see #2891
        var dupeGroups = _(result)
            .groupBy('value')
            .filter(function(v) { return v.length > 1; })
            .value();

        dupeGroups.forEach(function(group) {
            group.forEach(function(obj) {
                obj.value += ' ' + obj.relation.id;
            });
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
                    memberships.push({ relation: relation, member: member, index: index });
                }
            });
        });

        selection.call(uiDisclosure()
            .title(t('inspector.all_relations') + ' (' + memberships.length + ')')
            .expanded(true)
            .on('toggled', toggled)
            .content(content)
        );


        function toggled(expanded) {
            if (expanded) {
                selection.node().parentNode.scrollTop += 200;
            }
        }


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
                .property('value', function(d) { return d.member.role; })
                .on('change', changeRole);

            enter
                .append('button')
                .attr('tabindex', -1)
                .attr('class', 'remove button-input-action member-delete minor')
                .on('click', deleteMembership)
                .call(svgIcon('#operation-delete'));

            if (taginfo) {
                enter.each(bindTypeahead);
            }


            var newrow = list.selectAll('.member-row-new')
                .data(showBlank ? [0] : []);

            newrow.exit()
                .remove();

            enter = newrow.enter()
                .append('li')
                .attr('class', 'member-row member-row-new form-field');

            enter
                .append('input')
                .attr('type', 'text')
                .attr('class', 'member-entity-input');

            enter
                .append('input')
                .attr('class', 'member-role')
                .property('type', 'text')
                .attr('maxlength', 255)
                .attr('placeholder', t('inspector.role'))
                .on('change', changeRole);

            enter
                .append('button')
                .attr('tabindex', -1)
                .attr('class', 'remove button-input-action member-delete minor')
                .on('click', deleteMembership)
                .call(svgIcon('#operation-delete'));

            newrow = newrow
                .merge(enter);

            newrow.selectAll('.member-entity-input')
                .call(d3combobox()
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
                .call(svgIcon('#icon-plus', 'light'))
                .on('click', function() {
                    showBlank = true;
                    content(wrap);
                    list.selectAll('.member-entity-input').node().focus();
                });


            function onAccept(d) {
                var role = list.selectAll('.member-row-new .member-role').property('value');
                addMembership(d, role);
            }


            function bindTypeahead(d) {
                var row = d3.select(this),
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

                role.call(d3combobox()
                    .fetcher(function(role, callback) {
                        var rtype = d.relation.tags.type;
                        taginfo.roles({
                            debounce: true,
                            rtype: rtype || '',
                            geometry: context.geometry(id),
                            query: role
                        }, function(err, data) {
                            if (!err) callback(sort(role, data));
                        });
                    }));
            }


            function unbind() {
                var row = d3.select(this);

                row.selectAll('input.member-role')
                    .call(d3combobox.off);
            }
        }
    }


    rawMembershipEditor.entityID = function(_) {
        if (!arguments.length) return id;
        id = _;
        return rawMembershipEditor;
    };


    return rawMembershipEditor;
}
