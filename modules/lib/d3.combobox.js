import {
    dispatch as d3_dispatch
} from 'd3-dispatch';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import {
    utilRebind,
    utilTriggerEvent
} from '../../modules/util';


export function d3combobox() {
    var dispatch = d3_dispatch('accept');
    var _container = d3_select(document.body);
    var _data = [];
    var _suggestions = [];
    var _minItems = 2;
    var _caseSensitive = false;

    var _fetcher = function(val, cb) {
        cb(_data.filter(function(d) {
            return d.value
                .toString()
                .toLowerCase()
                .indexOf(val.toLowerCase()) !== -1;
        }));
    };

    var combobox = function(input, attachTo) {
        var idx = -1;
        var wrapper = _container
            .selectAll('div.combobox')
            .filter(function(d) { return d === input.node(); });
        var shown = !wrapper.empty();
        var tagName = input.node() ? input.node().tagName.toLowerCase() : '';

        input
            .classed('combobox-input', true)
            .on('focus.typeahead', focus)
            .on('blur.typeahead', blur)
            .on('keydown.typeahead', keydown)
            .on('keyup.typeahead', keyup)
            .on('input.typeahead', change)
            .each(function() {
                var parent = this.parentNode;
                var sibling = this.nextSibling;

                var caret = d3_select(parent).selectAll('.combobox-caret')
                    .filter(function(d) { return d === input.node(); })
                    .data([input.node()]);

                caret = caret.enter()
                    .insert('div', function() { return sibling; })
                    .attr('class', 'combobox-caret')
                    .merge(caret);

                caret
                    .on('mousedown', function () {
                        // prevent the form element from blurring. it blurs
                        // on mousedown
                        d3_event.stopPropagation();
                        d3_event.preventDefault();
                        if (!shown) {
                            input.node().focus();
                            fetch('', render);
                        } else {
                            hide();
                        }
                    });
            });

        function focus() {
            fetch(value(), render);
        }

        function blur() {
            window.setTimeout(hide, 150);
        }

        function show() {
            if (!shown) {
                wrapper = _container
                    .insert('div', ':first-child')
                    .datum(input.node())
                    .attr('class', 'combobox')
                    .style('position', 'absolute')
                    .style('display', 'block')
                    .style('left', '0px')
                    .on('mousedown', function () {
                        // prevent moving focus out of the text field
                        d3_event.preventDefault();
                    });

                d3_select('body')
                    .on('scroll.combobox', render, true);

                shown = true;
            }
        }

        function hide() {
            if (shown) {
                idx = -1;
                wrapper.remove();

                d3_select('body')
                    .on('scroll.combobox', null);

                shown = false;
            }
        }

        function keydown() {
           switch (d3_event.keyCode) {
               // backspace, delete
               case 8:
               case 46:
                   input.on('input.typeahead', function() {
                       idx = -1;
                       render();
                       var start = input.property('selectionStart');
                       input.node().setSelectionRange(start, start);
                       input.on('input.typeahead', change);
                   });
                   break;
               // tab
               case 9:
                   wrapper.selectAll('a.selected').each(function (d) {
                       dispatch.call('accept', this, d);
                   });
                   hide();
                   break;
               // return
               case 13:
                   d3_event.preventDefault();
                   break;
               // up arrow
               case 38:
                   if (tagName === 'textarea' && !shown) return;
                   nav(-1);
                   d3_event.preventDefault();
                   break;
               // down arrow
               case 40:
                   if (tagName === 'textarea' && !shown) return;
                   nav(+1);
                   d3_event.preventDefault();
                   break;
           }
           d3_event.stopPropagation();
        }

        function keyup() {
            switch (d3_event.keyCode) {
                // escape
                case 27:
                    hide();
                    break;
                // return
                case 13:
                    wrapper.selectAll('a.selected').each(function (d) {
                       dispatch.call('accept', this, d);
                    });
                    hide();
                    break;
            }
        }

        function change() {
            fetch(value(), function() {
                if (input.property('selectionEnd') === input.property('value').length) {
                    autocomplete();
                }
                render();
            });
        }

        function nav(dir) {
            if (!_suggestions.length) return;
            idx = Math.max(Math.min(idx + dir, _suggestions.length - 1), 0);
            input.property('value', _suggestions[idx].value);
            render();
            ensureVisible();
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
            _fetcher.call(input, v, function(_) {
                _suggestions = _;
                cb();
            });
        }

        function autocomplete() {
            var v = _caseSensitive ? value() : value().toLowerCase();
            idx = -1;
            if (!v) return;

            var best = -1;
            var suggestion, compare;

            for (var i = 0; i < _suggestions.length; i++) {
                suggestion = _suggestions[i].value;
                compare = _caseSensitive ? suggestion : suggestion.toLowerCase();

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
                idx = best;
                suggestion = _suggestions[best].value;
                input.property('value', suggestion);
                input.node().setSelectionRange(v.length, suggestion.length);
            }
        }

        function render() {
            if (_suggestions.length >= _minItems && document.activeElement === input.node()) {
                show();
            } else {
                hide();
                return;
            }

            var options = wrapper
                .selectAll('a.combobox-option')
                .data(_suggestions, function(d) { return d.value; });

            options.exit()
                .remove();

            options.enter()
                .append('a')
                .attr('class', 'combobox-option')
                .text(function(d) { return d.value; })
                .merge(options)
                .attr('title', function(d) { return d.title; })
                .classed('selected', function(d, i) { return i === idx; })
                .on('mouseover', select)
                .on('click', accept)
                .order();


            var node = attachTo ? attachTo.node() : input.node();
            var rect = node.getBoundingClientRect();

            wrapper
                .style('left', (rect.left + 5) + 'px')
                .style('width', (rect.width - 10) + 'px')
                .style('top', rect.height + rect.top + 'px');
        }

        function select(d, i) {
            idx = i;
            render();
        }

        function ensureVisible() {
            var node = wrapper.selectAll('a.selected').node();
            if (node) node.scrollIntoView();
        }

        function accept(d) {
            if (!shown) return;
            input.property('value', d.value);
            utilTriggerEvent(input, 'change');
            dispatch.call('accept', this, d);
            hide();
        }
    };

    combobox.fetcher = function(_) {
        if (!arguments.length) return _fetcher;
        _fetcher = _;
        return combobox;
    };

    combobox.data = function(_) {
        if (!arguments.length) return _data;
        _data = _;
        return combobox;
    };

    combobox.minItems = function(_) {
        if (!arguments.length) return _minItems;
        _minItems = _;
        return combobox;
    };

    combobox.caseSensitive = function(_) {
        if (!arguments.length) return _caseSensitive;
        _caseSensitive = _;
        return combobox;
    };

    combobox.container = function(_) {
        if (!arguments.length) return _container;
        _container = _;
        return combobox;
    };

    return utilRebind(combobox, dispatch, 'on');
}


d3combobox.off = function(input) {
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
