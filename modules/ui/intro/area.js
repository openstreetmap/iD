import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import {
    interpolateNumber as d3_interpolateNumber
} from 'd3-interpolate';

import { t } from '../../util/locale';
import { modeBrowse, modeSelect } from '../../modes';
import { utilRebind } from '../../util/rebind';
import { uiCmd } from '../cmd';
import { icon, pad, transitionTime } from './helper';


export function uiIntroArea(context, reveal) {
    var dispatch = d3_dispatch('done'),
        playground = [-85.63552, 41.94159],
        playgroundPreset = context.presets().item('leisure/playground'),
        descriptionField = context.presets().field('description'),
        timeouts = [],
        areaId;


    var chapter = {
        title: 'intro.areas.title'
    };


    function timeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }


    function eventCancel() {
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
        areaId = null;

        var msec = transitionTime(playground, context.map().center());
        if (msec) { reveal(null, null, { duration: 0 }); }
        context.map().zoom(19).centerEase(playground, msec);

        timeout(function() {
            var tooltip = reveal('button.add-area',
                t('intro.areas.add_playground', { button: icon('#icon-area', 'pre-text') }));

            tooltip.selectAll('.tooltip-inner')
                .insert('svg', 'span')
                .attr('class', 'tooltip-illustration')
                .append('use')
                .attr('xlink:href', '#landuse-images');

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

        areaId = null;
        context.map().zoomEase(19.5, 500);

        timeout(function() {
            revealPlayground(playground,
                t('intro.areas.start_playground'), { duration: 250 }
            );

            timeout(function() {
                context.map().on('move.intro drawn.intro', function() {
                    revealPlayground(playground,
                        t('intro.areas.start_playground'), { duration: 0 }
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

        areaId = null;
        revealPlayground(playground,
            t('intro.areas.continue_playground', { alt: uiCmd.display('⌥') }),
            { duration: 250 }
        );

        timeout(function() {
            context.map().on('move.intro drawn.intro', function() {
                revealPlayground(playground,
                    t('intro.areas.continue_playground', { alt: uiCmd.display('⌥') }),
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
                areaId = context.selectedIDs()[0];
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

        areaId = null;
        revealPlayground(playground,
            t('intro.areas.finish_playground'), { duration: 250 }
        );

        timeout(function() {
            context.map().on('move.intro drawn.intro', function() {
                revealPlayground(playground,
                    t('intro.areas.finish_playground'), { duration: 0 }
                );
            });
        }, 250);  // after reveal

        context.on('enter.intro', function(mode) {
            if (mode.id === 'draw-area') {
                return;
            } else if (mode.id === 'select') {
                areaId = context.selectedIDs()[0];
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
        if (!areaId || !context.hasEntity(areaId)) {
            return addArea();
        }
        var ids = context.selectedIDs();
        if (context.mode().id !== 'select' || !ids.length || ids[0] !== areaId) {
            context.enter(modeSelect(context, [areaId]));
        }

        // disallow scrolling
        d3_select('.inspector-wrap').on('wheel.intro', eventCancel);

        timeout(function() {
            // reset pane, in case user somehow happened to change it..
            d3_select('.inspector-wrap .panewrap').style('right', '-100%');

            d3_select('.preset-search-input')
                .on('keydown.intro', null)
                .on('keyup.intro', checkPresetSearch);

            reveal('.preset-search-input',
                t('intro.areas.search_playground', { preset: playgroundPreset.name() })
            );
        }, 400);  // after preset list pane visible..

        context.on('enter.intro', function(mode) {
            if (!areaId || !context.hasEntity(areaId)) {
                return continueTo(addArea);
            }

            var ids = context.selectedIDs();
            if (mode.id !== 'select' || !ids.length || ids[0] !== areaId) {
                // keep the user's area selected..
                context.enter(modeSelect(context, [areaId]));

                // reset pane, in case user somehow happened to change it..
                d3_select('.inspector-wrap .panewrap').style('right', '-100%');
                // disallow scrolling
                d3_select('.inspector-wrap').on('wheel.intro', eventCancel);

                d3_select('.preset-search-input')
                    .on('keydown.intro', null)
                    .on('keyup.intro', checkPresetSearch);

                reveal('.preset-search-input',
                    t('intro.areas.search_playground', { preset: playgroundPreset.name() })
                );

                context.history().on('change.intro', null);
            }
        });

        function checkPresetSearch() {
            var first = d3_select('.preset-list-item:first-child');

            if (first.classed('preset-leisure-playground')) {
                reveal(first.select('.preset-list-button').node(),
                    t('intro.areas.choose_playground', { preset: playgroundPreset.name() }),
                    { duration: 300 }
                );

                d3_select('.preset-search-input')
                    .on('keydown.intro', eventCancel, true)
                    .on('keyup.intro', null);

                context.history().on('change.intro', function() {
                    continueTo(clickAddField);
                });
            }
        }

        function continueTo(nextStep) {
            d3_select('.inspector-wrap').on('wheel.intro', null);
            context.on('enter.intro', null);
            context.history().on('change.intro', null);
            d3_select('.preset-search-input').on('keydown.intro keyup.intro', null);
            nextStep();
        }
    }


    function clickAddField() {
        if (!areaId || !context.hasEntity(areaId)) {
            return addArea();
        }
        var ids = context.selectedIDs();
        if (context.mode().id !== 'select' || !ids.length || ids[0] !== areaId) {
            return searchPresets();
        }

        if (!d3_select('.form-field-description').empty()) {
            return continueTo(describePlayground);
        }

        // disallow scrolling
        d3_select('.inspector-wrap').on('wheel.intro', eventCancel);

        timeout(function() {
            // reset pane, in case user somehow happened to change it..
            d3_select('.inspector-wrap .panewrap').style('right', '0%');

            // It's possible for the user to add a description in a previous step..
            // If they did this already, just continue to next step.
            var entity = context.entity(areaId);
            if (entity.tags.description) {
                return continueTo(play);
            }

            // scroll "Add field" into view
            var box = d3_select('.more-fields').node().getBoundingClientRect();
            if (box.top > 300) {
                var pane = d3_select('.entity-editor-pane .inspector-body');
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
                    t('intro.areas.add_field'),
                    { duration: 300 }
                );

                d3_select('.more-fields .combobox-input')
                    .on('click.intro', function() {
                        continueTo(chooseDescriptionField);
                    });
            }, 300);  // after "Add Field" visible

        }, 400);  // after editor pane visible

        context.on('exit.intro', function() {
            return continueTo(searchPresets);
        });

        function continueTo(nextStep) {
            d3_select('.inspector-wrap').on('wheel.intro', null);
            d3_select('.more-fields .combobox-input').on('click.intro', null);
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function chooseDescriptionField() {
        if (!areaId || !context.hasEntity(areaId)) {
            return addArea();
        }
        var ids = context.selectedIDs();
        if (context.mode().id !== 'select' || !ids.length || ids[0] !== areaId) {
            return searchPresets();
        }

        if (!d3_select('.form-field-description').empty()) {
            return continueTo(describePlayground);
        }

        // Make sure combobox is ready..
        if (d3_select('div.combobox').empty()) {
            return continueTo(clickAddField);
        }
        // Watch for the combobox to go away..
        var watcher;
        watcher = window.setInterval(function() {
            if (d3_select('div.combobox').empty()) {
                window.clearInterval(watcher);
                timeout(function() {
                    if (d3_select('.form-field-description').empty()) {
                        continueTo(retryChooseDescription);
                    } else {
                        continueTo(describePlayground);
                    }
                }, 300);  // after description field added.
            }
        }, 300);

        reveal('div.combobox',
            t('intro.areas.choose_field', { field: descriptionField.label() }),
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
        if (!areaId || !context.hasEntity(areaId)) {
            return addArea();
        }
        var ids = context.selectedIDs();
        if (context.mode().id !== 'select' || !ids.length || ids[0] !== areaId) {
            return searchPresets();
        }

        // reset pane, in case user happened to change it..
        d3_select('.inspector-wrap .panewrap').style('right', '0%');

        if (d3_select('.form-field-description').empty()) {
            return continueTo(retryChooseDescription);
        }

        context.on('exit.intro', function() {
            continueTo(play);
        });

        reveal('.entity-editor-pane',
            t('intro.areas.describe_playground', { button: icon('#icon-apply', 'pre-text') }),
            { duration: 300 }
        );

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function retryChooseDescription() {
        if (!areaId || !context.hasEntity(areaId)) {
            return addArea();
        }
        var ids = context.selectedIDs();
        if (context.mode().id !== 'select' || !ids.length || ids[0] !== areaId) {
            return searchPresets();
        }

        // reset pane, in case user happened to change it..
        d3_select('.inspector-wrap .panewrap').style('right', '0%');

        reveal('.entity-editor-pane',
            t('intro.areas.retry_add_field', { field: descriptionField.label() }), {
            buttonText: t('intro.ok'),
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
        reveal('#id-container',
            t('intro.areas.play', { next: t('intro.lines.title') }), {
                tooltipBox: '.intro-nav-wrap .chapter-line',
                buttonText: t('intro.ok'),
                buttonCallback: function() { reveal('#id-container'); }
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
        d3_select('.inspector-wrap').on('wheel.intro', null);
        d3_select('.preset-search-input').on('keydown.intro keyup.intro', null);
        d3_select('.more-fields .combobox-input').on('click.intro', null);
    };


    chapter.restart = function() {
        chapter.exit();
        chapter.enter();
    };


    return utilRebind(chapter, dispatch, 'on');
}
