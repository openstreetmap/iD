import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import { utilEditDistance, utilGetSetValue, utilRebind, utilTriggerEvent } from '../util';


// This code assumes that the combobox values will not have duplicate entries.
// It is keyed on the `value` of the entry. Data should be an array of objects like:
//   [{
//       value:   'string value',  // required
//       display: 'label function' // optional, if present will be called with d3 selection
//                                              to modify/append, see localizer's t.append
//       title:   'hover text'     // optional
//       terms:   ['search terms'] // optional
//   }, ...]

var _comboHideTimerID: number | undefined;

export function fuzzyMatch(search: string, string: string) {
    const numAllowedTypos = Math.floor(search.length / 5);
    if (utilEditDistance(search, string, {substring: true}) <= numAllowedTypos) {
        return true;
    }
}

export interface ComboData {
    value: string;
    key?: string;
    terms?: string[];
    title: string | null;
    description?: string;
    klass?: string;
    display?(span: d3.Selection<HTMLSpanElement>): void;
}

type ItemCallback = (event: unknown, d: ComboData) => void;

export interface uiCombobox {
    (input: d3.Selection<HTMLInputElement>, attachTo: d3.Selection): void;

    canAutocomplete: GetSet<this, boolean>;
    caseSensitive: GetSet<this, boolean>;
    data: GetSet<this, ComboData[]>;
    fetcher: GetSet<this, (val: string, cb: (data: ComboData[], skipAutosuggest?: boolean) => void) => void>;
    minItems: GetSet<this, number>;
    itemsMouseEnter: GetSet<this, ItemCallback>;
    itemsMouseLeave: GetSet<this, ItemCallback>;
}

export function uiCombobox(context: iD.Context, klass?: string) {
    var dispatch = d3_dispatch('accept', 'cancel', 'update');
    var container = context.container();

    var _suggestions: ComboData[] = [];
    var _data: ComboData[] = [];
    var _fetched: { [key: string]: ComboData } = {};
    var _selected: string | undefined | null = null;
    var _canAutocomplete = true;
    var _caseSensitive = false;
    var _cancelFetch = false;
    var _minItems = 1;
    var _tDown = 0;
    let _mouseEnterHandler: ItemCallback;
    let _mouseLeaveHandler: ItemCallback;

    var _fetcher = function(val: string, cb: (data: ComboData[], skipAutosuggest?: boolean) => void) {
        val = val.toLowerCase();
        cb(_data.filter(function(d) {
            var terms = d.terms || [];
            terms.push(d.value);
            if (d.key) {
                terms.push(d.key);
            }
            return terms.some(function(term) {
                term = term
                    .toString()
                    .toLowerCase();
                if (term.indexOf(val.toLowerCase()) !== -1) return true;
                if (fuzzyMatch(val, term)) return true;
                return false;
            });
        }));
    };

    const combobox: uiCombobox = function(input, attachTo) {
        if (!input || input.empty()) return;

        input
            .classed('combobox-input', true)
            .on('focus.combo-input', focus)
            .on('blur.combo-input', blur)
            .on('keydown.combo-input', keydown)
            .on('keyup.combo-input', keyup)
            .on('input.combo-input', change)
            .on('mousedown.combo-input', mousedown)
            .on('mouseup.combo-input', mouseup)
            .each(function() {
                var parent = this.parentNode as HTMLElement;
                var sibling = this.nextSibling as HTMLElement;

                d3_select(parent).selectAll('.combobox-caret')
                    .filter(function(d) { return d === input.node(); })
                    .data([input.node()])
                    .enter()
                    .insert('div', function() { return sibling; })
                    .attr('class', 'combobox-caret')
                    .on('mousedown.combo-caret', function(d3_event) {
                        d3_event.preventDefault(); // don't steal focus from input
                        input.node()!.focus(); // focus the input as if it was clicked
                        mousedown(d3_event);
                    })
                    .on('mouseup.combo-caret', function(d3_event) {
                        d3_event.preventDefault(); // don't steal focus from input
                        mouseup(d3_event);
                    });
            });


        function mousedown(d3_event: MouseEvent) {
            if (d3_event.button !== 0) return;    // left click only
            if (input.classed('disabled')) return;
            _tDown = +new Date();

            // mousedown should never bubble up (see #10481)
            d3_event.stopPropagation();

            // clear selection
            var start = input.property('selectionStart');
            var end = input.property('selectionEnd');
            if (start !== end) {
                var val = utilGetSetValue(input);
                input.node()!.setSelectionRange(val.length, val.length);
                return;
            }
        }


        function mouseup(d3_event: MouseEvent) {
            if (d3_event.button !== 0) return;    // left click only
            if (input.classed('disabled')) return;
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
                .on('mousedown.combo-container', function (d3_event) {
                    // prevent moving focus out of the input field
                    d3_event.preventDefault();
                });

            container
                .on('scroll.combo-scroll', render, true);
        }

        function hide() {
            _hide(container);
        }


        function keydown(d3_event: KeyboardEvent) {
            var shown = !container.selectAll('.combobox').empty();
            var tagName = input.node() ? input.node()!.tagName.toLowerCase() : '';

            switch (d3_event.keyCode) {
                case 8:   // ⌫ Backspace
                case 46:  // ⌦ Delete
                    d3_event.stopPropagation();
                    _selected = null;
                    render();
                    input.on('input.combo-input', function() {
                        var start = input.property('selectionStart');
                        input.node()!.setSelectionRange(start, start);
                        input.on('input.combo-input', change); // reset event handler
                        change(undefined, false);
                    });
                    break;

                case 9:   // ⇥ Tab
                    accept(d3_event);
                    break;

                case 13:  // ↩ Return
                    d3_event.preventDefault();
                    d3_event.stopPropagation();
                    accept(d3_event);
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


        function keyup(d3_event: KeyboardEvent) {
            switch (d3_event.keyCode) {
                case 27:  // ⎋ Escape
                    cancel();
                    break;
            }
        }


        // Called whenever the input value is changed (e.g. on typing)
        function change(d3_event?: KeyboardEvent, doAutoComplete?: boolean) {
            if (doAutoComplete === undefined) doAutoComplete = true;
            if (d3_event?.isComposing) doAutoComplete = false;
            fetchComboData(value(), function(skipAutosuggest) {
                _selected = null;
                var val = input.property('value');

                if (_suggestions.length) {
                    if (doAutoComplete && !skipAutosuggest && input.property('selectionEnd') === val.length) {
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
        function nav(dir: 1 | -1) {
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
                utilGetSetValue(input, _selected);
                dispatch.call('update');
            }

            render();
            ensureVisible();
        }


        function ensureVisible() {
            var combo = container.selectAll<HTMLDivElement, void>('.combobox');
            if (combo.empty()) return;

            var containerRect = container.node()!.getBoundingClientRect();
            var comboRect = combo.node()!.getBoundingClientRect();

            if (comboRect.bottom > containerRect.bottom) {
                var node = attachTo ? attachTo.node()! : input.node()!;
                node.scrollIntoView({ behavior: 'instant', block: 'center' });
                render();
            }

            // https://stackoverflow.com/questions/11039885/scrollintoview-causing-the-whole-page-to-move
            var selected = combo.selectAll<HTMLDivElement, void>('.combobox-option.selected').node();
            if (selected) {
                selected.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
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


        function fetchComboData(v: string, cb?: (skipAutosuggest?: boolean) => void) {
            _cancelFetch = false;

            _fetcher.call(input, v, function(results, skipAutosuggest) {
                // already chose a value, don't overwrite or autocomplete it
                if (_cancelFetch) return;

                _suggestions = results;
                results.forEach(function(d) { _fetched[d.value] = d; });

                if (cb) {
                    cb(skipAutosuggest);
                }
            });
        }


        function tryAutocomplete() {
            if (!_canAutocomplete) return;
            if (input.node() !== document.activeElement) return;

            var val = _caseSensitive ? value() : value().toLowerCase();
            if (!val) return;

            // Don't autocomplete if user is typing a number - #4935
            if (isFinite(val)) return;

            const suggestionValues: string[] = [];
            _suggestions.forEach(s => {
                suggestionValues.push(s.value);
                if (s.key && s.key !== s.value) {
                    suggestionValues.push(s.key);
                }
            });

            var bestIndex = -1;
            for (var i = 0; i < suggestionValues.length; i++) {
                var suggestion = suggestionValues[i];
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
                var bestVal = suggestionValues[bestIndex];
                input.property('value', bestVal);
                input.node()!.setSelectionRange(val.length, bestVal.length, 'backward');
                dispatch.call('update');
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
            var options = combo.selectAll<HTMLAnchorElement, ComboData>('.combobox-option')
                .data(_suggestions, function(d) { return d.value; });

            options.exit()
                .remove();

            // enter/update
            const enter = options.enter()
                .append('a')
                .attr('class', function(d) {
                    return 'combobox-option ' + (d.klass || '') + (d.description ? ' has-description' : '');
                })
                .attr('title', function(d) { return d.title; });

            enter.each(function(d) {
                    const sel = d3_select(this);
                    const labelSpan = sel.append('span')
                        .attr('class', 'combobox-option-label');
                    if (d.display) {
                        d.display(labelSpan);
                    } else {
                        labelSpan.text(d.value);
                    }
                    if (typeof d.description === 'string') {
                        sel.append('span')
                            .attr('class', 'combobox-option-description')
                            .text(d.description);
                    } else if (typeof d.description === 'function') {
                        sel.append('span')
                            .attr('class', 'combobox-option-description')
                            .call(d.description);
                    }
                });

            enter
                .on('mouseenter', _mouseEnterHandler)
                .on('mouseleave', _mouseLeaveHandler)
                .merge(options)
                .classed('selected', function(d) { return d.value === _selected || d.key === _selected; })
                .on('click.combo-option', accept)
                .order();

            var node = attachTo ? attachTo.node()! : input.node()!;
            var containerRect = container.node()!.getBoundingClientRect();
            var rect = node.getBoundingClientRect();

            combo
                .style('left', (rect.left + 5 - containerRect.left) + 'px')
                .style('width', (rect.width - 10) + 'px')
                .style('top', (rect.height + rect.top - containerRect.top) + 'px');
        }


        // Dispatches an 'accept' event
        // Then hides the combobox.
        function accept(d3_event: KeyboardEvent, d?: ComboData) {
            _cancelFetch = true;
            var thiz = input.node()!;

            if (d) {   // user clicked on a suggestion
                utilGetSetValue(input, d.value);    // replace field contents
                utilTriggerEvent(input, 'change');
            }

            // clear (and keep) selection
            var val = utilGetSetValue(input);
            thiz.setSelectionRange(val.length, val.length);

            if (!d) {
                d = _fetched[val];
            }

            if (val !== '') {
                // skipped if nothing was selected
                dispatch.call('accept', thiz, d, val);
            }

            hide();
        }


        // Dispatches an 'cancel' event
        // Then hides the combobox.
        function cancel() {
            _cancelFetch = true;
            var thiz = input.node()!;

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
    } as uiCombobox['canAutocomplete'];

    combobox.caseSensitive = function(val) {
        if (!arguments.length) return _caseSensitive;
        _caseSensitive = val;
        return combobox;
    } as uiCombobox['canAutocomplete'];

    combobox.data = function(val) {
        if (!arguments.length) return _data;
        _data = val;
        return combobox;
    } as uiCombobox['data'];

    combobox.fetcher = function(val) {
        if (!arguments.length) return _fetcher;
        _fetcher = val;
        return combobox;
    } as uiCombobox['fetcher'];

    combobox.minItems = function(val) {
        if (!arguments.length) return _minItems;
        _minItems = val;
        return combobox;
    } as uiCombobox['minItems'];

    combobox.itemsMouseEnter = function(val) {
        if (!arguments.length) return _mouseEnterHandler;
        _mouseEnterHandler = val;
        return combobox;
    } as uiCombobox['itemsMouseEnter'];

    combobox.itemsMouseLeave = function(val) {
        if (!arguments.length) return _mouseLeaveHandler;
        _mouseLeaveHandler = val;
        return combobox;
    } as uiCombobox['itemsMouseLeave'];

    return utilRebind(combobox, dispatch, 'on');
}


function _hide(container: d3.Selection) {
    if (_comboHideTimerID) {
        window.clearTimeout(_comboHideTimerID);
        _comboHideTimerID = undefined;
    }

    container.selectAll('.combobox')
        .remove();

    container
        .on('scroll.combo-scroll', null);
}


uiCombobox.off = function(input: d3.Selection<HTMLInputElement>, context: iD.Context) {
    _hide(context.container());
    input
        .on('focus.combo-input', null)
        .on('blur.combo-input', null)
        .on('keydown.combo-input', null)
        .on('keyup.combo-input', null)
        .on('input.combo-input', null)
        .on('mousedown.combo-input', null)
        .on('mouseup.combo-input', null)
        .on('mousedown.combo-caret', null)
        .on('mouseup.combo-caret', null);


    context.container()
        .on('scroll.combo-scroll', null);
};
