import * as d3 from 'd3';
import { d3combobox } from '../lib/d3.combobox.js';
import { t } from '../util/locale';
import { actionChangeMember, actionDeleteMember } from '../actions/index';
import { modeBrowse, modeSelect } from '../modes/index';
import { osmEntity } from '../osm/index';
import { svgIcon } from '../svg/index';
import { services } from '../services/index';
import { uiDisclosure } from './disclosure';
import { utilDisplayName, utilDisplayType } from '../util/index';


export function uiRawMemberEditor(context) {
    var id,
        taginfo = services.taginfo;


    function selectMember(d) {
        d3.event.preventDefault();
        context.enter(modeSelect(context, [d.id]));
    }


    function changeRole(d) {
        var role = d3.select(this).property('value');
        var member = { id: d.id, type: d.type, role: role };
        context.perform(
            actionChangeMember(d.relation.id, member, d.index),
            t('operations.change_role.annotation')
        );
    }


    function deleteMember(d) {
        context.perform(
            actionDeleteMember(d.relation.id, d.index),
            t('operations.delete_member.annotation')
        );

        if (!context.hasEntity(d.relation.id)) {
            context.enter(modeBrowse(context));
        }
    }


    function rawMemberEditor(selection) {
        var entity = context.entity(id),
            memberships = [];

        entity.members.forEach(function(member, index) {
            memberships.push({
                index: index,
                id: member.id,
                type: member.type,
                role: member.role,
                relation: entity,
                member: context.hasEntity(member.id)
            });
        });

        selection.call(uiDisclosure()
            .title(t('inspector.all_members') + ' (' + memberships.length + ')')
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


            var items = list.selectAll('li')
                .data(memberships, function(d) {
                    return osmEntity.key(d.relation) + ',' + d.index + ',' +
                        (d.member ? osmEntity.key(d.member) : 'incomplete');
                });

            items.exit()
                .each(unbind)
                .remove();

            var enter = items.enter()
                .append('li')
                .attr('class', 'member-row form-field')
                .classed('member-incomplete', function(d) { return !d.member; });

            enter
                .each(function(d) {
                    if (d.member) {
                        var label = d3.select(this).append('label')
                            .attr('class', 'form-label')
                            .append('a')
                            .attr('href', '#')
                            .on('click', selectMember);

                        label.append('span')
                            .attr('class', 'member-entity-type')
                            .text(function(d) {
                                var matched = context.presets().match(d.member, context.graph());
                                return (matched && matched.name()) || utilDisplayType(d.member.id);
                            });

                        label.append('span')
                            .attr('class', 'member-entity-name')
                            .text(function(d) { return utilDisplayName(d.member); });

                    } else {
                        d3.select(this).append('label')
                            .attr('class', 'form-label')
                            .text(t('inspector.incomplete', { id: d.id }));
                    }
                });

            enter
                .append('input')
                .attr('class', 'member-role')
                .property('type', 'text')
                .attr('maxlength', 255)
                .attr('placeholder', t('inspector.role'))
                .property('value', function(d) { return d.role; })
                .on('change', changeRole);

            enter
                .append('button')
                .attr('tabindex', -1)
                .attr('class', 'remove button-input-action member-delete minor')
                .on('click', deleteMember)
                .call(svgIcon('#operation-delete'));

            if (taginfo) {
                enter.each(bindTypeahead);
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
                        var rtype = entity.tags.type;
                        taginfo.roles({
                            debounce: true,
                            rtype: rtype || '',
                            geometry: context.geometry(d.member.id),
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


    rawMemberEditor.entityID = function(_) {
        if (!arguments.length) return id;
        id = _;
        return rawMemberEditor;
    };


    return rawMemberEditor;
}
