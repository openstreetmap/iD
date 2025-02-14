import {
    select as d3_select
} from 'd3-selection';

import { presetManager } from '../../presets';
import { t, localizer } from '../../core/localizer';

import { actionAddEntity } from '../../actions/add_entity';
import { actionAddMember } from '../../actions/add_member';
import { actionChangeMember } from '../../actions/change_member';
import { actionDeleteMembers } from '../../actions/delete_members';

import { modeSelect } from '../../modes/select';
import { osmEntity, osmRelation } from '../../osm';
import { isColourValid } from '../../osm/tags';
import { services } from '../../services';
import { svgIcon } from '../../svg/icon';
import { uiCombobox } from '../combobox';
import { uiSection } from '../section';
import { uiTooltip } from '../tooltip';
import { utilArrayGroupBy, utilArrayIntersection } from '../../util/array';
import { utilDisplayName, utilNoAuto, utilHighlightEntities, utilUniqueDomId } from '../../util';


export function uiSectionRawMembershipEditor(context) {

    var section = uiSection('raw-membership-editor', context)
        .shouldDisplay(function() {
            return _entityIDs && _entityIDs.length;
        })
        .label(function() {
            var parents = getSharedParentRelations();
            var gt = parents.length > _maxMemberships ? '>' : '';
            var count = gt + parents.slice(0, _maxMemberships).length;
            return t.append('inspector.title_count', { title: t('inspector.relations'), count: count });
        })
        .disclosureContent(renderDisclosureContent);

    var taginfo = services.taginfo;
    var nearbyCombo = uiCombobox(context, 'parent-relation')
        .minItems(1)
        .fetcher(fetchNearbyRelations)
        .itemsMouseEnter(function(d3_event, d) {
            if (d.relation) utilHighlightEntities([d.relation.id], true, context);
        })
        .itemsMouseLeave(function(d3_event, d) {
            if (d.relation) utilHighlightEntities([d.relation.id], false, context);
        });
    var _inChange = false;
    var _entityIDs = [];
    var _showBlank;
    var _maxMemberships = 1000;
    /** @type {Set<string>} relations that were added after this panel was opened */
    const recentlyAdded = new Set();

    function getSharedParentRelations() {
        var parents = [];
        for (var i = 0; i < _entityIDs.length; i++) {
            var entity = context.graph().hasEntity(_entityIDs[i]);
            if (!entity) continue;

            if (i === 0) {
                parents = context.graph().parentRelations(entity);
            } else {
                parents = utilArrayIntersection(parents, context.graph().parentRelations(entity));
            }
            if (!parents.length) break;
        }
        return parents;
    }

    function getMemberships() {

        var memberships = [];
        var relations = getSharedParentRelations().slice(0, _maxMemberships);

        var isMultiselect = _entityIDs.length > 1;

        var i, relation, membership, index, member, indexedMember;
        for (i = 0; i < relations.length; i++) {
            relation = relations[i];
            membership = {
                relation: relation,
                members: [],
                hash: osmEntity.key(relation)
            };
            for (index = 0; index < relation.members.length; index++) {
                member = relation.members[index];
                if (_entityIDs.indexOf(member.id) !== -1) {
                    indexedMember = Object.assign({}, member, { index: index });
                    membership.members.push(indexedMember);
                    membership.hash += ',' + index.toString();

                    if (!isMultiselect) {
                        // For single selections, list one entry per membership per relation.
                        // For multiselections, list one entry per relation.

                        memberships.push(membership);
                        membership = {
                            relation: relation,
                            members: [],
                            hash: osmEntity.key(relation)
                        };
                    }
                }
            }
            if (membership.members.length) memberships.push(membership);
        }

        memberships.forEach(function(membership) {
            membership.domId = utilUniqueDomId('membership-' + membership.relation.id);
            var roles = [];
            membership.members.forEach(function(member) {
                if (roles.indexOf(member.role) === -1) roles.push(member.role);
            });
            membership.role = roles.length === 1 ? roles[0] : roles;
        });

        const existingRelations = memberships
            .filter(membership => !recentlyAdded.has(membership.relation.id))
            .map(membership => ({
                ...membership,
                // We only sort relations that were not added just now.
                // Sorting uses the same label as shown in the UI.
                // If the label is not unique, the relation ID ensures
                // that the sort order is still stable.
                _sortKey: [
                    baseDisplayValue(membership.relation),
                    membership.relation.id,
                ].join('-'),
            }))
            .sort((a, b) => {
                return a._sortKey.localeCompare(
                    b._sortKey,
                    localizer.localeCodes(),
                    { numeric: true },
                );
            });


        const newlyAddedRelations = memberships
            .filter(membership => recentlyAdded.has(membership.relation.id));

        return [
            // the sorted relations come first
            ...existingRelations,
            // then the ones that were just added from this panel
            ...newlyAddedRelations,
        ];
    }

    function selectRelation(d3_event, d) {
        d3_event.preventDefault();

        // remove the hover-highlight styling
        utilHighlightEntities([d.relation.id], false, context);

        context.enter(modeSelect(context, [d.relation.id]));
    }

    function zoomToRelation(d3_event, d) {
        d3_event.preventDefault();

        var entity = context.entity(d.relation.id);
        context.map().zoomToEase(entity);

        // highlight the relation in case it wasn't previously on-screen
        utilHighlightEntities([d.relation.id], true, context);
    }


    function changeRole(d3_event, d) {
        if (d === 0) return;    // called on newrow (shouldn't happen)
        if (_inChange) return;  // avoid accidental recursive call #5731

        var newRole = context.cleanRelationRole(d3_select(this).property('value'));

        if (!newRole.trim() && typeof d.role !== 'string') return;

        var membersToUpdate = d.members.filter(function(member) {
            return member.role !== newRole;
        });

        if (membersToUpdate.length) {
            _inChange = true;
            context.perform(
                function actionChangeMemberRoles(graph) {
                    membersToUpdate.forEach(function(member) {
                        var newMember = Object.assign({}, member, { role: newRole });
                        delete newMember.index;
                        graph = actionChangeMember(d.relation.id, newMember, member.index)(graph);
                    });
                    return graph;
                },
                t('operations.change_role.annotation', {
                    n: membersToUpdate.length
                })
            );
            context.validator().validate();
        }
        _inChange = false;
    }


    function addMembership(d, role) {
        _showBlank = false;

        function actionAddMembers(relationId, ids, role) {
            return function(graph) {
                for (var i in ids) {
                    var member = { id: ids[i], type: graph.entity(ids[i]).type, role: role };
                    graph = actionAddMember(relationId, member)(graph);
                }
                return graph;
            };
        }

        if (d.relation) {
            recentlyAdded.add(d.relation.id);
            context.perform(
                actionAddMembers(d.relation.id, _entityIDs, role),
                t('operations.add_member.annotation', {
                    n: _entityIDs.length
                })
            );
            context.validator().validate();

        } else {
            var relation = osmRelation();
            context.perform(
                actionAddEntity(relation),
                actionAddMembers(relation.id, _entityIDs, role),
                t('operations.add.annotation.relation')
            );
            // changing the mode also runs `validate`
            context.enter(modeSelect(context, [relation.id]).newFeature(true));
        }
    }


    function downloadMembers(d3_event, d) {
        d3_event.preventDefault();
        const button = d3_select(this);

        // display the loading indicator
        button.classed('loading', true);
        context.loadEntity(d.relation.id, function() {
            section.reRender();
        });
    }


    function deleteMembership(d3_event, d) {
        this.blur();           // avoid keeping focus on the button
        if (d === 0) return;   // called on newrow (shouldn't happen)

        // remove the hover-highlight styling
        utilHighlightEntities([d.relation.id], false, context);

        var indexes = d.members.map(function(member) {
            return member.index;
        });

        context.perform(
            actionDeleteMembers(d.relation.id, indexes),
            t('operations.delete_member.annotation', {
                n: _entityIDs.length
            })
        );
        context.validator().validate();
    }


    function fetchNearbyRelations(q, callback) {
        var newRelation = {
            relation: null,
            value: t('inspector.new_relation'),
            display: t.append('inspector.new_relation')
        };

        var entityID = _entityIDs[0];

        var result = [];

        var graph = context.graph();

        function baseDisplayLabel(entity) {
            var matched = presetManager.match(entity, graph);
            var presetName = (matched && matched.name()) || t('inspector.relation');
            var entityName = utilDisplayName(entity) || '';

            return selection => {
                selection
                    .append('b')
                    .text(presetName + ' ');
                selection
                    .append('span')
                    .classed('has-colour', entity.tags.colour && isColourValid(entity.tags.colour))
                    .style('border-color', entity.tags.colour)
                    .text(entityName);
            };
        }

        var explicitRelation = q && context.hasEntity(q.toLowerCase());
        if (explicitRelation && explicitRelation.type === 'relation' && explicitRelation.id !== entityID) {
            // loaded relation is specified explicitly, only show that

            result.push({
                relation: explicitRelation,
                value: baseDisplayValue(explicitRelation) + ' ' + explicitRelation.id,
                display: baseDisplayLabel(explicitRelation)
            });
        } else {

            context.history().intersects(context.map().extent()).forEach(function(entity) {
                if (entity.type !== 'relation' || entity.id === entityID) return;

                var value = baseDisplayValue(entity);
                if (q && (value + ' ' + entity.id).toLowerCase().indexOf(q.toLowerCase()) === -1) return;

                result.push({
                    relation: entity,
                    value,
                    display: baseDisplayLabel(entity)
                });
            });

            result.sort(function(a, b) {
                return osmRelation.creationOrder(a.relation, b.relation);
            });

            // Dedupe identical names by appending relation id - see #2891
            var dupeGroups = Object.values(utilArrayGroupBy(result, 'value'))
                .filter(function(v) { return v.length > 1; });

            dupeGroups.forEach(function(group) {
                group.forEach(function(obj) {
                    obj.value += ' ' + obj.relation.id;
                });
            });
        }

        result.forEach(function(obj) {
            obj.title = obj.value;
        });

        result.unshift(newRelation);
        callback(result);
    }

    function baseDisplayValue(entity) {
        const graph = context.graph();
        var matched = presetManager.match(entity, graph);
        var presetName = (matched && matched.name()) || t('inspector.relation');
        var entityName = utilDisplayName(entity) || '';

        return presetName + ' ' + entityName;
    }

    function renderDisclosureContent(selection) {

        var memberships = getMemberships();

        var list = selection.selectAll('.member-list')
            .data([0]);

        list = list.enter()
            .append('ul')
            .attr('class', 'member-list')
            .merge(list);


        var items = list.selectAll('li.member-row-normal')
            .data(memberships, function(d) {
                return d.hash;
            });

        items.exit()
            .each(unbind)
            .remove();

        // Enter
        var itemsEnter = items.enter()
            .append('li')
            .attr('class', 'member-row member-row-normal form-field');

        // highlight the relation in the map while hovering on the list item
        itemsEnter.on('mouseover', function(d3_event, d) {
                utilHighlightEntities([d.relation.id], true, context);
            })
            .on('mouseout', function(d3_event, d) {
                utilHighlightEntities([d.relation.id], false, context);
            });

        var labelEnter = itemsEnter
            .append('label')
            .attr('class', 'field-label')
            .attr('for', function(d) {
                return d.domId;
            });

        var labelLink = labelEnter
            .append('span')
            .attr('class', 'label-text')
            .append('a')
            .attr('href', '#')
            .on('click', selectRelation);

        labelLink
            .append('span')
            .attr('class', 'member-entity-type')
            .text(function(d) {
                var matched = presetManager.match(d.relation, context.graph());
                return (matched && matched.name()) || t.html('inspector.relation');
            });

        labelLink
            .append('span')
            .attr('class', 'member-entity-name')
            .classed('has-colour', d => d.relation.tags.colour && isColourValid(d.relation.tags.colour))
            .style('border-color', d => d.relation.tags.colour)
            .html(function(d) {
                const matched = presetManager.match(d.relation, context.graph());
                // hide the network from the name if there is NSI match
                return utilDisplayName(d.relation, matched.suggestion);
            });

        labelEnter
            .append('button')
            .attr('class', 'members-download')
            .attr('title', t('icons.download'))
            .call(svgIcon('#iD-icon-load'))
            .on('click', downloadMembers);

        labelEnter
            .append('button')
            .attr('class', 'remove member-delete')
            .attr('title', t('icons.remove'))
            .call(svgIcon('#iD-operation-delete'))
            .on('click', deleteMembership);

        labelEnter
            .append('button')
            .attr('class', 'member-zoom')
            .attr('title', t('icons.zoom_to'))
            .call(svgIcon('#iD-icon-framed-dot', 'monochrome'))
            .on('click', zoomToRelation);

        items = items.merge(itemsEnter);
        items.selectAll('button.members-download')
            .classed('hide', d => {
                const graph = context.graph();
                return d.relation.members.every(m => graph.hasEntity(m.id));
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
            .property('value', function(d) {
                return typeof d.role === 'string' ? d.role : '';
            })
            .attr('title', function(d) {
                return Array.isArray(d.role) ? d.role.filter(Boolean).join('\n') : d.role;
            })
            .attr('placeholder', function(d) {
                return Array.isArray(d.role) ? t('inspector.multiple_roles') : t('inspector.role');
            })
            .classed('mixed', function(d) {
                return Array.isArray(d.role);
            })
            .call(utilNoAuto)
            .on('blur', changeRole)
            .on('change', changeRole);

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

        var newLabelEnter = newMembershipEnter
            .append('label')
            .attr('class', 'field-label');

        newLabelEnter
            .append('input')
            .attr('placeholder', t('inspector.choose_relation'))
            .attr('type', 'text')
            .attr('class', 'member-entity-input')
            .call(utilNoAuto);

        newLabelEnter
            .append('button')
            .attr('class', 'remove member-delete')
            .attr('title', t('icons.remove'))
            .call(svgIcon('#iD-operation-delete'))
            .on('click', function() {
                list.selectAll('.member-row-new')
                    .remove();
            });

        var newWrapEnter = newMembershipEnter
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-member');

        newWrapEnter
            .append('input')
            .attr('class', 'member-role')
            .property('type', 'text')
            .attr('placeholder', t('inspector.role'))
            .call(utilNoAuto);

        // Update
        newMembership = newMembership
            .merge(newMembershipEnter);

        newMembership.selectAll('.member-entity-input')
            .on('blur', cancelEntity)   // if it wasn't accepted normally, cancel it
            .call(nearbyCombo
                .on('accept', function(d) {
                    this.blur(); // always blurs the triggering element
                    acceptEntity.call(this, d);
                })
                .on('cancel', cancelEntity)
            );


        // Container for the Add button
        var addRow = selection.selectAll('.add-row')
            .data([0]);

        // enter
        var addRowEnter = addRow.enter()
            .append('div')
            .attr('class', 'add-row');

        var addRelationButton = addRowEnter
            .append('button')
            .attr('class', 'add-relation')
            .attr('aria-label', t('inspector.add_to_relation'));

        addRelationButton
            .call(svgIcon('#iD-icon-plus', 'light'));
        addRelationButton
            .call(uiTooltip()
                .title(() => t.append('inspector.add_to_relation'))
                .placement(localizer.textDirection() === 'ltr' ? 'right' : 'left'));

        addRowEnter
            .append('div')
            .attr('class', 'space-value');   // preserve space

        addRowEnter
            .append('div')
            .attr('class', 'space-buttons');  // preserve space

        // update
        addRow = addRow
            .merge(addRowEnter);

        addRow.select('.add-relation')
            .on('click', function() {
                _showBlank = true;
                section.reRender();
                list.selectAll('.member-entity-input').node().focus();
            });


        function acceptEntity(d) {
            if (!d) {
                cancelEntity();
                return;
            }
            // remove hover-higlighting
            if (d.relation) utilHighlightEntities([d.relation.id], false, context);

            var role = context.cleanRelationRole(list.selectAll('.member-row-new .member-role').property('value'));
            addMembership(d, role);
        }


        function cancelEntity() {
            var input = newMembership.selectAll('.member-entity-input');
            input.property('value', '');

            // remove hover-higlighting
            context.surface().selectAll('.highlighted')
                .classed('highlighted', false);
        }


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
                        geometry: context.graph().geometry(_entityIDs[0]),
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
                .call(uiCombobox.off, context);
        }
    }


    section.entityIDs = function(val) {
        if (!arguments.length) return _entityIDs;
        const didChange = _entityIDs.join(',') !== val.join(',');
        _entityIDs = val;
        _showBlank = false;
        if (didChange) {
            recentlyAdded.clear(); // reset when the selected feature changes
        }
        return section;
    };


    return section;
}
