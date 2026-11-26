import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    interpolateNumber as d3_interpolateNumber
} from 'd3-interpolate';

import { presetManager } from '../../presets';
import { t } from '../../core/localizer';
import { modeBrowse } from '../../modes/browse';
import { modeSelect } from '../../modes/select';
import { utilRebind } from '../../util/rebind';
import { helpHtml, icon, pad, transitionTime } from './helper';


export function uiIntroArea(context, reveal) {
    var dispatch = d3_dispatch('done');
    var playground = [-85.63552, 41.94159];
    var playgroundPreset = presetManager.item('leisure/playground');
    var nameField = presetManager.field('name');
    var descriptionField = presetManager.field('description');
    var timeouts = [];
    var _areaID;


    var chapter = {
        title: 'intro.areas.title'
    };


    function timeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }


    function eventCancel(d3_event) {
        d3_event.stopPropagation();
        d3_event.preventDefault();
    }


    function revealPlayground(center, text, options) {
        var padding = 180 * Math.pow(2, context.map().zoom() - 19.5);
        var box = pad(center, padding, context);
        reveal(box, text, options);
    }


    function addArea() {
        context.enter(modeBrowse(context));
        context.history().reset('initial');
        _areaID = null;

        var msec = transitionTime(playground, context.map().center());
        if (msec) { reveal(null, null, { duration: 0 }); }
        context.map().centerZoomEase(playground, 19, msec);

        timeout(function() {
            var tooltip = reveal('button.add-area',
                helpHtml('intro.areas.add_playground'));

            tooltip.selectAll('.popover-inner')
                .insert('svg', 'span')
                .attr('class', 'tooltip-illustration')
                .append('use')
                .attr('xlink:href', '#iD-graphic-areas');

            context.on('enter.intro', function(mode) {
                if (mode.id !== 'add-area') return;
                continueTo(startPlayground);
            });
        }, msec + 100);

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function startPlayground() {
        if (context.mode().id !== 'add-area') {
            return chapter.restart();
        }

        _areaID = null;
        context.map().zoomEase(19.5, 500);

        timeout(function() {
            var textId = context.lastPointerType() === 'mouse' ? 'starting_node_click' : 'starting_node_tap';
            var startDrawString = helpHtml('intro.areas.start_playground') + helpHtml('intro.areas.' + textId);
            revealPlayground(playground,
                startDrawString, { duration: 250 }
            );

            timeout(function() {
                context.map().on('move.intro drawn.intro', function() {
                    revealPlayground(playground,
                        startDrawString, { duration: 0 }
                    );
                });
                context.on('enter.intro', function(mode) {
                    if (mode.id !== 'draw-area') return chapter.restart();
                    continueTo(continuePlayground);
                });
            }, 250);  // after reveal

        }, 550);  // after easing

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function continuePlayground() {
        if (context.mode().id !== 'draw-area') {
            return chapter.restart();
        }

        _areaID = null;
        revealPlayground(playground,
            helpHtml('intro.areas.continue_playground'),
            { duration: 250 }
        );

        timeout(function() {
            context.map().on('move.intro drawn.intro', function() {
                revealPlayground(playground,
                    helpHtml('intro.areas.continue_playground'),
                    { duration: 0 }
                );
            });
        }, 250);  // after reveal

        context.on('enter.intro', function(mode) {
            if (mode.id === 'draw-area') {
                var entity = context.hasEntity(context.selectedIDs()[0]);
                if (entity && entity.nodes.length >= 6) {
                    return continueTo(finishPlayground);
                } else {
                    return;
                }
            } else if (mode.id === 'select') {
                _areaID = context.selectedIDs()[0];
                return continueTo(searchPresets);
            } else {
                return chapter.restart();
            }
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function finishPlayground() {
        if (context.mode().id !== 'draw-area') {
            return chapter.restart();
        }

        _areaID = null;

        var finishString = helpHtml('intro.areas.finish_area_' + (context.lastPointerType() === 'mouse' ? 'click' : 'tap')) +
            helpHtml('intro.areas.finish_playground');
        revealPlayground(playground,
            finishString, { duration: 250 }
        );

        timeout(function() {
            context.map().on('move.intro drawn.intro', function() {
                revealPlayground(playground,
                    finishString, { duration: 0 }
                );
            });
        }, 250);  // after reveal

        context.on('enter.intro', function(mode) {
            if (mode.id === 'draw-area') {
                return;
            } else if (mode.id === 'select') {
                _areaID = context.selectedIDs()[0];
                return continueTo(searchPresets);
            } else {
                return chapter.restart();
            }
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function searchPresets() {
        if (!_areaID || !context.hasEntity(_areaID)) {
            return addArea();
        }
        var ids = context.selectedIDs();
        if (context.mode().id !== 'select' || !ids.length || ids[0] !== _areaID) {
            context.enter(modeSelect(context, [_areaID]));
        }

        // disallow scrolling
        context.container().select('.inspector-wrap').on('wheel.intro', eventCancel);

        timeout(function() {
            // reset pane, in case user somehow happened to change it..
            context.container().select('.inspector-wrap .panewrap').style('right', '-100%');

            context.container().select('.preset-search-input')
                .on('keydown.intro', null)
                .on('keyup.intro', checkPresetSearch);

            reveal('.preset-search-input',
                helpHtml('intro.areas.search_playground', { preset: playgroundPreset.name() })
            );
        }, 400);  // after preset list pane visible..

        context.on('enter.intro', function(mode) {
            if (!_areaID || !context.hasEntity(_areaID)) {
                return continueTo(addArea);
            }

            var ids = context.selectedIDs();
            if (mode.id !== 'select' || !ids.length || ids[0] !== _areaID) {
                // keep the user's area selected..
                context.enter(modeSelect(context, [_areaID]));

                // reset pane, in case user somehow happened to change it..
                context.container().select('.inspector-wrap .panewrap').style('right', '-100%');
                // disallow scrolling
                context.container().select('.inspector-wrap').on('wheel.intro', eventCancel);

                context.container().select('.preset-search-input')
                    .on('keydown.intro', null)
                    .on('keyup.intro', checkPresetSearch);

                reveal('.preset-search-input',
                    helpHtml('intro.areas.search_playground', { preset: playgroundPreset.name() })
                );

                context.history().on('change.intro', null);
            }
        });

        function checkPresetSearch() {
            var first = context.container().select('.preset-list-item:first-child');

            if (first.classed('preset-leisure-playground')) {
                reveal(first.select('.preset-list-button').node(),
                    helpHtml('intro.areas.choose_playground', { preset: playgroundPreset.name() }),
                    { duration: 300 }
                );

                context.container().select('.preset-search-input')
                    .on('keydown.intro', eventCancel, true)
                    .on('keyup.intro', null);

                context.history().on('change.intro', function() {
                    continueTo(clickAddField);
                });
            }
        }

        function continueTo(nextStep) {
            context.container().select('.inspector-wrap').on('wheel.intro', null);
            context.on('enter.intro', null);
            context.history().on('change.intro', null);
            context.container().select('.preset-search-input').on('keydown.intro keyup.intro', null);
            nextStep();
        }
    }


    function clickAddField() {
        if (!_areaID || !context.hasEntity(_areaID)) {
            return addArea();
        }
        var ids = context.selectedIDs();
        if (context.mode().id !== 'select' || !ids.length || ids[0] !== _areaID) {
            return searchPresets();
        }

        if (!context.container().select('.form-field-description').empty()) {
            return continueTo(describePlayground);
        }

        // disallow scrolling
        context.container().select('.inspector-wrap').on('wheel.intro', eventCancel);

        timeout(function() {
            // reset pane, in case user somehow happened to change it..
            context.container().select('.inspector-wrap .panewrap').style('right', '0%');

            // It's possible for the user to add a description in a previous step..
            // If they did this already, just continue to next step.
            var entity = context.entity(_areaID);
            if (entity.tags.description) {
                return continueTo(play);
            }

            // scroll "Add field" into view
            var box = context.container().select('.more-fields').node().getBoundingClientRect();
            if (box.top > 300) {
                var pane = context.container().select('.entity-editor-pane .inspector-body');
                var start = pane.node().scrollTop;
                var end = start + (box.top - 300);

                pane
                    .transition()
                    .duration(250)
                    .tween('scroll.inspector', function() {
                        var node = this;
                        var i = d3_interpolateNumber(start, end);
                        return function(t) {
                            node.scrollTop = i(t);
                        };
                    });
            }

            timeout(function() {
                reveal('.more-fields .combobox-input',
                    helpHtml('intro.areas.add_field', {
                        name: nameField.title(),
                        description: descriptionField.title()
                    }),
                    { duration: 300 }
                );

                context.container().select('.more-fields .combobox-input')
                    .on('click.intro', function() {
                        // Watch for the combobox to appear...
                        var watcher;
                        watcher = window.setInterval(function() {
                            if (!context.container().select('div.combobox').empty()) {
                                window.clearInterval(watcher);
                                continueTo(chooseDescriptionField);
                            }
                        }, 300);
                    });
            }, 300);  // after "Add Field" visible

        }, 400);  // after editor pane visible

        context.on('exit.intro', function() {
            return continueTo(searchPresets);
        });

        function continueTo(nextStep) {
            context.container().select('.inspector-wrap').on('wheel.intro', null);
            context.container().select('.more-fields .combobox-input').on('click.intro', null);
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function chooseDescriptionField() {
        if (!_areaID || !context.hasEntity(_areaID)) {
            return addArea();
        }
        var ids = context.selectedIDs();
        if (context.mode().id !== 'select' || !ids.length || ids[0] !== _areaID) {
            return searchPresets();
        }

        if (!context.container().select('.form-field-description').empty()) {
            return continueTo(describePlayground);
        }

        // Make sure combobox is ready..
        if (context.container().select('div.combobox').empty()) {
            return continueTo(clickAddField);
        }
        // Watch for the combobox to go away..
        var watcher;
        watcher = window.setInterval(function() {
            if (context.container().select('div.combobox').empty()) {
                window.clearInterval(watcher);
                timeout(function() {
                    if (context.container().select('.form-field-description').empty()) {
                        continueTo(retryChooseDescription);
                    } else {
                        continueTo(describePlayground);
                    }
                }, 300);  // after description field added.
            }
        }, 300);

        reveal('div.combobox',
            helpHtml('intro.areas.choose_field', { field: descriptionField.title() }),
            { duration: 300 }
        );

        context.on('exit.intro', function() {
            return continueTo(searchPresets);
        });

        function continueTo(nextStep) {
            if (watcher) window.clearInterval(watcher);
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function describePlayground() {
        if (!_areaID || !context.hasEntity(_areaID)) {
            return addArea();
        }
        var ids = context.selectedIDs();
        if (context.mode().id !== 'select' || !ids.length || ids[0] !== _areaID) {
            return searchPresets();
        }

        // reset pane, in case user happened to change it..
        context.container().select('.inspector-wrap .panewrap').style('right', '0%');

        if (context.container().select('.form-field-description').empty()) {
            return continueTo(retryChooseDescription);
        }

        context.on('exit.intro', function() {
            continueTo(play);
        });

        reveal('.entity-editor-pane',
            helpHtml('intro.areas.describe_playground', { button: { html: icon('#iD-icon-close', 'inline') } }),
            { duration: 300 }
        );

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function retryChooseDescription() {
        if (!_areaID || !context.hasEntity(_areaID)) {
            return addArea();
        }
        var ids = context.selectedIDs();
        if (context.mode().id !== 'select' || !ids.length || ids[0] !== _areaID) {
            return searchPresets();
        }

        // reset pane, in case user happened to change it..
        context.container().select('.inspector-wrap .panewrap').style('right', '0%');

        reveal('.entity-editor-pane',
            helpHtml('intro.areas.retry_add_field', { field: descriptionField.title() }), {
            buttonText: t.html('intro.ok'),
            buttonCallback: function() { continueTo(clickAddField); }
        });

        context.on('exit.intro', function() {
            return continueTo(searchPresets);
        });

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function play() {
        dispatch.call('done');
        reveal('.ideditor',
            helpHtml('intro.areas.play', { next: t('intro.lines.title') }), {
                tooltipBox: '.intro-nav-wrap .chapter-line',
                buttonText: t.html('intro.ok'),
                buttonCallback: function() { reveal('.ideditor'); }
            }
        );
    }


    chapter.enter = function() {
        addArea();
    };


    chapter.exit = function() {
        timeouts.forEach(window.clearTimeout);
        context.on('enter.intro exit.intro', null);
        context.map().on('move.intro drawn.intro', null);
        context.history().on('change.intro', null);
        context.container().select('.inspector-wrap').on('wheel.intro', null);
        context.container().select('.preset-search-input').on('keydown.intro keyup.intro', null);
        context.container().select('.more-fields .combobox-input').on('click.intro', null);
    };


    chapter.restart = function() {
        chapter.exit();
        chapter.enter();
    };


    return utilRebind(chapter, dispatch, 'on');
}
