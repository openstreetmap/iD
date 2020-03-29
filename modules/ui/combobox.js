import { dispatch as d3_dispatch } from 'd3-dispatch';
import { event as d3_event, select as d3_select } from 'd3-selection';
import { utilGetSetValue, utilRebind, utilTriggerEvent } from '../util';


// This code assumes that the combobox values will not have duplicate entries.
// It is keyed on the `value` of the entry. Data should be an array of objects like:
//   [{
//       value:  'display text',  // required
//       title:  'hover text'     // optional
//   }, ...]

var _comboHideTimerID;

export function uiCombobox(context, klass) {
    var dispatch = d3_dispatch('accept', 'cancel');
    var container = context.container();

    var _suggestions = [];
    var _data = [];
    var _fetched = {};
    var _selected = null;
    var _canAutocomplete = true;
    var _caseSensitive = false;
    var _cancelFetch = false;
    var _minItems = 2;
    var _tDown = 0;
    var _mouseEnterHandler, _mouseLeaveHandler;

    var _fetcher = function(val, cb) {
        cb(_data.filter(function(d) {
            var terms = d.terms || [];
            terms.push(d.value);
            return terms.some(function(term) {
                return term
                    .toString()
                    .toLowerCase()
                    .indexOf(val.toLowerCase()) !== -1;
            });
        }));
    };

    var combobox = function(input, attachTo) {
        if (!input || input.empty()) return;

        input
            .classed('combobox-input', true)
            .on('focus.combo-input', focus)
            .on('blur.combo-input', blur)
            .on('keydown.combo-input', keydown)
            .on('keyup.combo-input', keyup)
            .on('input.combo-input', change)
            .on('mousedown.combo-input', mousedown)
            .each(function() {
                var parent = this.parentNode;
                var sibling = this.nextSibling;

                d3_select(parent).selectAll('.combobox-caret')
                    .filter(function(d) { return d === input.node(); })
                    .data([input.node()])
                    .enter()
                    .insert('div', function() { return sibling; })
                    .attr('class', 'combobox-caret')
                    .on('mousedown.combo-caret', function() {
                        d3_event.preventDefault(); // don't steal focus from input
                        input.node().focus(); // focus the input as if it was clicked
                        mousedown();
                    })
                    .on('mouseup.combo-caret', function() {
                        d3_event.preventDefault(); // don't steal focus from input
                        mouseup();
                    });
            });


        function mousedown() {
            if (d3_event.button !== 0) return;    // left click only
            _tDown = +new Date();

            // clear selection
            var start = input.property('selectionStart');
            var end = input.property('selectionEnd');
            if (start !== end) {
                var val = utilGetSetValue(input);
                input.node().setSelectionRange(val.length, val.length);
                return;
            }

            input.on('mouseup.combo-input', mouseup);
        }


        function mouseup() {
            input.on('mouseup.combo-input', null);
            if (d3_event.button !== 0) return;    // left click only
            if (input.node() !== document.activeElement) return;   // exit if this input is not focused

            var start = input.property('selectionStart');
            var end = input.property('selectionEnd');
            if (start !== end) return;  // exit if user is selecting

            // not showing or showing for a different field - try to show it.
            var combo = container.selectAll('.combobox');
            if (combo.empty() || combo.datum() !== input.node()) {
                var tOrig = _tDown;
                window.setTimeout(function() {
                    if (tOrig !== _tDown) return;   // exit if user double clicked
                    fetchComboData('', function() {
                        show();
                        render();
                    });
                }, 250);

            } else {
                hide();
            }
        }


        function focus() {
            fetchComboData('');   // prefetch values (may warm taginfo cache)
        }


        function blur() {
            _comboHideTimerID = window.setTimeout(hide, 75);
        }


        function show() {
            hide();   // remove any existing

            container
                .insert('div', ':first-child')
                .datum(input.node())
                .attr('class', 'combobox' + (klass ? ' combobox-' + klass : ''))
                .style('position', 'absolute')
                .style('display', 'block')
                .style('left', '0px')
                .on('mousedown.combo-container', function () {
                    // prevent moving focus out of the input field
                    d3_event.preventDefault();
                });

            container
                .on('scroll.combo-scroll', render, true);
        }


        function hide() {
            if (_comboHideTimerID) {
                window.clearTimeout(_comboHideTimerID);
                _comboHideTimerID = undefined;
            }

            container.selectAll('.combobox')
                .remove();

            container
                .on('scroll.combo-scroll', null);
        }


        function keydown() {
            var shown = !container.selectAll('.combobox').empty();
            var tagName = input.node() ? input.node().tagName.toLowerCase() : '';

            switch (d3_event.keyCode) {
                case 8:   // ⌫ Backspace
                case 46:  // ⌦ Delete
                    d3_event.stopPropagation();
                    _selected = null;
                    render();
                    input.on('input.combo-input', function() {
                        var start = input.property('selectionStart');
                        input.node().setSelectionRange(start, start);
                        input.on('input.combo-input', change);
                    });
                    break;

                case 9:   // ⇥ Tab
                    accept();
                    break;

                case 13:  // ↩ Return
                    d3_event.preventDefault();
                    d3_event.stopPropagation();
                    break;

                case 38:  // ↑ Up arrow
                    if (tagName === 'textarea' && !shown) return;
                    d3_event.preventDefault();
                    if (tagName === 'input' && !shown) {
                        show();
                    }
                    nav(-1);
                    break;

                case 40:  // ↓ Down arrow
                    if (tagName === 'textarea' && !shown) return;
                    d3_event.preventDefault();
                    if (tagName === 'input' && !shown) {
                        show();
                    }
                    nav(+1);
                    break;
            }
        }


        function keyup() {
            switch (d3_event.keyCode) {
                case 27:  // ⎋ Escape
                    cancel();
                    break;

                case 13:  // ↩ Return
                    accept();
                    break;
            }
        }


        // Called whenever the input value is changed (e.g. on typing)
        function change() {
            fetchComboData(value(), function() {
                _selected = null;
                var val = input.property('value');

                if (_suggestions.length) {
                    if (input.property('selectionEnd') === val.length) {
                        _selected = tryAutocomplete();
                    }

                    if (!_selected) {
                        _selected = val;
                    }
                }

                if (val.length) {
                    var combo = container.selectAll('.combobox');
                    if (combo.empty()) {
                        show();
                    }
                } else {
                    hide();
                }

                render();
            });
        }


        // Called when the user presses up/down arrows to navigate the list
        function nav(dir) {
            if (_suggestions.length) {
                // try to determine previously selected index..
                var index = -1;
                for (var i = 0; i < _suggestions.length; i++) {
                    if (_selected && _suggestions[i].value === _selected) {
                        index = i;
                        break;
                    }
                }

                // pick new _selected
                index = Math.max(Math.min(index + dir, _suggestions.length - 1), 0);
                _selected = _suggestions[index].value;
                input.property('value', _selected);
            }

            render();
            ensureVisible();
        }


        function ensureVisible() {
            var combo = container.selectAll('.combobox');
            if (combo.empty()) return;

            var containerRect = container.node().getBoundingClientRect();
            var comboRect = combo.node().getBoundingClientRect();

            if (comboRect.bottom > containerRect.bottom) {
                var node = attachTo ? attachTo.node() : input.node();
                node.scrollIntoView({ behavior: 'instant', block: 'center' });
                render();
            }

            // https://stackoverflow.com/questions/11039885/scrollintoview-causing-the-whole-page-to-move
            var selected = combo.selectAll('.combobox-option.selected').node();
            if (selected) {
                selected.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }


        function value() {
            var value = input.property('value');
            var start = input.property('selectionStart');
            var end = input.property('selectionEnd');

            if (start && end) {
                value = value.substring(0, start);
            }

            return value;
        }


        function fetchComboData(v, cb) {
            _cancelFetch = false;

            _fetcher.call(input, v, function(results) {
                // already chose a value, don't overwrite or autocomplete it
                if (_cancelFetch) return;

                _suggestions = results;
                results.forEach(function(d) { _fetched[d.value] = d; });

                if (cb) {
                    cb();
                }
            });
        }


        function tryAutocomplete() {
            if (!_canAutocomplete) return;

            var val = _caseSensitive ? value() : value().toLowerCase();
            if (!val) return;

            // Don't autocomplete if user is typing a number - #4935
            if (!isNaN(parseFloat(val)) && isFinite(val)) return;

            var bestIndex = -1;
            for (var i = 0; i < _suggestions.length; i++) {
                var suggestion = _suggestions[i].value;
                var compare = _caseSensitive ? suggestion : suggestion.toLowerCase();

                // if search string matches suggestion exactly, pick it..
                if (compare === val) {
                    bestIndex = i;
                    break;

                // otherwise lock in the first result that starts with the search string..
                } else if (bestIndex === -1 && compare.indexOf(val) === 0) {
                    bestIndex = i;
                }
            }

            if (bestIndex !== -1) {
                var bestVal = _suggestions[bestIndex].value;
                input.property('value', bestVal);
                input.node().setSelectionRange(val.length, bestVal.length);
                return bestVal;
            }
        }


        function render() {
            if (_suggestions.length < _minItems || document.activeElement !== input.node()) {
                hide();
                return;
            }

            var shown = !container.selectAll('.combobox').empty();
            if (!shown) return;

            var combo = container.selectAll('.combobox');
            var options = combo.selectAll('.combobox-option')
                .data(_suggestions, function(d) { return d.value; });

            options.exit()
                .remove();

            // enter/update
            options.enter()
                .append('a')
                .attr('class', 'combobox-option')
                .attr('title', function(d) { return d.title; })
                .text(function(d) { return d.display || d.value; })
                .on('mouseenter', _mouseEnterHandler)
                .on('mouseleave', _mouseLeaveHandler)
                .merge(options)
                .classed('selected', function(d) { return d.value === _selected; })
                .on('click.combo-option', accept)
                .order();

            var node = attachTo ? attachTo.node() : input.node();
            var containerRect = container.node().getBoundingClientRect();
            var rect = node.getBoundingClientRect();

            combo
                .style('left', (rect.left + 5 - containerRect.left) + 'px')
                .style('width', (rect.width - 10) + 'px')
                .style('top', (rect.height + rect.top - containerRect.top) + 'px');
        }


        // Dispatches an 'accept' event
        // Then hides the combobox.
        function accept(d) {
            _cancelFetch = true;
            var thiz = input.node();

            if (d) {   // user clicked on a suggestion
                utilGetSetValue(input, d.value);    // replace field contents
                utilTriggerEvent(input, 'change');
            }

            // clear (and keep) selection
            var val = utilGetSetValue(input);
            thiz.setSelectionRange(val.length, val.length);

            d = _fetched[val];
            dispatch.call('accept', thiz, d, val);
            hide();
        }


        // Dispatches an 'cancel' event
        // Then hides the combobox.
        function cancel() {
            _cancelFetch = true;
            var thiz = input.node();

            // clear (and remove) selection, and replace field contents
            var val = utilGetSetValue(input);
            var start = input.property('selectionStart');
            var end = input.property('selectionEnd');
            val = val.slice(0, start) + val.slice(end);
            utilGetSetValue(input, val);
            thiz.setSelectionRange(val.length, val.length);

            dispatch.call('cancel', thiz);
            hide();
        }

    };


    combobox.canAutocomplete = function(val) {
        if (!arguments.length) return _canAutocomplete;
        _canAutocomplete = val;
        return combobox;
    };

    combobox.caseSensitive = function(val) {
        if (!arguments.length) return _caseSensitive;
        _caseSensitive = val;
        return combobox;
    };

    combobox.data = function(val) {
        if (!arguments.length) return _data;
        _data = val;
        return combobox;
    };

    combobox.fetcher = function(val) {
        if (!arguments.length) return _fetcher;
        _fetcher = val;
        return combobox;
    };

    combobox.minItems = function(val) {
        if (!arguments.length) return _minItems;
        _minItems = val;
        return combobox;
    };

    combobox.itemsMouseEnter = function(val) {
        if (!arguments.length) return _mouseEnterHandler;
        _mouseEnterHandler = val;
        return combobox;
    };

    combobox.itemsMouseLeave = function(val) {
        if (!arguments.length) return _mouseLeaveHandler;
        _mouseLeaveHandler = val;
        return combobox;
    };

    return utilRebind(combobox, dispatch, 'on');
}


uiCombobox.off = function(input, context) {
    input
        .on('focus.combo-input', null)
        .on('blur.combo-input', null)
        .on('keydown.combo-input', null)
        .on('keyup.combo-input', null)
        .on('input.combo-input', null)
        .on('mousedown.combo-input', null)
        .on('mouseup.combo-input', null);


    context.container()
        .on('scroll.combo-scroll', null);
};
