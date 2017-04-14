import * as d3 from 'd3';
import { t } from '../../util/locale';
import { utilRebind } from '../../util/rebind';
import { icon, pad, transitionTime } from './helper';


export function uiIntroArea(context, reveal) {
    var dispatch = d3.dispatch('done'),
        playground = [-85.63552, 41.94159],
        playgroundPreset = context.presets().item('leisure/playground'),
        descriptionField = context.presets().field('description'),
        timeouts = [];


    var chapter = {
        title: 'intro.areas.title'
    };


    function timeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }


    function eventCancel() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
    }


    function addArea() {
        context.history().reset('initial');

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

        var padding = 120 * Math.pow(2, context.map().zoom() - 19);
        var box = pad(playground, padding, context);
        reveal(box, t('intro.areas.start_playground'));

        context.map().on('move.intro drawn.intro', function() {
            padding = 120 * Math.pow(2, context.map().zoom() - 19);
            box = pad(playground, padding, context);
            reveal(box, t('intro.areas.start_playground'), { duration: 0 });
        });

        context.on('enter.intro', function(mode) {
            if (mode.id !== 'draw-area') return chapter.restart();
            continueTo(continuePlayground);
        });

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

        var padding = 150 * Math.pow(2, context.map().zoom() - 19);
        var box = pad(playground, padding, context);
        reveal(box, t('intro.areas.continue_playground'));

        context.map().on('move.intro drawn.intro', function() {
            padding = 150 * Math.pow(2, context.map().zoom() - 19);
            box = pad(playground, padding, context);
            reveal(box, t('intro.areas.continue_playground'), {duration: 0});
        });

        context.on('enter.intro', function(mode) {
            if (mode.id === 'draw-area')
                return;
            else if (mode.id === 'select')
                return continueTo(searchPresets);
            else
                return chapter.restart();
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function searchPresets() {
        if (context.mode().id !== 'select') {
            return chapter.restart();
        }

        context.on('exit.intro', function() {
            return chapter.restart();
        });

        d3.select('.preset-search-input')
            .on('keyup.intro', checkPresetSearch);

        timeout(function() {
            reveal('.preset-search-input',
                t('intro.areas.search_playground', { preset: playgroundPreset.name() })
            );
        }, 500);
    }


    function checkPresetSearch() {
        var first = d3.select('.preset-list-item:first-child');

        if (first.classed('preset-leisure-playground')) {
            reveal(first.select('.preset-list-button').node(),
                t('intro.areas.choose_playground', { preset: playgroundPreset.name() }),
                { duration: 300 }
            );

            d3.select('.preset-search-input')
                .on('keydown.intro', eventCancel, true)
                .on('keyup.intro', null);

            context.history().on('change.intro', function() {
                continueTo(clickAddField);
            });
        }

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            context.history().on('change.intro', null);
            d3.select('.preset-search-input').on('keydown.intro', null);
            nextStep();
        }
    }


    function clickAddField() {
        context.on('exit.intro', function() {
            return chapter.restart();
        });

        timeout(function() {
            reveal('.more-fields .combobox-input',
                t('intro.areas.add_field'),
                { duration: 300 }
            );

            d3.select('.more-fields .combobox-input')
                .on('click.intro', function() {
                    continueTo(chooseDescriptionField);
                });
        }, 300);  // after editor pane visible

        function continueTo(nextStep) {
            d3.select('.more-fields .combobox-input').on('click.intro', null);
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function chooseDescriptionField() {
        context.on('exit.intro', function() {
            return chapter.restart();
        });

        reveal('div.combobox',
            t('intro.areas.choose_field', { field: descriptionField.label() }),
            { duration: 300 }
        );

        d3.select('div.combobox')
            .on('click.intro', function() {
                timeout(function() {
                    if (d3.select('.form-field-description').empty())
                        continueTo(retryChooseDescription);
                    else
                        continueTo(describePlayground);
                }, 300);
            });

        function continueTo(nextStep) {
            d3.select('div.combobox').on('click.intro', null);
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function describePlayground() {
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
        context.on('exit.intro', function() {
            return chapter.restart();
        });

        reveal('.entity-editor-pane',
            t('intro.areas.retry_add_field', { field: descriptionField.label() }), {
            buttonText: t('intro.ok'),
            buttonCallback: function() { continueTo(clickAddField); }
        });

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function play() {
        reveal('.intro-nav-wrap .chapter-line',
            t('intro.areas.play', { next: t('intro.lines.title') }), {
                buttonText: t('intro.ok'),
                buttonCallback: function() {
                    dispatch.call('done');
                    reveal('#id-container');
                }
            }
        );
    }


    chapter.enter = function() {
        addArea();
    };


    chapter.exit = function() {
        timeouts.forEach(window.clearTimeout);
        context.on('enter.intro', null);
        context.on('exit.intro', null);
        context.map().on('move.intro drawn.intro', null);
        context.history().on('change.intro', null);
        d3.select('.preset-search-input').on('keydown.intro keyup.intro', null);
        d3.select('.more-fields .combobox-input').on('click.intro', null);
    };


    chapter.restart = function() {
        chapter.exit();
        chapter.enter();
    };


    return utilRebind(chapter, dispatch, 'on');
}
