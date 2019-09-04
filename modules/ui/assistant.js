import _debounce from 'lodash-es/debounce';
import { dataEn } from '../../data';
import { drag as d3_drag } from 'd3-drag';
import {
    select as d3_select,
    event as d3_event
} from 'd3-selection';
import { svgIcon } from '../svg/icon';
import { currentLocale, t, textDirection } from '../util/locale';
import { services } from '../services';
import { utilDisplayLabel } from '../util';
import { uiIntro } from './intro';
import { uiSuccess } from './success';
import { uiPresetIcon } from './preset_icon';
import { uiEntityEditor } from './entity_editor';
import { uiFeatureList } from './feature_list';
import { uiNoteEditor } from './note_editor';
import { uiKeepRightEditor } from './keepRight_editor';
import { uiImproveOsmEditor } from './improveOSM_editor';
import { uiDataEditor } from './data_editor';
import { uiCommit } from './commit';
import { geoRawMercator } from '../geo/raw_mercator';
import { utilGetDimensions } from '../util/dimensions';
import { decimalCoordinatePair, formattedRoundedDuration } from '../util/units';

function utilTimeOfDayGreeting() {
    return t('assistant.greetings.' + utilTimeframe());
}

function utilTimeframe() {
    var now = new Date();
    var hours = now.getHours();
    if (hours >= 20 || hours <= 2) return 'night';
    if (hours >= 18) return 'evening';
    if (hours >= 12) return 'afternoon';
    return 'morning';
}

function utilGreetingIcon() {
    var now = new Date();
    var hours = now.getHours();
    if (hours >= 6 && hours < 18) return 'fas-sun';
    return 'fas-moon';
}

export function uiAssistant(context) {

    var defaultLoc = t('assistant.global_location');
    var currLocation = defaultLoc;

    var container = d3_select(null),
        header = d3_select(null),
        body = d3_select(null);

    var featureSearch = uiFeatureList(context);

    var savedChangeset = null;
    var savedChangeCount = null;
    var didEditAnythingYet = false;

    context.storage('sawSplash', true);

    var assistant = function(selection) {

        container = selection.append('div')
            .attr('class', 'assistant');
        header = container.append('div')
            .attr('class', 'assistant-header assistant-row');
        body = container.append('div')
            .attr('class', 'assistant-body');

        var dragOffset;
        var resizer = container
            .append('div')
            .attr('class', 'resizer-x');

        // Set the initial width
        container
            .style('width', '350px');

        resizer.call(d3_drag()
            .container(d3_select('#id-container').node())
            .on('start', function() {
                resizer.classed('dragging', true);

                dragOffset = d3_event.sourceEvent.offsetX;

                // account for from the assistant wrap's padding
                dragOffset += 10;
            })
            .on('drag', function() {

                var x = d3_event.x - dragOffset;

                var targetWidth = (textDirection === 'rtl') ? utilGetDimensions(d3_select('#content')).width - x: x;
                container
                    .style('width', targetWidth + 'px');
            })
            .on('end', function() {
                resizer.classed('dragging', false);
            })
        );

        scheduleCurrentLocationUpdate();

        context
            .on('enter.assistant', redraw);

        context.map()
            .on('move.assistant', scheduleCurrentLocationUpdate);

        redraw();
    };

    function isBodyCollapsed(collapseCategory) {
        return collapseCategory && context.storage('assistant.collapsed.' + collapseCategory) === 'true';
    }

    function setIsBodyCollapsed(collapseCategory, flag) {
        if (!flag) flag = null;
        if (collapseCategory) context.storage('assistant.collapsed.' + collapseCategory, flag);
    }

    function updateDidEditStatus() {
        savedChangeset = null;
        savedChangeCount = null;
        didEditAnythingYet = true;
    }

    function toggleBody(collapseCategory) {
        var bodyOpen = isBodyCollapsed(collapseCategory);
        setIsBodyCollapsed(collapseCategory, !bodyOpen);

        container.classed('body-collapsed', !bodyOpen);
        container.classed('minimal', false);
        container.selectAll('.assistant-header .control-col .icon use')
            .attr('href', '#iD-icon-' + (bodyOpen ? 'up' : 'down'));

        if (!bodyOpen) {
            container.on('mouseleave.minimal', function() {
                container.classed('minimal', true);
            });
        } else {
            container.on('mouseleave.minimal', null);
        }
    }

    function drawPanel(panel) {

        var hasBody = panel.renderBody || panel.message;

        var isCollapsible = !panel.prominent && hasBody;

        container.attr('class',
            'assistant ' +
            (panel.theme || 'dark') +
            ' ' +
            (panel.prominent ? 'prominent' : '') +
            ' ' +
            (hasBody ? 'has-body' : '') +
            ' ' +
            (isCollapsible ? 'collapsible' : '') +
            ' ' +
            (isCollapsible && isBodyCollapsed(panel.collapseCategory) ? 'body-collapsed minimal' : '')
        );

        var iconCol = header.selectAll('.icon-col')
            .data([0]);
        iconCol = iconCol.enter()
            .append('div')
            .attr('class', 'icon-col')
            .merge(iconCol);

        var headerMainCol = header.selectAll('.main-col')
            .data([0]);

        var headerMainColEnter = headerMainCol.enter()
            .append('div')
            .attr('class', 'main-col');

        headerMainColEnter.append('div')
            .attr('class', 'mode-label');

        var subjectTitleArea = headerMainColEnter.append('div')
            .attr('class', 'subject-title');

        subjectTitleArea.append('span');

        subjectTitleArea.append('div')
            .attr('class', 'controls');

        headerMainColEnter.append('div')
            .attr('class', 'header-body');

        headerMainCol = headerMainColEnter.merge(headerMainCol);

        var controlCol = header.selectAll('.control-col')
            .data(isCollapsible ? [0] : []);

        controlCol.exit()
            .remove();

        controlCol.enter()
            .append('div')
            .attr('class', 'control-col')
            .append('button')
            .call(svgIcon('#iD-icon-' + (isBodyCollapsed(panel.collapseCategory) ? 'down' : 'up')));

        if (isCollapsible) {
            // make the assistant collapsible by its whole header
            header.on('click', function() {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                toggleBody(panel.collapseCategory);
            });
        } else {
            header.on('click', null);
        }

        var modeLabel = headerMainCol.selectAll('.mode-label');
        modeLabel.text(panel.modeLabel || '');

        var subjectTitle = headerMainCol.selectAll('.subject-title');

        subjectTitle.selectAll('span')
            .attr('class', panel.titleClass || '')
            .text(panel.title);

        var subjectTitleControls = subjectTitle.selectAll('.controls');
        subjectTitleControls.text('');
        if (panel.onClose) {
            subjectTitleControls.append('button')
                .attr('class', 'close')
                .on('click', function() {
                    d3_event.preventDefault();
                    d3_event.stopPropagation();
                    panel.onClose();
                })
                .call(svgIcon('#iD-icon-close'));
        }

        iconCol.html('');
        if (panel.headerIcon) {
            iconCol.call(svgIcon('#' + panel.headerIcon));
        } else {
            iconCol.call(panel.renderHeaderIcon);
        }

        body.text('');
        if (panel.renderBody) {
            body.call(panel.renderBody);
        }

        var headerBody = headerMainCol.selectAll('.header-body');
        headerBody.text('');
        if (panel.renderHeaderBody) {
            headerBody.call(panel.renderHeaderBody);
        }

        if (panel.message) {
            var bodyTextRow = body.append('div')
                .attr('class', 'assistant-row');

            bodyTextRow.append('div')
                .attr('class', 'icon-col');

            var bodyBodyCol = bodyTextRow
                .append('div')
                .attr('class', 'main-col sep-top');

            var bodyTextArea = bodyBodyCol
                .append('div')
                .attr('class', 'body-text');

            bodyTextArea.html(panel.message);
        }
    }

    function panelToDraw() {

        var mode = context.mode();

        if (mode.id === 'save') {

            if (context.connection() && context.connection().authenticated()) {
                return panelSave(context);
            } else {
                return panelAuthenticating(context);
            }

        } else if (mode.id === 'add-point' || mode.id === 'add-line' ||
            mode.id === 'add-area' || mode.id === 'draw-line' ||
            mode.id === 'draw-area') {

            return panelAddDrawGeometry(context, mode);

        } else if (mode.id === 'select') {

            return panelSelect(context, mode.selectedIDs());

        } else if (mode.id === 'select-note') {
            var note = context.connection() && context.connection().getNote(mode.selectedNoteID());
            if (note) {
                return panelSelectNote(context, note);
            }
        } else if (mode.id === 'select-error') {
            if (mode.selectedErrorService() === 'keepRight') {
                return panelSelectKeepRightError(context, mode.selectedErrorID());
            } else if (mode.selectedErrorService() === 'improveOSM') {
                return panelSelectImproveOSMError(context, mode.selectedErrorID());
            }
        } else if (mode.id === 'select-data') {
            return panelSelectCustomData(context, mode.selectedDatum());
        } else if (!didEditAnythingYet) {

            if (savedChangeset) {
                return panelSuccess(context);
            }
            if (context.history().hasRestorableChanges()) {
                return panelRestore(context);
            }
            return panelWelcome(context);
        }

        scheduleCurrentLocationUpdate();
        return panelMapping(context);
    }

    function redraw() {
        if (container.empty()) return;

        var mode = context.mode();
        if (!mode || !mode.id) return;

        if (mode.id !== 'browse') {
            updateDidEditStatus();
        }

        drawPanel(panelToDraw());
    }

    function scheduleCurrentLocationUpdate() {
        debouncedGetLocation(context.map().center(), context.map().zoom(), function(placeName) {
            currLocation = placeName ? placeName : defaultLoc;
            container.selectAll('.map-center-location')
                .text(currLocation);
        });
    }

    var debouncedGetLocation = _debounce(getLocation, 250);
    function getLocation(loc, zoom, completionHandler) {

        if (!services.geocoder || (zoom && zoom < 9)) {
            completionHandler(null);
            return;
        }

        services.geocoder.reverse(loc, function(err, result) {
            if (err || !result || !result.address) {
                completionHandler(null);
                return;
            }

            var addr = result.address;
            var place = ((!zoom || zoom > 14) && addr && (addr.town || addr.city || addr.county)) || '';
            var region = (addr && (addr.state || addr.country)) || '';
            var separator = (place && region) ? t('success.thank_you_where.separator') : '';

            var formattedName = t('success.thank_you_where.format',
                { place: place, separator: separator, region: region }
            );

            completionHandler(formattedName);
        });
    }

    assistant.didSaveChangset = function(changeset, count) {
        savedChangeset = changeset;
        savedChangeCount = count;
        didEditAnythingYet = false;
        redraw();
    };

    return assistant;

    function panelWelcome(context) {

        var panel = {
            prominent: true,
            theme: 'light',
            headerIcon: utilGreetingIcon(),
            title: utilTimeOfDayGreeting(),
            onClose: function() {
                updateDidEditStatus();
                redraw();
            }
        };

        function renderFirstSessionHeader(selection, bodyTextArea) {
            var firstTimeInfo = t('assistant.launch.osm_info') + '<br/>' +
                                t('assistant.launch.first_time_tutorial') + '<br/>' +
                                t('assistant.launch.thanks_have_fun');
            bodyTextArea.html(firstTimeInfo);
            bodyTextArea.selectAll('a')
                .attr('href', '#')
                .on('click', function() {
                    context.isFirstSession = false;
                    updateDidEditStatus();
                    context.container().call(uiIntro(context));
                    redraw();
                });

            selection
                .append('div')
                .attr('class', 'main-footer')
                .append('button')
                .attr('class', 'primary')
                .on('click', function() {
                    updateDidEditStatus();
                    redraw();
                })
                .append('span')
                .text(t('assistant.launch.start_mapping'));
        }

        function renderBlockedAccountHeader(selection, bodyTextArea, details) {

            var link = bodyTextArea
                .html(t('assistant.launch.blocks.active', { displayName: '<b>' + details.display_name + '</b>' }))
                .append('a')
                .attr('class', 'link-out')
                .attr('target', '_blank')
                .attr('tabindex', -1)
                .attr('href', context.connection().userURL(details.display_name) + '/blocks');

            link.append('span')
                .text(' ' + t('success.help_link_text'));
            link
                .call(svgIcon('#iD-icon-out-link', 'inline'));

            d3_select('.assistant-header .subject-title span')
                .text(t('assistant.notice'));
            d3_select('.assistant-header .icon-col .icon use')
                .attr('href', '#iD-icon-alert');
        }

        function renderAccountAnniversaryHeader(selection, bodyTextArea, details, joinDate, now) {

            var yearCount = now.getFullYear() - joinDate.getFullYear();
            var anniversaryInfo = t('assistant.launch.anniversary.years.' + (yearCount === 1 ? 'first' : 'subsequent'), {
                                      years: '<b>' + yearCount + '</b>',
                                      displayName: '<b>' + details.display_name + '</b>'
                                  }) + '<br/>' +
                                  t('assistant.launch.changesets_date', {
                                      changesets: '<b>' + details.changesets_count + '</b>',
                                      joinDate: '<b>' + joinDate.toLocaleDateString(currentLocale, { day: 'numeric', month: 'long', year: 'numeric' }) + '</b>'
                                  });
            bodyTextArea.html(anniversaryInfo);

            d3_select('.assistant-header .subject-title span')
                .text(t('assistant.launch.anniversary.happy_anniversary'));
            d3_select('.assistant-header .icon-col .icon use')
                .attr('href', '#fas-birthday-cake');
        }

        panel.renderHeaderBody = function(selection) {

            var bodyTextArea = selection
                .append('div')
                .attr('class', 'body-text');

            var osm = context.connection();

            if (context.isFirstSession) {
                renderFirstSessionHeader(selection, bodyTextArea);
                return;
            }

            var genericWelcomesCount = 2;
            bodyTextArea.html(t('assistant.launch.generic_welcome.' + Math.floor(Math.random() * genericWelcomesCount)));

            if (!osm.authenticated()) return;

            osm.userDetails(function(err, details) {

                if (err || !details) return;

                var joinDate = new Date(details.account_created);
                var now = new Date();

                if (details.active_blocks > 0) {
                    // user has been blocked
                    renderBlockedAccountHeader(selection, bodyTextArea, details);

                } else if (joinDate.getDate() === now.getDate() &&
                    joinDate.getMonth() === now.getMonth() &&
                    details.changesets_count > 1) {
                    // OSM anniversary
                    renderAccountAnniversaryHeader(selection, bodyTextArea, details, joinDate, now);

                } else {
                    var loggedInInfo = t('assistant.launch.welcome_back_user', {
                                           displayName: '<b>' + details.display_name + '</b>'
                                       }) + '<br/>' +
                                       t('assistant.launch.changesets', {
                                           changesets: '<b>' + details.changesets_count + '</b>'
                                       });
                    bodyTextArea.html(loggedInInfo);
                }
            });
        };

        return panel;
    }

    function panelRestore(context) {

        var panel = {
            prominent: true,
            theme: 'light',
            headerIcon: utilGreetingIcon(),
            title: utilTimeOfDayGreeting()
        };

        panel.renderHeaderBody = function(selection) {

            var bodyTextArea = selection
                .append('div')
                .attr('class', 'body-text');

            var mainFooter = selection
                .append('div')
                .attr('class', 'main-footer');

            var savedHistoryJSON = JSON.parse(context.history().savedHistoryJSON());

            var lastGraph = savedHistoryJSON.stack &&
                savedHistoryJSON.stack.length > 0 &&
                savedHistoryJSON.stack[savedHistoryJSON.stack.length - 1];
            if (!lastGraph) return;

            var changeCount = (lastGraph.modified ? lastGraph.modified.length : 0) +
                (lastGraph.deleted ? lastGraph.deleted.length : 0);
            if (changeCount === 0) return;

            var loc = lastGraph.transform &&
                geoRawMercator()
                .transform(lastGraph.transform)
                .invert([0, 0]);
            if (!loc) return;

            var restoreInfoDict = {
                count: '<b>' + changeCount.toString() + '</b>',
                location: '<b class="restore-location">' + decimalCoordinatePair(loc, 3) + '</b>'
            };
            var infoID = 'count_loc';

            if (savedHistoryJSON.timestamp) {
                infoID = 'count_loc_time';
                var milliseconds = (new Date()).getTime() - savedHistoryJSON.timestamp;
                restoreInfoDict.duration = '<b>' + formattedRoundedDuration(milliseconds) + '</b>';
            }

            bodyTextArea.html(t('assistant.restore.info.' + infoID, restoreInfoDict) +
                '<br/>' +
                t('assistant.restore.ask'));

            getLocation(loc, null, function(placeName) {
                if (placeName) {
                    selection.selectAll('.restore-location')
                        .text(placeName);
                }
            });

            mainFooter.append('button')
                .attr('class', 'primary')
                .on('click', function() {
                    updateDidEditStatus();
                    context.container().selectAll('#content')
                        .attr('class', 'active');
                    context.history().restore();
                    redraw();
                })
                .append('span')
                .text(t('assistant.restore.title'));

            mainFooter.append('button')
                .attr('class', 'destructive')
                .on('click', function() {
                    // don't show another welcome screen after discarding changes
                    updateDidEditStatus();
                    context.container().selectAll('#content')
                        .attr('class', 'active');
                    context.history().clearSaved();
                    context.map().pan([0,0]);  // trigger a map redraw
                    redraw();
                })
                .append('span')
                .text(t('assistant.restore.discard'));
        };

        return panel;
    }

    function panelMapping() {

        var panel = {
            headerIcon: 'fas-map-marked-alt',
            modeLabel: t('assistant.mode.mapping'),
            title: currLocation,
            titleClass: 'map-center-location',
            collapseCategory: 'browse'
        };

        panel.renderBody = function(selection) {
            selection
                .append('div')
                .attr('class', 'feature-list-pane')
                .call(featureSearch);
        };

        return panel;
    }

    function panelSelectKeepRightError(context, errorID) {

        var error = services.keepRight.getError(errorID);

        function errorTitle(d) {
            var unknown = t('inspector.unknown');

            if (!d) return unknown;
            var errorType = d.error_type;
            var parentErrorType = d.parent_error_type;

            var et = dataEn.QA.keepRight.errorTypes[errorType];
            var pt = dataEn.QA.keepRight.errorTypes[parentErrorType];

            if (et && et.title) {
                return t('QA.keepRight.errorTypes.' + errorType + '.title');
            } else if (pt && pt.title) {
                return t('QA.keepRight.errorTypes.' + parentErrorType + '.title');
            } else {
                return unknown;
            }
        }

        var panel = {
            theme: 'light',
            modeLabel: t('QA.keepRight.title'),
            title: errorTitle(error),
            collapseCategory: 'inspect'
        };

        panel.renderHeaderIcon = function(selection) {
            var icon = selection
                .append('div')
                .attr('class', 'error-header-icon')
                .classed('new', error.id < 0);

            icon
                .append('div')
                .attr('class', 'qa_error ' + error.service + ' error_id-' + error.id + ' error_type-' + error.parent_error_type)
                .call(svgIcon('#iD-icon-bolt', 'qa_error-fill'));
        };

        panel.renderBody = function(selection) {
            var editor = uiKeepRightEditor(context)
                .error(error);
            selection.call(editor);
        };

        return panel;
    }

    function panelSelectImproveOSMError(context, errorID) {

        var error = services.improveOSM.getError(errorID);

        function errorTitle(d) {
            var unknown = t('inspector.unknown');

            if (!d) return unknown;
            var errorType = d.error_key;
            var et = dataEn.QA.improveOSM.error_types[errorType];

            if (et && et.title) {
                return t('QA.improveOSM.error_types.' + errorType + '.title');
            } else {
                return unknown;
            }
        }

        var panel = {
            theme: 'light',
            modeLabel: t('QA.improveOSM.title'),
            title: errorTitle(error),
            collapseCategory: 'inspect'
        };

        panel.renderHeaderIcon = function(selection) {

            var iconEnter = selection
                .append('div')
                .attr('class', 'error-header-icon')
                .classed('new', error.id < 0);

            var svgEnter = iconEnter
                .append('svg')
                .attr('width', '20px')
                .attr('height', '30px')
                .attr('viewbox', '0 0 20 30')
                .attr('class', [
                    'qa_error',
                    error.service,
                    'error_id-' + error.id,
                    'error_type-' + error.error_type,
                    'category-' + error.category
                ].join(' '));

            svgEnter
                .append('polygon')
                .attr('fill', 'currentColor')
                .attr('class', 'qa_error-fill')
                .attr('points', '16,3 4,3 1,6 1,17 4,20 7,20 10,27 13,20 16,20 19,17.033 19,6');

            var getIcon = function(d) {
                var picon = d.icon;

                if (!picon) {
                    return '';
                } else {
                    var isMaki = /^maki-/.test(picon);
                    return '#' + picon + (isMaki ? '-11' : '');
                }
            };

            svgEnter
                .append('use')
                .attr('class', 'icon-annotation')
                .attr('width', '11px')
                .attr('height', '11px')
                .attr('transform', 'translate(4.5, 7)')
                .attr('xlink:href', getIcon(error));
        };

        panel.renderBody = function(selection) {
            var editor = uiImproveOsmEditor(context)
                .error(error);
            selection.call(editor);
        };

        return panel;
    }

    function panelSelectCustomData(context, datum) {

        var panel = {
            theme: 'light',
            modeLabel: t('assistant.mode.inspecting'),
            headerIcon: 'iD-icon-data',
            title: t('map_data.layers.custom.title'),
            collapseCategory: 'inspect'
        };

        panel.renderBody = function(selection) {
            var editor = uiDataEditor(context)
                .datum(datum);
            selection.call(editor);
        };

        return panel;
    }

    function panelSelectNote(context, note) {

        var panel = {
            theme: 'light',
            modeLabel: t('assistant.mode.inspecting'),
            title: note.label(),
            collapseCategory: 'inspect'
        };

        panel.renderHeaderIcon = function(selection) {
            var icon = selection
                .append('div')
                .attr('class', 'note-header-icon ' + note.status)
                .classed('new', note.id < 0);

            icon
                .call(svgIcon('#iD-icon-note', 'note-fill'));

            var statusIcon = '#iD-icon-' + (note.id < 0 ? 'plus' : (note.status === 'open' ? 'close' : 'apply'));
            icon
                .append('div')
                .attr('class', 'note-icon-annotation')
                .call(svgIcon(statusIcon, 'icon-annotation'));
        };

        panel.renderBody = function(selection) {
            var noteEditor = uiNoteEditor(context)
                .note(note);
            selection.call(noteEditor);
        };

        return panel;
    }

    function panelAddDrawGeometry(context, mode) {

        var message = t('assistant.instructions.' + mode.id.replace('-', '_'));
        if (mode.id === 'add-point' && mode.preset &&
            mode.preset.geometry.indexOf('point') === -1) {

            message = t('assistant.instructions.add_vertex');
        } else if (mode.id.indexOf('draw') !== -1) {
            var way = context.entity(mode.wayID);
            if (way.nodes.length >= 4) {
                message += '<br/>' + t('assistant.instructions.finishing');
            }
        }

        var modeLabelID = 'drawing';

        if (mode.id === 'add-point') {
            modeLabelID = 'placing';
        }

        var panel = {
            modeLabel: t('assistant.mode.' + modeLabelID),
            title: mode.title,
            message: message,
            collapseCategory: 'draw'
        };

        panel.renderHeaderIcon = function(selection) {
            selection.call(uiPresetIcon(context)
                .geometry(mode.geometry)
                .preset(mode.preset)
                .sizeClass('small')
                .pointMarker(false));
        };

        return panel;
    }

    function panelSelect(context, selectedIDs) {

        var panel = {
            theme: 'light',
            modeLabel: t('assistant.mode.inspecting'),
            title: selectedIDs.length === 1 ? utilDisplayLabel(context.entity(selectedIDs[0]), context) :
                t('assistant.feature_count.multiple', { count: selectedIDs.length.toString() }),
            collapseCategory: 'inspect'
        };

        panel.renderHeaderIcon = function(selection) {

            if (selectedIDs.length === 1) {
                var entity = context.entity(selectedIDs[0]);
                var geometry = entity.geometry(context.graph());
                var preset = context.presets().match(entity, context.graph());

                selection.call(uiPresetIcon(context)
                    .geometry(geometry)
                    .preset(preset)
                    .sizeClass('small')
                    .pointMarker(false));
            } else {
                selection.call(svgIcon('#fas-edit'));
            }
        };

        panel.renderBody = function(selection) {
            var entityEditor = uiEntityEditor(context);
            entityEditor
                .state('select')
                .entityIDs(selectedIDs)
                .newFeature(context.mode().newFeature());
            selection.call(entityEditor);
        };

        return panel;
    }


    function panelAuthenticating() {

        var panel = {
            headerIcon: 'iD-icon-save',
            modeLabel: t('assistant.mode.authenticating'),
            title: t('assistant.commit.auth.osm_account'),
            message: t('assistant.commit.auth.message'),
            collapseCategory: 'save'
        };

        return panel;
    }

    function panelSave(context) {

        var summary = context.history().difference().summary();
        var titleID = summary.length === 1 ? 'change' : 'changes';

        var panel = {
            theme: 'light',
            headerIcon: 'iD-icon-save',
            modeLabel: t('assistant.mode.saving'),
            title: t('commit.' + titleID, { count: summary.length }),
            collapseCategory: 'save'
        };

        panel.renderBody = function(selection) {
            var editor = uiCommit(context);
            selection.call(editor);
        };

        return panel;
    }

    function panelSuccess(context) {

        var savedIcon;
        if (savedChangeCount <= 25) {
            savedIcon = 'fas-smile-beam';
        } else if (savedChangeCount <= 50) {
            savedIcon = 'fas-grin-beam';
        } else {
            savedIcon = 'fas-laugh-beam';
        }

        var panel = {
            prominent: true,
            theme: 'light',
            headerIcon: savedIcon,
            title: t('assistant.commit.success.thank_you'),
            collapseCategory: 'save',
            onClose: function() {
                updateDidEditStatus();
                redraw();
            }
        };

        panel.renderHeaderBody = function(selection) {

            var bodyTextArea = selection
                .append('div')
                .attr('class', 'body-text');

            bodyTextArea.html(
                '<b>' + t('assistant.commit.success.just_improved', { location: currLocation }) + '</b>' +
                '<br/>'
            );

            var link = bodyTextArea
                .append('span')
                .text(t('assistant.commit.success.propagation_help'))
                .append('a')
                .attr('class', 'link-out')
                .attr('target', '_blank')
                .attr('tabindex', -1)
                .attr('href', t('success.help_link_url'));

            link.append('span')
                .text(' ' + t('success.help_link_text'));

            link
                .call(svgIcon('#iD-icon-out-link', 'inline'));
        };

        panel.renderBody = function(selection) {

            var success = uiSuccess(context).changeset(savedChangeset);
            selection.call(success);
        };

        return panel;
    }
}
