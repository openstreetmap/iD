import { dispatch as d3_dispatch } from 'd3-dispatch';
import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t, textDirection } from '../../util/locale';
import { actionChangePreset } from '../../actions';
import { modeBrowse, modeSelect } from '../../modes';
import { utilRebind } from '../../util/rebind';
import { icon, pointBox, pad, selectMenuItem, transitionTime } from './helper';


export function uiIntroPoint(context, reveal) {
    var dispatch = d3_dispatch('done');
    var timeouts = [];
    var intersection = [-85.63279, 41.94394];
    var building = [-85.632422, 41.944045];
    var cafePreset = context.presets().item('amenity/cafe');
    var _pointID = null;


    var chapter = {
        title: 'intro.points.title'
    };


    function timeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }


    function revealEditMenu(loc, text, options) {
        var rect = context.surfaceRect();
        var point = context.curtainProjection(loc);
        var pad = 40;
        var width = 250 + (2 * pad);
        var height = 250;
        var startX = rect.left + point[0];
        var left = (textDirection === 'rtl') ? (startX - width + pad) : (startX - pad);
        var box = {
            left: left,
            top: point[1] + rect.top - 60,
            width: width,
            height: height
        };
        reveal(box, text, options);
    }


    function eventCancel() {
        d3_event.stopPropagation();
        d3_event.preventDefault();
    }


    function addPoint() {
        context.enter(modeBrowse(context));
        context.history().reset('initial');

        var msec = transitionTime(intersection, context.map().center());
        if (msec) { reveal(null, null, { duration: 0 }); }
        context.map().zoom(19).centerEase(intersection, msec);

        timeout(function() {
            var tooltip = reveal('button.add-point',
                t('intro.points.add_point', { button: icon('#iD-icon-point', 'pre-text') }));

            _pointID = null;

            tooltip.selectAll('.tooltip-inner')
                .insert('svg', 'span')
                .attr('class', 'tooltip-illustration')
                .append('use')
                .attr('xlink:href', '#iD-graphic-points');

            context.on('enter.intro', function(mode) {
                if (mode.id !== 'add-point') return;
                continueTo(placePoint);
            });
        }, msec + 100);

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function placePoint() {
        if (context.mode().id !== 'add-point') {
            return chapter.restart();
        }

        var pointBox = pad(building, 150, context);
        reveal(pointBox, t('intro.points.place_point'));

        context.map().on('move.intro drawn.intro', function() {
            pointBox = pad(building, 150, context);
            reveal(pointBox, t('intro.points.place_point'), { duration: 0 });
        });

        context.on('enter.intro', function(mode) {
            if (mode.id !== 'select') return chapter.restart();
            _pointID = context.mode().selectedIDs()[0];
            continueTo(searchPreset);
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function searchPreset() {
        if (context.mode().id !== 'select' || !_pointID || !context.hasEntity(_pointID)) {
            return addPoint();
        }

        // disallow scrolling
        d3_select('.inspector-wrap').on('wheel.intro', eventCancel);

        d3_select('.preset-search-input')
            .on('keydown.intro', null)
            .on('keyup.intro', checkPresetSearch);

        reveal('.preset-search-input',
            t('intro.points.search_cafe', { preset: cafePreset.name() })
        );

        context.on('enter.intro', function(mode) {
            if (!_pointID || !context.hasEntity(_pointID)) {
                return continueTo(addPoint);
            }

            var ids = context.selectedIDs();
            if (mode.id !== 'select' || !ids.length || ids[0] !== _pointID) {
                // keep the user's point selected..
                context.enter(modeSelect(context, [_pointID]));

                // disallow scrolling
                d3_select('.inspector-wrap').on('wheel.intro', eventCancel);

                d3_select('.preset-search-input')
                    .on('keydown.intro', null)
                    .on('keyup.intro', checkPresetSearch);

                reveal('.preset-search-input',
                    t('intro.points.search_cafe', { preset: cafePreset.name() })
                );

                context.history().on('change.intro', null);
            }
        });


        function checkPresetSearch() {
            var first = d3_select('.preset-list-item:first-child');

            if (first.classed('preset-amenity-cafe')) {
                d3_select('.preset-search-input')
                    .on('keydown.intro', eventCancel, true)
                    .on('keyup.intro', null);

                reveal(first.select('.preset-list-button').node(),
                    t('intro.points.choose_cafe', { preset: cafePreset.name() }),
                    { duration: 300 }
                );

                context.history().on('change.intro', function() {
                    continueTo(aboutFeatureEditor);
                });
            }
        }

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            context.history().on('change.intro', null);
            d3_select('.inspector-wrap').on('wheel.intro', null);
            d3_select('.preset-search-input').on('keydown.intro keyup.intro', null);
            nextStep();
        }
    }


    function aboutFeatureEditor() {
        if (context.mode().id !== 'select' || !_pointID || !context.hasEntity(_pointID)) {
            return addPoint();
        }

        timeout(function() {
            reveal('.entity-editor-pane', t('intro.points.feature_editor'), {
                tooltipClass: 'intro-points-describe',
                buttonText: t('intro.ok'),
                buttonCallback: function() { continueTo(addName); }
            });
        }, 400);

        context.on('exit.intro', function() {
            // if user leaves select mode here, just continue with the tutorial.
            continueTo(reselectPoint);
        });

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function addName() {
        if (context.mode().id !== 'select' || !_pointID || !context.hasEntity(_pointID)) {
            return addPoint();
        }

        // reset pane, in case user happened to change it..
        d3_select('.inspector-wrap .panewrap').style('right', '0%');

        timeout(function() {
            // It's possible for the user to add a name in a previous step..
            // If so, don't tell them to add the name in this step.
            // Give them an OK button instead.
            var entity = context.entity(_pointID);
            if (entity.tags.name) {
                var tooltip = reveal('.entity-editor-pane', t('intro.points.add_name'), {
                    tooltipClass: 'intro-points-describe',
                    buttonText: t('intro.ok'),
                    buttonCallback: function() { continueTo(addCloseEditor); }
                });
                tooltip.select('.instruction').style('display', 'none');

            } else {
                reveal('.entity-editor-pane', t('intro.points.add_name'),
                    { tooltipClass: 'intro-points-describe' }
                );
            }
        }, 400);

        context.history().on('change.intro', function() {
            continueTo(addCloseEditor);
        });

        context.on('exit.intro', function() {
            // if user leaves select mode here, just continue with the tutorial.
            continueTo(reselectPoint);
        });

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function addCloseEditor() {
        // reset pane, in case user happened to change it..
        d3_select('.inspector-wrap .panewrap').style('right', '0%');

        var selector = '.entity-editor-pane button.preset-close svg use';
        var href = d3_select(selector).attr('href') || '#iD-icon-close';

        context.on('exit.intro', function() {
            continueTo(reselectPoint);
        });

        reveal('.entity-editor-pane',
            t('intro.points.add_close', { button: icon(href, 'pre-text') })
        );

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function reselectPoint() {
        if (!_pointID) return chapter.restart();
        var entity = context.hasEntity(_pointID);
        if (!entity) return chapter.restart();

        // make sure it's still a cafe, in case user somehow changed it..
        var oldPreset = context.presets().match(entity, context.graph());
        context.replace(actionChangePreset(_pointID, oldPreset, cafePreset));

        context.enter(modeBrowse(context));

        var msec = transitionTime(entity.loc, context.map().center());
        if (msec) { reveal(null, null, { duration: 0 }); }
        context.map().centerEase(entity.loc, msec);

        timeout(function() {
            var box = pointBox(entity.loc, context);
            reveal(box, t('intro.points.reselect'), { duration: 600 });

            timeout(function() {
                context.map().on('move.intro drawn.intro', function() {
                    var entity = context.hasEntity(_pointID);
                    if (!entity) return chapter.restart();
                    var box = pointBox(entity.loc, context);
                    reveal(box, t('intro.points.reselect'), { duration: 0 });
                });
            }, 600); // after reveal..

            context.on('enter.intro', function(mode) {
                if (mode.id !== 'select') return;
                continueTo(updatePoint);
            });

        }, msec + 100);

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function updatePoint() {
        if (context.mode().id !== 'select' || !_pointID || !context.hasEntity(_pointID)) {
            return continueTo(reselectPoint);
        }

        // reset pane, in case user happened to untag the point..
        d3_select('.inspector-wrap .panewrap').style('right', '0%');

        context.on('exit.intro', function() {
            continueTo(reselectPoint);
        });

        context.history().on('change.intro', function() {
            continueTo(updateCloseEditor);
        });

        timeout(function() {
            reveal('.entity-editor-pane', t('intro.points.update'),
                { tooltipClass: 'intro-points-describe' }
            );
        }, 400);

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function updateCloseEditor() {
        if (context.mode().id !== 'select' || !_pointID || !context.hasEntity(_pointID)) {
            return continueTo(reselectPoint);
        }

        // reset pane, in case user happened to change it..
        d3_select('.inspector-wrap .panewrap').style('right', '0%');

        context.on('exit.intro', function() {
            continueTo(rightClickPoint);
        });

        timeout(function() {
            reveal('.entity-editor-pane',
                t('intro.points.update_close', { button: icon('#iD-icon-apply', 'pre-text') })
            );
        }, 500);

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function rightClickPoint() {
        if (!_pointID) return chapter.restart();
        var entity = context.hasEntity(_pointID);
        if (!entity) return chapter.restart();

        context.enter(modeBrowse(context));

        var box = pointBox(entity.loc, context);
        reveal(box, t('intro.points.rightclick'), { duration: 600 });

        timeout(function() {
            context.map().on('move.intro drawn.intro', function() {
                var entity = context.hasEntity(_pointID);
                if (!entity) return chapter.restart();
                var box = pointBox(entity.loc, context);
                reveal(box, t('intro.points.rightclick'), { duration: 0 });
            });
        }, 600); // after reveal

        context.on('enter.intro', function(mode) {
            if (mode.id !== 'select') return;
            var ids = context.selectedIDs();
            if (ids.length !== 1 || ids[0] !== _pointID) return;

            timeout(function() {
                var node = selectMenuItem('delete').node();
                if (!node) return;
                continueTo(enterDelete);
            }, 300);  // after menu visible
        });

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            context.map().on('move.intro drawn.intro', null);
            nextStep();
        }
    }


    function enterDelete() {
        if (!_pointID) return chapter.restart();
        var entity = context.hasEntity(_pointID);
        if (!entity) return chapter.restart();

        var node = selectMenuItem('delete').node();
        if (!node) { return continueTo(rightClickPoint); }

        revealEditMenu(entity.loc,
            t('intro.points.delete', { button: icon('#iD-operation-delete', 'pre-text') })
        );

        timeout(function() {
            context.map().on('move.intro drawn.intro', function() {
                revealEditMenu(entity.loc,
                    t('intro.points.delete', { button: icon('#iD-operation-delete', 'pre-text') }),
                    { duration: 0}
                );
            });
        }, 300); // after menu visible

        context.on('exit.intro', function() {
            if (!_pointID) return chapter.restart();
            var entity = context.hasEntity(_pointID);
            if (entity) return continueTo(rightClickPoint);  // point still exists
        });

        context.history().on('change.intro', function(changed) {
            if (changed.deleted().length) {
                continueTo(undo);
            }
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.history().on('change.intro', null);
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function undo() {
        context.history().on('change.intro', function() {
            continueTo(play);
        });

        var iconName = '#iD-icon-' + (textDirection === 'rtl' ? 'redo' : 'undo');
        reveal('#bar button.undo-button',
            t('intro.points.undo', { button: icon(iconName, 'pre-text') })
        );

        function continueTo(nextStep) {
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function play() {
        dispatch.call('done');
        reveal('#id-container',
            t('intro.points.play', { next: t('intro.areas.title') }), {
                tooltipBox: '.intro-nav-wrap .chapter-area',
                buttonText: t('intro.ok'),
                buttonCallback: function() { reveal('#id-container'); }
            }
        );
    }


    chapter.enter = function() {
        addPoint();
    };


    chapter.exit = function() {
        timeouts.forEach(window.clearTimeout);
        context.on('enter.intro exit.intro', null);
        context.map().on('move.intro drawn.intro', null);
        context.history().on('change.intro', null);
        d3_select('.inspector-wrap').on('wheel.intro', eventCancel);
        d3_select('.preset-search-input').on('keydown.intro keyup.intro', null);
    };


    chapter.restart = function() {
        chapter.exit();
        chapter.enter();
    };


    return utilRebind(chapter, dispatch, 'on');
}
