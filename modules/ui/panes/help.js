import { marked } from 'marked';
import { svgIcon } from '../../svg/icon';
import { uiIntro } from '../intro/intro';
import { uiPane } from '../pane';

import { t, localizer } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { helpHtml } from '../intro/helper';

export function uiPaneHelp(context) {

    var docKeys = [
        ['help', [
            'welcome',
            'open_data_h',
            'open_data',
            'before_start_h',
            'before_start',
            'open_source_h',
            'open_source',
            'open_source_help'
        ]],
        ['overview', [
            'navigation_h',
            'navigation_drag',
            'navigation_zoom',
            'features_h',
            'features',
            'nodes_ways'
        ]],
        ['editing', [
            'select_h',
            'select_left_click',
            'select_right_click',
            'select_space',
            'multiselect_h',
            'multiselect',
            'multiselect_shift_click',
            'multiselect_lasso',
            'undo_redo_h',
            'undo_redo',
            'save_h',
            'save',
            'save_validation',
            'upload_h',
            'upload',
            'backups_h',
            'backups',
            'keyboard_h',
            'keyboard'
        ]],
        ['feature_editor', [
            'intro',
            'definitions',
            'type_h',
            'type',
            'type_picker',
            'fields_h',
            'fields_all_fields',
            'fields_example',
            'fields_add_field',
            'tags_h',
            'tags_all_tags',
            'tags_resources'
        ]],
        ['points', [
            'intro',
            'add_point_h',
            'add_point',
            'add_point_finish',
            'move_point_h',
            'move_point',
            'delete_point_h',
            'delete_point',
            'delete_point_command'
        ]],
        ['lines', [
            'intro',
            'add_line_h',
            'add_line',
            'add_line_draw',
            'add_line_continue',
            'add_line_finish',
            'modify_line_h',
            'modify_line_dragnode',
            'modify_line_addnode',
            'connect_line_h',
            'connect_line',
            'connect_line_display',
            'connect_line_drag',
            'connect_line_tag',
            'disconnect_line_h',
            'disconnect_line_command',
            'move_line_h',
            'move_line_command',
            'move_line_connected',
            'delete_line_h',
            'delete_line',
            'delete_line_command'
        ]],
        ['areas', [
            'intro',
            'point_or_area_h',
            'point_or_area',
            'add_area_h',
            'add_area_command',
            'add_area_draw',
            'add_area_continue',
            'add_area_finish',
            'square_area_h',
            'square_area_command',
            'modify_area_h',
            'modify_area_dragnode',
            'modify_area_addnode',
            'delete_area_h',
            'delete_area',
            'delete_area_command'
        ]],
        ['relations', [
            'intro',
            'edit_relation_h',
            'edit_relation',
            'edit_relation_add',
            'edit_relation_delete',
            'maintain_relation_h',
            'maintain_relation',
            'relation_types_h',
            'multipolygon_h',
            'multipolygon',
            'multipolygon_create',
            'multipolygon_merge',
            'turn_restriction_h',
            'turn_restriction',
            'turn_restriction_field',
            'turn_restriction_editing',
            'route_h',
            'route',
            'route_add',
            'boundary_h',
            'boundary',
            'boundary_add'
        ]],
        ['operations', [
            'intro',
            'intro_2',
            'straighten',
            'orthogonalize',
            'circularize',
            'move',
            'rotate',
            'reflect',
            'continue',
            'reverse',
            'disconnect',
            'split',
            'extract',
            'merge',
            'delete',
            'downgrade',
            'copy_paste'
        ]],
        ['notes', [
            'intro',
            'add_note_h',
            'add_note',
            'place_note',
            'move_note',
            'update_note_h',
            'update_note',
            'save_note_h',
            'save_note'
        ]],
        ['imagery', [
            'intro',
            'sources_h',
            'choosing',
            'sources',
            'offsets_h',
            'offset',
            'offset_change'
        ]],
        ['streetlevel', [
            'intro',
            'using_h',
            'using',
            'photos',
            'viewer'
        ]],
        ['gps', [
            'intro',
            'survey',
            'using_h',
            'using',
            'tracing',
            'upload'
        ]],
        ['qa', [
            'intro',
            'tools_h',
            'tools',
            'issues_h',
            'issues'
        ]]
    ];

    var headings = {
        'help.help.open_data_h': 3,
        'help.help.before_start_h': 3,
        'help.help.open_source_h': 3,
        'help.overview.navigation_h': 3,
        'help.overview.features_h': 3,
        'help.editing.select_h': 3,
        'help.editing.multiselect_h': 3,
        'help.editing.undo_redo_h': 3,
        'help.editing.save_h': 3,
        'help.editing.upload_h': 3,
        'help.editing.backups_h': 3,
        'help.editing.keyboard_h': 3,
        'help.feature_editor.type_h': 3,
        'help.feature_editor.fields_h': 3,
        'help.feature_editor.tags_h': 3,
        'help.points.add_point_h': 3,
        'help.points.move_point_h': 3,
        'help.points.delete_point_h': 3,
        'help.lines.add_line_h': 3,
        'help.lines.modify_line_h': 3,
        'help.lines.connect_line_h': 3,
        'help.lines.disconnect_line_h': 3,
        'help.lines.move_line_h': 3,
        'help.lines.delete_line_h': 3,
        'help.areas.point_or_area_h': 3,
        'help.areas.add_area_h': 3,
        'help.areas.square_area_h': 3,
        'help.areas.modify_area_h': 3,
        'help.areas.delete_area_h': 3,
        'help.relations.edit_relation_h': 3,
        'help.relations.maintain_relation_h': 3,
        'help.relations.relation_types_h': 2,
        'help.relations.multipolygon_h': 3,
        'help.relations.turn_restriction_h': 3,
        'help.relations.route_h': 3,
        'help.relations.boundary_h': 3,
        'help.notes.add_note_h': 3,
        'help.notes.update_note_h': 3,
        'help.notes.save_note_h': 3,
        'help.imagery.sources_h': 3,
        'help.imagery.offsets_h': 3,
        'help.streetlevel.using_h': 3,
        'help.gps.using_h': 3,
        'help.qa.tools_h': 3,
        'help.qa.issues_h': 3
    };

    // For each section, squash all the texts into a single markdown document
    var docs = docKeys.map(function(key) {
        var helpkey = 'help.' + key[0];
        var helpPaneReplacements = { version: context.version };
        var text = key[1].reduce(function(all, part) {
            var subkey = helpkey + '.' + part;
            var depth = headings[subkey];                              // is this subkey a heading?
            var hhh = depth ? Array(depth + 1).join('#') + ' ' : '';   // if so, prepend with some ##'s
            return all + hhh + helpHtml(subkey, helpPaneReplacements) + '\n\n';
        }, '');

        return {
            title: t.html(helpkey + '.title'),
            content: marked(text.trim())
                // use keyboard key styling for shortcuts
                .replace(/<code>/g, '<kbd>')
                .replace(/<\/code>/g, '<\/kbd>')
        };
    });

    var helpPane = uiPane('help', context)
        .key(t('help.key'))
        .label(t.append('help.title'))
        .description(t.append('help.title'))
        .iconName('iD-icon-help');

    helpPane.renderContent = function(content) {

        function clickHelp(d, i) {

            var rtl = (localizer.textDirection() === 'rtl');
            content.property('scrollTop', 0);
            helpPane.selection().select('.pane-heading h2').html(d.title);

            body.html(d.content);
            body.selectAll('a')
                .attr('target', '_blank');
            menuItems.classed('selected', function(m) {
                return m.title === d.title;
            });

            nav.html('');
            if (rtl) {
                nav.call(drawNext).call(drawPrevious);
            } else {
                nav.call(drawPrevious).call(drawNext);
            }


            function drawNext(selection) {
                if (i < docs.length - 1) {
                    var nextLink = selection
                        .append('a')
                        .attr('href', '#')
                        .attr('class', 'next')
                        .on('click', function(d3_event) {
                            d3_event.preventDefault();
                            clickHelp(docs[i + 1], i + 1);
                        });

                    nextLink
                        .append('span')
                        .html(docs[i + 1].title)
                        .call(svgIcon((rtl ? '#iD-icon-backward' : '#iD-icon-forward'), 'inline'));
                }
            }


            function drawPrevious(selection) {
                if (i > 0) {
                    var prevLink = selection
                        .append('a')
                        .attr('href', '#')
                        .attr('class', 'previous')
                        .on('click', function(d3_event) {
                            d3_event.preventDefault();
                            clickHelp(docs[i - 1], i - 1);
                        });

                    prevLink
                        .call(svgIcon((rtl ? '#iD-icon-forward' : '#iD-icon-backward'), 'inline'))
                        .append('span')
                        .html(docs[i - 1].title);
                }
            }
        }


        function clickWalkthrough(d3_event) {
            d3_event.preventDefault();
            if (context.inIntro()) return;
            context.container().call(uiIntro(context));
            context.ui().togglePanes();
        }


        function clickShortcuts(d3_event) {
            d3_event.preventDefault();
            context.container().call(context.ui().shortcuts, true);
        }

        var toc = content
            .append('ul')
            .attr('class', 'toc');

        var menuItems = toc.selectAll('li')
            .data(docs)
            .enter()
            .append('li')
            .append('a')
            .attr('role', 'button')
            .attr('href', '#')
            .html(function(d) { return d.title; })
            .on('click', function(d3_event, d) {
                d3_event.preventDefault();
                clickHelp(d, docs.indexOf(d));
            });

        var shortcuts = toc
            .append('li')
            .attr('class', 'shortcuts')
            .call(uiTooltip()
                .title(() => t.append('shortcuts.tooltip'))
                .keys(['?'])
                .placement('top')
            )
            .append('a')
            .attr('href', '#')
            .on('click', clickShortcuts);

        shortcuts
            .append('div')
            .call(t.append('shortcuts.title'));

        var walkthrough = toc
            .append('li')
            .attr('class', 'walkthrough')
            .append('a')
            .attr('href', '#')
            .on('click', clickWalkthrough);

        walkthrough
            .append('svg')
            .attr('class', 'logo logo-walkthrough')
            .append('use')
            .attr('xlink:href', '#iD-logo-walkthrough');

        walkthrough
            .append('div')
            .call(t.append('splash.walkthrough'));


        var helpContent = content
            .append('div')
            .attr('class', 'left-content');

        var body = helpContent
            .append('div')
            .attr('class', 'body');

        var nav = helpContent
            .append('div')
            .attr('class', 'nav');

        clickHelp(docs[0], 0);
    };

    return helpPane;
}
