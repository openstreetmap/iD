import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { presetManager } from '../../presets';
import { t, localizer } from '../../core/localizer';

import { actionAddEntity } from '../../actions/add_entity';
import { actionAddMember } from '../../actions/add_member';
import { actionChangeMember } from '../../actions/change_member';
import { actionDeleteMember } from '../../actions/delete_member';

import { modeSelect } from '../../modes/select';
import { osmEntity, osmRelation } from '../../osm';
import { services } from '../../services';
import { svgIcon } from '../../svg/icon';
import { uiCombobox } from '../combobox';
import { uiSection } from '../section';
import { uiTooltip } from '../tooltip';
import { utilArrayGroupBy, utilDisplayName, utilNoAuto, utilHighlightEntities, utilUniqueDomId } from '../../util';


export function uiSectionRawMembershipEditor(context) {

    var section = uiSection('raw-membership-editor', context)
        .shouldDisplay(function() {
            return _entityIDs && _entityIDs.length === 1;
        })
        .title(function() {
            var entity = context.hasEntity(_entityIDs[0]);
            if (!entity) return '';

            var parents = context.graph().parentRelations(entity);
            var gt = parents.length > _maxMemberships ? '>' : '';
            var count = gt + parents.slice(0, _maxMemberships).length;
            return t('inspector.title_count', { title: t('inspector.relations'), count: count });
        })
        .disclosureContent(renderDisclosureContent);

    var taginfo = services.taginfo;
    var nearbyCombo = uiCombobox(context, 'parent-relation')
        .minItems(1)
        .fetcher(fetchNearbyRelations)
        .itemsMouseEnter(function(d) {
            if (d.relation) utilHighlightEntities([d.relation.id], true, context);
        })
        .itemsMouseLeave(function(d) {
            if (d.relation) utilHighlightEntities([d.relation.id], false, context);
        });
    var _inChange = false;
    var _entityIDs = [];
    var _showBlank;
    var _maxMemberships = 1000;

    function selectRelation(d) {
        d3_event.preventDefault();

        // remove the hover-highlight styling
        utilHighlightEntities([d.relation.id], false, context);

        context.enter(modeSelect(context, [d.relation.id]));
    }

    function zoomToRelation(d) {
        d3_event.preventDefault();

        var entity = context.entity(d.relation.id);
        context.map().zoomToEase(entity);

        // highlight the relation in case it wasn't previously on-screen
        utilHighlightEntities([d.relation.id], true, context);
    }


    function changeRole(d) {
        if (d === 0) return;    // called on newrow (shouldn't happen)
        if (_inChange) return;  // avoid accidental recursive call #5731

        var oldRole = d.member.role;
        var newRole = context.cleanRelationRole(d3_select(this).property('value'));

        if (oldRole !== newRole) {
            _inChange = true;
            context.perform(
                actionChangeMember(d.relation.id, Object.assign({}, d.member, { role: newRole }), d.index),
                t('operations.change_role.annotation')
            );
        }
        _inChange = false;
    }


    function addMembership(d, role) {
        this.blur();           // avoid keeping focus on the button
        _showBlank = false;

        var member = { id: _entityIDs[0], type: context.entity(_entityIDs[0]).type, role: role };

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

            context.enter(modeSelect(context, [relation.id]).newFeature(true));
        }
    }


    function deleteMembership(d) {
        this.blur();           // avoid keeping focus on the button
        if (d === 0) return;   // called on newrow (shouldn't happen)

        // remove the hover-highlight styling
        utilHighlightEntities([d.relation.id], false, context);

        context.perform(
            actionDeleteMember(d.relation.id, d.index),
            t('operations.delete_member.annotation')
        );
    }


    function fetchNearbyRelations(q, callback) {
        var newRelation = { relation: null, value: t('inspector.new_relation') };

        var entityID = _entityIDs[0];

        var result = [];

        var graph = context.graph();

        function baseDisplayLabel(entity) {
            var matched = presetManager.match(entity, graph);
            var presetName = (matched && matched.name()) || t('inspector.relation');
            var entityName = utilDisplayName(entity) || '';

            return presetName + ' ' + entityName;
        }

        var explicitRelation = q && context.hasEntity(q.toLowerCase());
        if (explicitRelation && explicitRelation.type === 'relation' && explicitRelation.id !== entityID) {
            // loaded relation is specified explicitly, only show that

            result.push({
                relation: explicitRelation,
                value: baseDisplayLabel(explicitRelation) + ' ' + explicitRelation.id
            });
        } else {

            context.history().intersects(context.map().extent()).forEach(function(entity) {
                if (entity.type !== 'relation' || entity.id === entityID) return;

                var value = baseDisplayLabel(entity);
                if (q && (value + ' ' + entity.id).toLowerCase().indexOf(q.toLowerCase()) === -1) return;

                result.push({ relation: entity, value: value });
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

    function renderDisclosureContent(selection) {

        var entityID = _entityIDs[0];

        var entity = context.entity(entityID);
        var parents = context.graph().parentRelations(entity);

        var memberships = [];

        parents.slice(0, _maxMemberships).forEach(function(relation) {
            relation.members.forEach(function(member, index) {
                if (member.id === entity.id) {
                    memberships.push({
                        relation: relation,
                        member: member,
                        index: index,
                        domId: utilUniqueDomId(entityID + '-membership-' + relation.id + '-' + index)
                    });
                }
            });
        });

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

        // highlight the relation in the map while hovering on the list item
        itemsEnter.on('mouseover', function(d) {
                utilHighlightEntities([d.relation.id], true, context);
            })
            .on('mouseout', function(d) {
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
                return (matched && matched.name()) || t('inspector.relation');
            });

        labelLink
            .append('span')
            .attr('class', 'member-entity-name')
            .text(function(d) { return utilDisplayName(d.relation); });

        labelEnter
            .append('button')
            .attr('tabindex', -1)
            .attr('class', 'remove member-delete')
            .call(svgIcon('#iD-operation-delete'))
            .on('click', deleteMembership);

        labelEnter
            .append('button')
            .attr('class', 'member-zoom')
            .attr('title', t('icons.zoom_to'))
            .call(svgIcon('#iD-icon-framed-dot', 'monochrome'))
            .on('click', zoomToRelation);

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
            .call(utilNoAuto)
            .property('value', function(d) { return d.member.role; })
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
            .attr('tabindex', -1)
            .attr('class', 'remove member-delete')
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
                .on('accept', acceptEntity)
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
            .attr('class', 'add-relation');

        addRelationButton
            .call(svgIcon('#iD-icon-plus', 'light'));
        addRelationButton
            .call(uiTooltip().title(t('inspector.add_to_relation')).placement(localizer.textDirection() === 'ltr' ? 'right' : 'left'));

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
                        geometry: context.graph().geometry(entityID),
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
        _entityIDs = val;
        _showBlank = false;
        return section;
    };


    return section;
}
