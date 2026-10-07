import { drag as d3_drag } from 'd3-drag';
import {
    select as d3_select
} from 'd3-selection';

import { presetManager } from '../../presets';
import { t } from '../../core/localizer';
import { actionChangeMember } from '../../actions/change_member';
import { actionDeleteMember } from '../../actions/delete_member';
import { actionMoveMember } from '../../actions/move_member';
import { modeBrowse } from '../../modes/browse';
import { modeSelect } from '../../modes/select';
import { osmIdManager } from '../../osm';
import { getRelationColor, osmMatchTags } from '../../osm/tags';
import { svgIcon } from '../../svg/icon';
import { services } from '../../services';
import { uiCombobox } from '../combobox';
import { uiSection } from '../section';
import { utilDisplayName, utilDisplayType, utilHighlightEntities, utilNoAuto, utilUniqueDomId } from '../../util';
import { prefs } from '../../core';

/** @type {WeakMap<import('../../osm').OsmEntity, import('../../presets/preset').PresetRoleDefinitions>} */
const relationRoleLabelsCache = new WeakMap();

/**
 * @param {iD.Context} context
 * @param {import('../../osm').OsmEntity} relation
 * @param {import('@openstreetmap/id-tagging-schema').Geometry} [memberGeom]
 * @param {Tags} [memberTags]
 */
export function getRelationRoleLabels(context, relation, memberGeom, memberTags) {
    if (!relationRoleLabelsCache.has(relation)) {
        const preset = presetManager.match(relation, context.graph());
        const basePreset = presetManager.matchTags({ type: relation.tags.type }, 'relation');
        const result = preset.relationSchema() || basePreset.relationSchema() || {};
        relationRoleLabelsCache.set(relation, result);
    }
    const cached = relationRoleLabelsCache.get(relation);
    if (!cached) return {};

    /** @type {Record<string, import('../../core/localizer').LocalizedTextRenderer>} */
    const labels = {};
    for (const role in cached) {
        const def = cached[role];
        // if there's a geometry filter, check that it passes
        if (memberGeom && def.member.geometry && !def.member.geometry.includes(memberGeom)) continue;
        // if there's a tags filter, check that it passes
        if (memberTags && def.member.matchTags && !osmMatchTags(def.member.matchTags, memberTags)) continue;

        labels[role] = def.label;
    }
    return labels;
}

export function uiSectionRawMemberEditor(context) {

    var section = uiSection('raw-member-editor', context)
        .shouldDisplay(function() {
            if (!_entityIDs || _entityIDs.length !== 1) return false;

            var entity = context.hasEntity(_entityIDs[0]);
            return entity && entity.type === 'relation';
        })
        .label(function() {
            var entity = context.hasEntity(_entityIDs[0]);
            if (!entity) return '';

            var gt = entity.members.length > _maxMembers ? '>' : '';
            var count = gt + entity.members.slice(0, _maxMembers).length;
            return t.append('inspector.title_count', { title: t.append('inspector.members'), count: count });
        })
        .disclosureContent(renderDisclosureContent);

    var taginfo = services.taginfo;
    var _entityIDs;
    var _maxMembers = 1000;

    function downloadMember(d3_event, d) {
        d3_event.preventDefault();

        // display the loading indicator
        d3_select(this).classed('loading', true);
        context.loadEntity(d.id, function() {
            section.reRender();
        });
    }

    function zoomToMember(d3_event, d) {
        d3_event.preventDefault();

        var entity = context.entity(d.id);
        context.map().zoomToEase(entity);

        // highlight the feature in case it wasn't previously on-screen
        utilHighlightEntities([d.id], true, context);
    }


    function selectMember(d3_event, d) {
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


    /** @param {import('../../osm').OsmEntity} relation */
    function displayRole(relation, role) {
        return getRelationRoleLabels(context, relation)[role] || role;
    }

    function changeRole(d3_event, d) {
        const input = d3_select(this);
        // this could be the raw role, or the label
        let rawValue = input.property('value');

        for (const [role, label] of Object.entries(getRelationRoleLabels(context, d.relation))) {
            if (rawValue === label) {
                rawValue = role;
            }
        }

        var oldRole = d.role;
        var newRole = context.cleanRelationRole(rawValue);

        // if the raw role was typed in, replace it with the label
        input.property('value', displayRole(d.relation, newRole));

        if (oldRole !== newRole) {
            var member = { id: d.id, type: d.type, role: newRole };
            context.perform(
                actionChangeMember(d.relation.id, member, d.index),
                t('operations.change_role.annotation', {
                    n: 1
                })
            );
            context.validator().validate();
        }
    }


    function deleteMember(d3_event, d) {

        // remove the hover-highlight styling
        utilHighlightEntities([d.id], false, context);

        context.perform(
            actionDeleteMember(d.relation.id, d.index),
            t('operations.delete_member.annotation', {
                n: 1
            })
        );

        if (!context.hasEntity(d.relation.id)) {
            // Removing the last member will also delete the relation.
            // If this happens we need to exit the selection mode
            context.enter(modeBrowse(context));
        } else {
            // Changing the mode also runs `validate`, but otherwise we need to
            // rerun it manually
            context.validator().validate();
        }
    }

    function renderDisclosureContent(selection) {

        var entityID = _entityIDs[0];

        var memberships = [];
        var entity = context.entity(entityID);
        entity.members.slice(0, _maxMembers).forEach(function(member, index) {
            memberships.push({
                index: index,
                id: member.id,
                type: member.type,
                role: member.role,
                relation: entity,
                member: context.hasEntity(member.id),
                domId: utilUniqueDomId(entityID + '-member-' + index)
            });
        });

        var list = selection.selectAll('.member-list')
            .data([0]);

        list = list.enter()
            .append('ul')
            .attr('class', 'member-list')
            .merge(list);


        var items = list.selectAll('li')
            .data(memberships, function(d) {
                return osmIdManager.key(d.relation) + ',' + d.index + ',' +
                    (d.member ? osmIdManager.key(d.member) : 'incomplete');
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
                    .attr('class', 'field-label')
                    .attr('for', d.domId);

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
                            var matched = presetManager.match(d.member, context.graph());
                            while (matched?.suggestion) {
                                // if is NSI preset: look for a parent preset
                                matched = matched.getParentPreset();
                            }
                            return (matched && matched.name()) || utilDisplayType(d.member.id);
                        });

                    const showThirdPartyIcons = prefs('preferences.privacy.thirdpartyicons') || 'true';
                    labelLink.each(function(d) {
                        if (!showThirdPartyIcons) return;
                        const matched = presetManager.match(d, context.graph());
                        if (matched.suggestion) {
                            // if matching an NSI preset: append icon
                            const img = d3_select(this)
                                .append('img');
                            img
                                .classed('member-entity-icon', true)
                                .on('load', () => img.classed('hide', false))
                                .on('error', () => img.classed('hide', true))
                                .attr('src', matched.imageURL);
                        }
                    });

                    labelLink.each(function(d) {
                        if (d.type !== 'relation') return;
                        const relColors = getRelationColor(d.member.tags, '#555');
                        const hasRef = d.member.tags.ref;
                        if (relColors.isValid || hasRef) {
                            const refs = (d.member.tags.ref || '').split(';');
                            for (const ref of refs) {
                                d3_select(this)
                                    .append('span')
                                    .classed('member-entity-ref-color', true)
                                    .style('border-color', relColors.color)
                                    .style('background-color', relColors.color)
                                    .style('color', relColors.textColor)
                                    .text(ref);
                            }
                        }
                    });

                    labelLink
                        .append('span')
                        .attr('class', 'member-entity-name')
                        .text(function(d) { return utilDisplayName(d.member, { hideRef: true }); });

                    label
                        .append('button')
                        .attr('title', t('icons.remove'))
                        .attr('class', 'remove member-delete')
                        .call(svgIcon('#iD-operation-delete'));

                    label
                        .append('button')
                        .attr('class', 'member-zoom')
                        .attr('title', t('icons.zoom_to'))
                        .call(svgIcon('#iD-icon-framed-dot', 'monochrome'))
                        .on('click', zoomToMember);

                } else {
                    var labelText = label
                        .append('span')
                        .attr('class', 'label-text');

                    labelText
                        .append('span')
                        .attr('class', 'member-entity-type')
                        .call(t.append('inspector.' + d.type, { id: d.id }));

                    labelText
                        .append('span')
                        .attr('class', 'member-entity-name')
                        .call(t.append('inspector.incomplete', { id: d.id }));

                    label
                        .append('button')
                        .attr('class', 'member-download')
                        .attr('title', t('icons.download'))
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
            .attr('id', function(d) {
                return d.domId;
            })
            .property('type', 'text')
            .attr('placeholder', t('inspector.role'))
            .call(utilNoAuto);

        if (taginfo) {
            wrapEnter.each(bindTypeahead);
        }

        // update
        items = items
            .merge(itemsEnter)
            .order();

        items.select('input.member-role')
            // use the label from the schema if possible
            .property('value', (d) => displayRole(d.relation, d.role))
            .on('blur', changeRole)
            .on('change', changeRole);

        items.select('button.member-delete')
            .on('click', deleteMember);

        var dragOrigin, targetIndex;

        items.call(d3_drag()
            .on('start', function(d3_event) {
                dragOrigin = {
                    x: d3_event.x,
                    y: d3_event.y
                };
                targetIndex = null;
            })
            .on('drag', function(d3_event) {
                var x = d3_event.x - dragOrigin.x,
                    y = d3_event.y - dragOrigin.y;

                if (!d3_select(this).classed('dragging') &&
                    // don't display drag until dragging beyond a distance threshold
                    Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) <= 5) return;

                var index = items.nodes().indexOf(this);

                d3_select(this)
                    .classed('dragging', true);

                targetIndex = null;

                selection.selectAll('li.member-row')
                    .style('transform', function(d2, index2) {
                        var node = d3_select(this).node();
                        if (index === index2) {
                            return 'translate(' + x + 'px, ' + y + 'px)';
                        } else if (index2 > index && d3_event.y > node.offsetTop) {
                            if (targetIndex === null || index2 > targetIndex) {
                                targetIndex = index2;
                            }
                            return 'translateY(-100%)';
                        } else if (index2 < index && d3_event.y < node.offsetTop + node.offsetHeight) {
                            if (targetIndex === null || index2 < targetIndex) {
                                targetIndex = index2;
                            }
                            return 'translateY(100%)';
                        }
                        return null;
                    });
            })
            .on('end', function(d3_event, d) {

                if (!d3_select(this).classed('dragging')) return;

                var index = items.nodes().indexOf(this);

                d3_select(this)
                    .classed('dragging', false);

                selection.selectAll('li.member-row')
                    .style('transform', null);

                if (targetIndex !== null) {
                    // dragged to a new position, reorder
                    context.perform(
                        actionMoveMember(d.relation.id, index, targetIndex),
                        t('operations.reorder_members.annotation')
                    );
                    context.validator().validate();
                }
            })
        );



        function bindTypeahead(d) {
            var row = d3_select(this);
            var role = row.selectAll('input.member-role');
            var origValue = role.property('value');

            const graph = context.graph();
            const memberGeometry = d.member?.geometry(graph);
            const rolesFromSchema = getRelationRoleLabels(context, d.relation, memberGeometry);

            const suggestionsFromSchema = Object.entries(rolesFromSchema)
                .filter(([, label]) => label) // skip roles with no labels
                .map(([role, label]) => ({ key: role, value: label, title: role }));

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

            const isKnown = value => (
                Object.values(rolesFromSchema).includes(value)
                || Object.keys(rolesFromSchema).includes(value)
            );

            const combo = uiCombobox(context, 'member-role')
                .minItems(1)
                .on('render', () => {
                    role.classed('known-value', isKnown(role.node().value));
                    role.classed('raw-value', role.node().value && !isKnown(role.node().value));
                })
                .data(suggestionsFromSchema)
                .fetcher(function(role, callback) {
                    callback(suggestionsFromSchema);
                    // The `geometry` param is used in the `taginfo.js` interface for
                    // filtering results, as a key into the `tag_members_fractions`
                    // object.  If we don't know the geometry because the member is
                    // not yet downloaded, it's ok to guess based on type.
                    var geometry;
                    if (d.member) {
                        geometry = context.graph().geometry(d.member.id);
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
                    }, (err, suggestionsFromTaginfo) => {
                        const data = [
                            ...suggestionsFromSchema,
                            ...suggestionsFromTaginfo
                                .filter(item => !rolesFromSchema[item.value]) // skip known values
                                .map(item => ({...item, klass: 'raw-option'}))
                        ];

                        if (!err) callback(sort(role, data));
                    });
                })
                .on('cancel', function() {
                    role.property('value', origValue);
                });

            role
                .classed('known-value', d => isKnown(d.role))
                .classed('raw-value', d => d.role && !isKnown(d.role))
                .call(combo);
        }


        function unbind() {
            var row = d3_select(this);

            row.selectAll('input.member-role')
                .call(uiCombobox.off, context);
        }
    }

    section.entityIDs = function(val) {
        if (!arguments.length) return _entityIDs;
        _entityIDs = val;
        return section;
    };


    return section;
}
