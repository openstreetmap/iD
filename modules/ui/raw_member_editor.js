import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { d3combobox as d3_combobox } from '../lib/d3.combobox.js';

import { t } from '../util/locale';
import { actionChangeMember, actionDeleteMember } from '../actions';
import { modeBrowse, modeSelect } from '../modes';
import { osmEntity } from '../osm';
import { svgIcon } from '../svg';
import { services } from '../services';
import { uiDisclosure } from './disclosure';
import {
    utilDisplayName,
    utilDisplayType,
    utilNoAuto,
    utilHighlightEntity
} from '../util';


export function uiRawMemberEditor(context) {
    var taginfo = services.taginfo,
        _entityID;

    function downloadMember(d) {
        d3_event.preventDefault();
        // display the loading indicator
        d3_select(this.parentNode).classed('tag-reference-loading', true);
        context.loadEntity(d.id);
    }

    function zoomToMember(d) {
        d3_event.preventDefault();

        var entity = context.entity(d.id);
        context.map().zoomTo(entity);

        // highlight the feature in case it wasn't previously on-screen
        utilHighlightEntity(d.id, true, context);
    }


    function selectMember(d) {
        d3_event.preventDefault();

        var entity = context.entity(d.id);
        var mapExtent = context.map().extent();
        if (!entity.intersects(mapExtent, context.graph())) {
            // zoom to the entity if its extent is not visible now
            context.map().zoomTo(entity);
        }

        context.enter(modeSelect(context, [d.id]));
    }


    function changeRole(d) {
        var role = d3_select(this).property('value');
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
        var entity = context.entity(_entityID),
            memberships = [];

        entity.members.slice(0, 1000).forEach(function(member, index) {
            memberships.push({
                index: index,
                id: member.id,
                type: member.type,
                role: member.role,
                relation: entity,
                member: context.hasEntity(member.id)
            });
        });

        var gt = entity.members.length > 1000 ? '>' : '';
        selection.call(uiDisclosure(context, 'raw_member_editor', true)
            .title(t('inspector.all_members') + ' (' + gt + memberships.length + ')')
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

                        // highlight the member feature in the map while hovering on the list item
                        d3_select(this).on('mouseover', function() {
                            utilHighlightEntity(d.id, true, context);
                        });
                        d3_select(this).on('mouseout', function() {
                            utilHighlightEntity(d.id, false, context);
                        });

                        var label = d3_select(this).append('label')
                            .attr('class', 'form-label');

                        var labelLink = label.append('a')
                            .attr('href', '#')
                            .on('click', selectMember);

                        labelLink.append('span')
                            .attr('class', 'member-entity-type')
                            .text(function(d) {
                                var matched = context.presets().match(d.member, context.graph());
                                return (matched && matched.name()) || utilDisplayType(d.member.id);
                            });

                        labelLink.append('span')
                            .attr('class', 'member-entity-name')
                            .text(function(d) { return utilDisplayName(d.member); });

                        var buttonWrap = label.append('div')
                            .attr('class', 'form-label-button-wrap');

                        buttonWrap.append('button')
                            .attr('class', 'download-icon')
                            .attr('title', t('icons.zoom_to'))
                            .attr('tabindex', -1)
                            .call(svgIcon('#iD-icon-geolocate'))
                            .on('click', zoomToMember);

                    } else {
                        var incompleteLabel = d3_select(this).append('label')
                            .attr('class', 'form-label');

                        incompleteLabel.append('span')
                            .attr('class', 'member-entity-type')
                            .text(t('inspector.'+d.type, { id: d.id }));

                        incompleteLabel.append('span')
                            .attr('class', 'member-entity-name')
                            .text(t('inspector.incomplete', { id: d.id }));

                        var wrap = incompleteLabel.append('div')
                            .attr('class', 'form-label-button-wrap');

                        wrap.append('button')
                            .attr('class', 'download-icon')
                            .attr('title', t('icons.download'))
                            .attr('tabindex', -1)
                            .call(svgIcon('#iD-icon-load'))
                            .on('click', downloadMember);
                    }
                });

            enter
                .append('input')
                .attr('class', 'member-role')
                .property('type', 'text')
                .attr('maxlength', 255)
                .attr('placeholder', t('inspector.role'))
                .call(utilNoAuto)
                .property('value', function(d) { return d.role; })
                .on('change', changeRole);

            enter
                .append('button')
                .attr('tabindex', -1)
                .attr('title', t('icons.remove'))
                .attr('class', 'remove button-input-action member-delete minor')
                .on('click', deleteMember)
                .call(svgIcon('#iD-operation-delete'));

            if (taginfo) {
                enter.each(bindTypeahead);
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
                var row = d3_select(this);

                row.selectAll('input.member-role')
                    .call(d3_combobox.off);
            }
        }
    }


    rawMemberEditor.entityID = function(_) {
        if (!arguments.length) return _entityID;
        _entityID = _;
        return rawMemberEditor;
    };


    return rawMemberEditor;
}
