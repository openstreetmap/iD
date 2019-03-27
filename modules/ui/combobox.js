import {
    dispatch as d3_dispatch
} from 'd3-dispatch';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { utilGetSetValue, utilRebind, utilTriggerEvent } from '../util';


// This code assumes that the combobox values will not have duplicate entries.
// It is keyed on the `value` of the entry.
// Data should be an array of objects like:
//   [{
//       title:  'hover text',
//       value:  'display text'
//   }, ...]

var _comboTimerID;

export function uiCombobox(context, klass) {
    var dispatch = d3_dispatch('accept', 'cancel');
    var container = context.container();
    var _suggestions = [];
    var _values = [];
    var _choice = null;
    var _canAutocomplete = true;
    var _caseSensitive = false;
    var _minItems = 2;

    var _fetcher = function(val, cb) {
        cb(_values.filter(function(d) {
            return d.value
                .toString()
                .toLowerCase()
                .indexOf(val.toLowerCase()) !== -1;
        }));
    };

    var combobox = function(input, attachTo) {
        if (!input || input.empty()) return;

        input
            .classed('combobox-input', true)
            .on('focus.typeahead', focus)
            .on('blur.typeahead', blur)
            .on('keydown.typeahead', keydown)
            .on('keyup.typeahead', keyup)
            .on('input.typeahead', change)
            .on('mousedown', mousedown)
            .each(addCaret);

        function addCaret() {
            var parent = this.parentNode;
            var sibling = this.nextSibling;

            d3_select(parent).selectAll('.combobox-caret')
                .filter(function(d) { return d === input.node(); })
                .data([input.node()])
                .enter()
                .insert('div', function() { return sibling; })
                .attr('class', 'combobox-caret');
        }


        function focus() {
            _choice = null;
            fetch('');   // prefetch values (may warm taginfo cache)
        }


        function blur() {
            _comboTimerID = window.setTimeout(hide, 150);
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
                .on('mousedown', function () {
                    // prevent moving focus out of the input field
                    d3_event.preventDefault();
                });

            d3_select('body')
                .on('scroll.combobox', render, true);
        }


        function hide() {
            if (_comboTimerID) {
                window.clearTimeout(_comboTimerID);
                _comboTimerID = undefined;
            }

            container.selectAll('.combobox')
                .remove();

            d3_select('body')
                .on('scroll.combobox', null);
        }


        function keydown() {
            var shown = !container.selectAll('.combobox').empty();
            var tagName = input.node() ? input.node().tagName.toLowerCase() : '';

            switch (d3_event.keyCode) {
                case 8:   // ⌫ Backspace
                case 46:  // ⌦ Delete
                    d3_event.stopPropagation();
                    _choice = null;
                    render();
                    input.on('input.typeahead', function() {
                        var start = input.property('selectionStart');
                        input.node().setSelectionRange(start, start);
                        input.on('input.typeahead', change);
                    });
                    break;

                case 9:   // ⇥ Tab
                    d3_event.stopPropagation();
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


        function change() {
            fetch(value(), function() {
                if (input.property('selectionEnd') === input.property('value').length) {
                    tryAutocomplete();
                }

                var combo = container.selectAll('.combobox');
                if (combo.empty()) {
                    show();
                }
                render();
            });
        }


        function mousedown() {
            // prevent the form element from blurring. it blurs on mousedown
            d3_event.stopPropagation();
            d3_event.preventDefault();
            var combo = container.selectAll('.combobox');
            if (combo.empty()) {
                input.node().focus();
                fetch('', function() {
                    show();
                    render();
                });
            } else {
                hide();
            }
        }

        function nav(dir) {
            if (!_suggestions.length) return;

            var index = -1;
            for (var i = 0; i < _suggestions.length; i++) {
                if (_choice && _suggestions[i].value === _choice.value) {
                    index = i;
                    break;
                }
            }

            index = Math.max(Math.min(index + dir, _suggestions.length - 1), 0);
            _choice = _suggestions[index];
            input.property('value', _choice.value);
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


        function fetch(v, cb) {
            _fetcher.call(input, v, function(results) {
                _suggestions = results;
                if (cb) {
                    cb();
                }
            });
        }


        function tryAutocomplete() {
            if (!_canAutocomplete) return;

            var v = _caseSensitive ? value() : value().toLowerCase();
            _choice = null;
            if (!v) return;

            // Don't autocomplete if user is typing a number - #4935
            if (!isNaN(parseFloat(v)) && isFinite(v)) return;

            var best = -1;
            for (var i = 0; i < _suggestions.length; i++) {
                var suggestion = _suggestions[i].value;
                var compare = _caseSensitive ? suggestion : suggestion.toLowerCase();

                // if search string matches suggestion exactly, pick it..
                if (compare === v) {
                    best = i;
                    break;

                // otherwise lock in the first result that starts with the search string..
                } else if (best === -1 && compare.indexOf(v) === 0) {
                    best = i;
                }
            }

            if (best !== -1) {
                _choice = _suggestions[best];
                input.property('value', _choice.value);
                input.node().setSelectionRange(v.length, _choice.value.length);
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
                .text(function(d) { return d.value; })
                .merge(options)
                .attr('title', function(d) { return d.title; })
                .classed('selected', function(d) { return d === _choice; })
                .on('click', accept)
                .order();

            var node = attachTo ? attachTo.node() : input.node();
            var rect = node.getBoundingClientRect();

            combo
                .style('left', (rect.left + 5) + 'px')
                .style('width', (rect.width - 10) + 'px')
                .style('top', rect.height + rect.top + 'px');
        }

        // Dispatches an 'accept' event if an option has been chosen.
        // Then hides the combobox.
        function accept(d) {
            d = d || _choice || value();
            if (d) {
                utilGetSetValue(input, d.value);
                utilTriggerEvent(input, 'change');
                dispatch.call('accept', this, d);
            }
            hide();
        }

        // Dispatches an 'cancel' event
        // Then hides the combobox.
        function cancel(d) {
            d = d || _choice;
            dispatch.call('cancel', this, d);
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
        if (!arguments.length) return _values;
        _values = val;
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


    return utilRebind(combobox, dispatch, 'on');
}


uiCombobox.off = function(input) {
    input
        .on('focus.typeahead', null)
        .on('blur.typeahead', null)
        .on('keydown.typeahead', null)
        .on('keyup.typeahead', null)
        .on('input.typeahead', null)
        .each(function() {
            d3_select(this.parentNode).selectAll('.combobox-caret')
                .filter(function(d) { return d === input.node(); })
                .on('mousedown', null);
        });

    d3_select('body')
        .on('scroll.combobox', null);
};
