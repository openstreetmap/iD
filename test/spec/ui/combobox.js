import { fn } from '@vitest/spy';
import { select as d3_select, selectAll as d3_selectAll } from 'd3-selection';

describe('uiCombobox', function() {
    var body, context, container, content, input, combobox;

    var data = [
        {title: 'foobar', value: 'foobar'},
        {title: 'foo', value: 'foo'},
        {title: 'bar', value: 'bar'},
        {title: 'Baz', value: 'Baz'},
        {title: 'test', value: 'test'}
    ];

    function simulateKeypress(key) {
        var keyCode = iD.utilKeybinding.keyCodes[key];
        var value = input.property('value');
        var start = input.property('selectionStart');
        var finish = input.property('selectionEnd');

        input.node().dispatchEvent(new KeyboardEvent('keydown', { keyCode }));

        switch (key) {
            case '⇥':
                break;

            case '←':
                start = Math.max(0, start - 1);
                finish = start;
                input.node().setSelectionRange(start, finish);
                break;

            case '→':
                start = Math.max(start + 1, value.length);
                finish = start;
                input.node().setSelectionRange(start, finish);
                break;

            case '↑':
            case '↓':
            case '↩':
            case '⎋':
                break;

            case '⌫':
                value = value.substring(0, start - (start === finish ? 1 : 0)) +
                    value.substring(finish, value.length);
                input.property('value', value);
                input.node().dispatchEvent(new MouseEvent('input'));
                break;

            case '⌦':
                value = value.substring(0, start) +
                    value.substring(finish + (start === finish ? 1 : 0), value.length);
                input.property('value', value);
                input.node().dispatchEvent(new MouseEvent('input'));
                break;

            default:
                value = value.substring(0, start) + key + value.substring(finish, value.length);
                input.property('value', value);
                input.node().dispatchEvent(new MouseEvent('input'));
        }

        input.node().dispatchEvent(new KeyboardEvent('keyup', { keyCode }));
    }

    beforeEach(function() {
        body = d3_select('body');
        container = body.append('div').attr('class', 'ideditor');
        context = iD.coreContext().assetPath('../dist/').init().container(container);
        content = container.append('div');
        input = content.append('input');
        combobox = iD.uiCombobox(context);
    });

    afterEach(function() {
        body.selectAll('.combobox').remove();
        content.remove();
        container.remove();
    });

    function focusTypeahead(input) {
        input.node().focus();
    }

    it('adds the combobox-input class', function() {
        input.call(combobox);
        expect(input.classed('combobox-input')).toBe(true);
    });

    it('adds combobox under container', function() {
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('↓');
        expect(d3_selectAll('.ideditor > div.combobox').size()).toEqual(1);
    });

    it('filters entries to those matching the value', function() {
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('b');
        expect(body.selectAll('.combobox-option').size()).toEqual(3);
        expect(body.selectAll('.combobox-option').nodes()[0].text).toEqual('foobar');
        expect(body.selectAll('.combobox-option').nodes()[1].text).toEqual('bar');
        expect(body.selectAll('.combobox-option').nodes()[2].text).toEqual('Baz');
    });

    it('shows all entries when activating the combo', function() {
        input.property('value', 'foobar').call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('↓');
        expect(body.selectAll('.combobox-option').size()).toEqual(5);
        expect(body.selectAll('.combobox-option').text()).toEqual('foobar');
    });

    it('selects the first option that matches the input', function() {
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('b');
        expect(body.selectAll('.combobox-option.selected').size()).toEqual(1);
        expect(body.selectAll('.combobox-option.selected').text()).toEqual('bar');
    });

    it('prefers an option that exactly matches the input over the first option', function() {
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('f');
        simulateKeypress('o');
        simulateKeypress('o');
        expect(body.selectAll('.combobox-option.selected').size()).toEqual(1);
        expect(body.selectAll('.combobox-option.selected').text()).toEqual('foo');  // skip foobar
    });

    it('does not autocomplete numeric options', function() {
        var numeric = [
            {title: '100', value: '100'},
            {title: '110', value: '110'}
        ];
        input.call(combobox.data(numeric));
        focusTypeahead(input);
        simulateKeypress('1');
        simulateKeypress('0');
        expect(body.selectAll('.combobox-option.selected').size()).toEqual(0);
    });

    it('does not autocomplete if canAutocomplete(false)', function() {
        input.call(combobox.data(data).canAutocomplete(false));
        focusTypeahead(input);
        simulateKeypress('b');
        expect(input.property('value')).toEqual('b');
        expect(body.selectAll('.combobox-option.selected').size()).toEqual(0);
    });

    it('selects the completed portion of the value', function() {
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('b');
        expect(input.property('value')).toEqual('bar');
        expect(input.property('selectionStart')).toEqual(1);
        expect(input.property('selectionEnd')).toEqual(3);
    });

    it('does not preserve the case of the input portion of the value by default', function() {
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('B');
        expect(input.property('value')).toEqual('bar');
        expect(input.property('selectionStart')).toEqual(1);
        expect(input.property('selectionEnd')).toEqual(3);
    });

    it('does preserve the case of the input portion of the value with caseSensitive option', function() {
        combobox.caseSensitive(true);
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('B');
        expect(input.property('value')).toEqual('Baz');
        expect(input.property('selectionStart')).toEqual(1);
        expect(input.property('selectionEnd')).toEqual(3);
    });

    it('does not select when value is empty', function() {
        input.call(combobox.data(data));
        focusTypeahead(input);
        input.node().dispatchEvent(new MouseEvent('input'));
        expect(body.selectAll('.combobox-option.selected').size()).toEqual(0);
    });

    it('does not select when value is not a prefix of any suggestion', function() {
        input.call(combobox.fetcher(function(_, cb) { cb(data); }));
        focusTypeahead(input);
        simulateKeypress('b');
        simulateKeypress('i');
        expect(body.selectAll('.combobox-option.selected').size()).toEqual(0);
    });

    it('does not select or autocomplete after ⌫', function() {
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('b');
        simulateKeypress('⌫');
        expect(body.selectAll('.combobox-option.selected').size()).toEqual(0);
        expect(input.property('value')).toEqual('b');
    });

    it('does not select or autocomplete after ⌦', function() {
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('f');
        simulateKeypress('b');
        simulateKeypress('←');
        simulateKeypress('←');
        simulateKeypress('⌦');
        expect(body.selectAll('.combobox-option.selected').size()).toEqual(0);
        expect(input.property('value')).toEqual('b');
    });

    it('selects and autocompletes the next/prev suggestion on ↓/↑', function() {
        input.call(combobox.data(data));
        focusTypeahead(input);

        simulateKeypress('↓');
        expect(body.selectAll('.combobox-option.selected').size()).toEqual(1);
        expect(body.selectAll('.combobox-option.selected').text()).toEqual('foobar');
        expect(input.property('value')).toEqual('foobar');

        simulateKeypress('↓');
        expect(body.selectAll('.combobox-option.selected').size()).toEqual(1);
        expect(body.selectAll('.combobox-option.selected').text()).toEqual('foo');
        expect(input.property('value')).toEqual('foo');

        simulateKeypress('↑');
        expect(body.selectAll('.combobox-option.selected').size()).toEqual(1);
        expect(body.selectAll('.combobox-option.selected').text()).toEqual('foobar');
        expect(input.property('value')).toEqual('foobar');
    });

    it('emits accepted event with selected datum on ⇥', async () => {
        const d = new Promise(cb => { combobox.on('accept', cb); });
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('b');
        simulateKeypress('⇥');
        expect(await d).toEqual({title: 'bar', value: 'bar'});
        combobox.on('accept', null);
    });

    it('emits accepted event with selected datum on ↩', async () => {
        const d = new Promise(cb => { combobox.on('accept', cb); });
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('b');
        simulateKeypress('↩');
        expect(await d).toEqual({title: 'bar', value: 'bar'});
        combobox.on('accept', null);
    });

    it('emits cancel event on ⎋', function() {
        const spy = fn();
        combobox.on('cancel', spy);

        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('b');
        simulateKeypress('⎋');
        expect(spy).toHaveBeenCalledOnce();
    });

    it('hides on ↩', function() {
        input.call(combobox.data(data));
        input.node().focus();
        simulateKeypress('↩');
        expect(body.selectAll('.combobox').size()).toEqual(0);
    });
});
