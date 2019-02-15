import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../util/locale';
import { actionChangeMember, actionDeleteMember } from '../actions';
import { modeBrowse, modeSelect } from '../modes';
import { osmEntity } from '../osm';
import { svgIcon } from '../svg';
import { services } from '../services';
import { uiCombobox, uiDisclosure } from './index';
import { utilDisplayName, utilDisplayType, utilHighlightEntities, utilNoAuto } from '../util';


export function uiRawMemberEditor(context) {
    var taginfo = services.taginfo;
    var _entityID;

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
        utilHighlightEntities([d.id], true, context);
    }


    function selectMember(d) {
        d3_event.preventDefault();

        // remove the hover-highlight styling
        utilHighlightEntities([d.id], false, context);

        var entity = context.entity(d.id);
        var mapExtent = context.map().extent();
        if (!entity.intersects(mapExtent, context.graph())) {
            // zoom to the entity if its extent is not visible now
            context.map().zoomToEase(entity);
        }

        context.enter(modeSelect(context, [d.id]));
    }


    function changeRole(d) {
        var oldRole = d.role;
        var newRole = d3_select(this).property('value');

        if (oldRole !== newRole) {
            var member = { id: d.id, type: d.type, role: newRole };
            context.perform(
                actionChangeMember(d.relation.id, member, d.index),
                t('operations.change_role.annotation')
            );
        }
    }


    function deleteMember(d) {
        context.perform(
            actionDeleteMember(d.relation.id, d.index),
            t('operations.delete_member.annotation')
        );

        if (!context.hasEntity(d.relation.id)) {
            context.enter(modeBrowse(context));
        }

        utilHighlightEntities([d.id], false, context);
    }


    function rawMemberEditor(selection) {
        var entity = context.entity(_entityID);
        var memberships = [];

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
                if (expanded) {
                    selection.node().parentNode.scrollTop += 200;
                }
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


            var items = list.selectAll('li')
                .data(memberships, function(d) {
                    return osmEntity.key(d.relation) + ',' + d.index + ',' +
                        (d.member ? osmEntity.key(d.member) : 'incomplete');
                });

            items.exit()
                .each(unbind)
                .remove();

            var itemsEnter = items.enter()
                .append('li')
                .attr('class', 'member-row form-field')
                .classed('member-incomplete', function(d) { return !d.member; });

            itemsEnter
                .each(function(d) {
                    var item = d3_select(this);

                    var label = item
                        .append('label')
                        .attr('class', 'form-field-label');

                    if (d.member) {
                        // highlight the member feature in the map while hovering on the list item
                        item
                            .on('mouseover', function() {
                                utilHighlightEntities([d.id], true, context);
                            })
                            .on('mouseout', function() {
                                utilHighlightEntities([d.id], false, context);
                            });

                        var labelLink = label
                            .append('span')
                            .attr('class', 'label-text')
                            .append('a')
                            .attr('href', '#')
                            .on('click', selectMember);

                        labelLink
                            .append('span')
                            .attr('class', 'member-entity-type')
                            .text(function(d) {
                                var matched = context.presets().match(d.member, context.graph());
                                return (matched && matched.name()) || utilDisplayType(d.member.id);
                            });

                        labelLink
                            .append('span')
                            .attr('class', 'member-entity-name')
                            .text(function(d) { return utilDisplayName(d.member); });

                        label
                            .append('button')
                            .attr('class', 'member-zoom')
                            .attr('title', t('icons.zoom_to'))
                            .attr('tabindex', -1)
                            .call(svgIcon('#iD-icon-geolocate'))
                            .on('click', zoomToMember);

                    } else {
                        var labelText = label
                            .append('span')
                            .attr('class', 'label-text');

                        labelText
                            .append('span')
                            .attr('class', 'member-entity-type')
                            .text(t('inspector.' + d.type, { id: d.id }));

                        labelText
                            .append('span')
                            .attr('class', 'member-entity-name')
                            .text(t('inspector.incomplete', { id: d.id }));

                        label
                            .append('button')
                            .attr('class', 'member-download')
                            .attr('title', t('icons.download'))
                            .attr('tabindex', -1)
                            .call(svgIcon('#iD-icon-load'))
                            .on('click', downloadMember);
                    }
                });

            var wrapEnter = itemsEnter
                .append('div')
                .attr('class', 'form-field-input-wrap form-field-input-member');

            wrapEnter
                .append('input')
                .attr('class', 'member-role')
                .property('type', 'text')
                .attr('maxlength', 255)
                .attr('placeholder', t('inspector.role'))
                .call(utilNoAuto);

            wrapEnter
                .append('button')
                .attr('tabindex', -1)
                .attr('title', t('icons.remove'))
                .attr('class', 'remove form-field-button member-delete')
                .call(svgIcon('#iD-operation-delete'));

            if (taginfo) {
                wrapEnter.each(bindTypeahead);
            }


            // update
            items = items
                .merge(itemsEnter);

            items.select('input.member-role')
                .property('value', function(d) { return d.role; })
                .on('blur', changeRole)
                .on('change', changeRole);

            items.select('button.member-delete')
                .on('click', deleteMember);



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
                        // The `geometry` param is used in the `taginfo.js` interface for
                        // filtering results, as a key into the `tag_members_fractions`
                        // object.  If we don't know the geometry because the member is
                        // not yet downloaded, it's ok to guess based on type.
                        var geometry;
                        if (d.member) {
                            geometry = context.geometry(d.member.id);
                        } else if (d.type === 'relation') {
                            geometry = 'relation';
                        } else if (d.type === 'way') {
                            geometry = 'line';
                        } else {
                            geometry = 'point';
                        }

                        var rtype = entity.tags.type;
                        taginfo.roles({
                            debounce: true,
                            rtype: rtype || '',
                            geometry: geometry,
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


    rawMemberEditor.entityID = function(val) {
        if (!arguments.length) return _entityID;
        _entityID = val;
        return rawMemberEditor;
    };


    return rawMemberEditor;
}
