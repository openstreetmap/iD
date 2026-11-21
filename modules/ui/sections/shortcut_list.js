import { t } from '../../core/localizer';
import { svgIcon } from '../../svg/icon';
import { uiSection } from '../section';
import { presetShortcuts } from '../../core/preset_shortcuts';

import { uiPresetIcon } from '../preset_icon';
import { uiShortcutEditor } from '../shortcut_editor';
import { select as d3_select } from 'd3-selection';
import { presetManager } from '../../presets';

export function uiSectionShortcutList(context) {
    var section = uiSection('shortcuts-list', context)
        .label(() => t.append('preset_shortcuts_list.title'))
        .disclosureContent(renderDisclosureContent);

    function renderDisclosureContent(selection) {
        var shortcuts = presetShortcuts.getAllShortcuts();

        // Group shortcuts by geometry type and sort
        var groupedShortcuts = [];

        Object.keys(shortcuts).forEach(function(shortcut) {
            var presetId = shortcuts[shortcut];
            var preset = presetManager.item(presetId);
            if (preset) {
                groupedShortcuts.push({
                    shortcut: shortcut,
                    presetId: presetId,
                    preset: preset,
                    geometry: preset.geometry[0], // Take first geometry
                    shortcutNum: parseInt(shortcut, 10)
                });
            }
        });

        // Sort by geometry (node, line, area) then by shortcut number
        groupedShortcuts.sort(function(a, b) {
            var geometryOrder = { 'point': 0, 'line': 1, 'area': 2 };
            var aOrder = geometryOrder[a.geometry] || 3;
            var bOrder = geometryOrder[b.geometry] || 3;

            if (aOrder !== bOrder) {
                return aOrder - bOrder;
            }
            return a.shortcutNum - b.shortcutNum;
        });

        var container = selection.selectAll('.shortcuts-list-container')
            .data([0]);

        container = container.enter()
            .append('div')
            .attr('class', 'shortcuts-list-container')
            .merge(container);

        if (groupedShortcuts.length === 0) {
            var noShortcuts = container.selectAll('.no-shortcuts-message')
                .data([0]);

            noShortcuts.enter()
                .append('div')
                .attr('class', 'no-shortcuts-message')
                .text(t('preset_shortcuts_list.no_shortcuts'));

            container.selectAll('.shortcuts-list').remove();
            return;
        }

        container.selectAll('.no-shortcuts-message').remove();

        // Create shortcuts list
        var shortcutsList = container.selectAll('.shortcuts-list')
            .data([0]);

        shortcutsList = shortcutsList.enter()
            .append('div')
            .attr('class', 'shortcuts-list')
            .merge(shortcutsList);

        // Bind shortcut data
        var shortcutItems = shortcutsList.selectAll('.shortcut-item')
            .data(groupedShortcuts, function(d) { return d.shortcut; });

        // Remove old items
        shortcutItems.exit().remove();

        // Enter new items
        var shortcutItemsEnter = shortcutItems.enter()
            .append('div')
            .attr('class', 'shortcut-item');

        // Add preset icon
        shortcutItemsEnter
            .append('div')
            .attr('class', 'shortcut-preset-icon');

        // Add shortcut info
        var shortcutInfo = shortcutItemsEnter
            .append('div')
            .attr('class', 'shortcut-info');

        shortcutInfo
            .append('div')
            .attr('class', 'shortcut-number');

        shortcutInfo
            .append('div')
            .attr('class', 'shortcut-preset-name');

        shortcutInfo
            .append('div')
            .attr('class', 'shortcut-geometry');

        // Add action buttons
        var shortcutActions = shortcutItemsEnter
            .append('div')
            .attr('class', 'shortcut-actions');

        shortcutActions
            .append('button')
            .attr('class', 'shortcut-edit-btn')
            .attr('title', t('preset_shortcuts_list.edit_tooltip'))
            .call(svgIcon('#iD-icon-edit'));

        shortcutActions
            .append('button')
            .attr('class', 'shortcut-delete-btn')
            .attr('title', t('preset_shortcuts_list.delete_tooltip'))
            .call(svgIcon('#iD-icon-close'));

        // Merge and update all items
        shortcutItems = shortcutItemsEnter.merge(shortcutItems);

        // Update preset icons
        shortcutItems.select('.shortcut-preset-icon')
            .each(function(d) {
                var iconContainer = d3_select(this);
                iconContainer.selectAll('*').remove();
                iconContainer.call(uiPresetIcon()
                    .geometry(d.geometry)
                    .preset(d.preset));
            });

        // Update shortcut numbers
        shortcutItems.select('.shortcut-number')
            .text(function(d) { return d.shortcut; });

        // Update preset names
        shortcutItems.select('.shortcut-preset-name')
            .text(function(d) { return d.preset.name(); });

        // Update geometry labels
        shortcutItems.select('.shortcut-geometry')
            .text(function(d) {
                return t('geometry.' + d.geometry);
            });

        // Handle edit button clicks
        shortcutItems.select('.shortcut-edit-btn')
            .on('click', function(d3_event, d) {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                showInlineEditForm(this, d);
            });

        // Handle delete button clicks
        shortcutItems.select('.shortcut-delete-btn')
            .on('click', function(d3_event, d) {
                d3_event.preventDefault();
                d3_event.stopPropagation();

                // Remove the shortcut
                presetShortcuts.removeShortcut(d.presetId);

                // Re-render the list
                section.reRender();
            });
    }

    // Re-render when shortcuts change
    presetShortcuts.on('shortcutAdded', section.reRender);
    presetShortcuts.on('shortcutRemoved', section.reRender);
    presetShortcuts.on('shortcutChanged', section.reRender);

    // Function to show inline edit form
    function showInlineEditForm(buttonElement, data) {
        const shortcutItem = d3_select(buttonElement).select(function() {
            return this.closest('.shortcut-item');
        });

        // Check if edit form is already showing
        if (!shortcutItem.select('.edit-form').empty()) {
            return; // Form already visible
        }

        // Hide the normal content and show edit form
        shortcutItem.select('.shortcut-info').style('display', 'none');
        shortcutItem.select('.shortcut-actions').style('display', 'none');

        // Create edit form using reusable component
        const editForm = shortcutItem
            .append('div')
            .attr('class', 'edit-form');

        editForm.call(uiShortcutEditor(context)
            .preset(data.preset)
            .onSave(function() {
                hideEditForm(shortcutItem);
                section.reRender();
            })
            .onCancel(function() {
                hideEditForm(shortcutItem);
            })
            .onRemove(function() {
                hideEditForm(shortcutItem);
                section.reRender();
            })
        );
    }

    // Function to hide edit form and restore normal view
    function hideEditForm(shortcutItem) {
        shortcutItem.select('.edit-form').remove();
        shortcutItem.select('.shortcut-info').style('display', null);
        shortcutItem.select('.shortcut-actions').style('display', null);
    }

    return section;
}
