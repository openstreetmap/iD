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
        var finis = input.property('selectionEnd');

        d3.customEvent(happen.makeEvent({
            type: 'keydown',
            keyCode: keyCode
        }), input.on('keydown.combo-input'));

        switch (key) {
            case '⇥':
                break;

            case '←':
                start = finis = Math.max(0, start - 1);
                input.node().setSelectionRange(start, finis);
                break;

            case '→':
                start = finis = Math.max(start + 1, value.length);
                input.node().setSelectionRange(start, finis);
                break;

            case '↑':
            case '↓':
            case '↩':
            case '⎋':
                break;

            case '⌫':
                value = value.substring(0, start - (start === finis ? 1 : 0)) +
                    value.substring(finis, value.length);
                input.property('value', value);
                happen.once(input.node(), {type: 'input'});
                break;

            case '⌦':
                value = value.substring(0, start) +
                    value.substring(finis + (start === finis ? 1 : 0), value.length);
                input.property('value', value);
                happen.once(input.node(), {type: 'input'});
                break;

            default:
                value = value.substring(0, start) + key + value.substring(finis, value.length);
                input.property('value', value);
                happen.once(input.node(), {type: 'input'});
        }

        happen.keyup(input.node(), {keyCode: keyCode});
    }

    beforeEach(function() {
        body = d3.select('body');
        container = body.append('div').attr('class', 'ideditor');
        context = iD.coreContext().init().container(container);
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
        d3.customEvent(happen.makeEvent('focus'), input.on('focus.combo-input'));
    }

    it('adds the combobox-input class', function() {
        input.call(combobox);
        expect(input.classed('combobox-input')).to.be.true;
    });

    it('adds combobox under container', function() {
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('↓');
        expect(d3.select('.ideditor > div.combobox').nodes().length).to.equal(1);
    });

    it('filters entries to those matching the value', function() {
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('b');
        expect(body.selectAll('.combobox-option').size()).to.equal(3);
        expect(body.selectAll('.combobox-option').nodes()[0].text).to.equal('foobar');
        expect(body.selectAll('.combobox-option').nodes()[1].text).to.equal('bar');
        expect(body.selectAll('.combobox-option').nodes()[2].text).to.equal('Baz');
    });

    it('shows all entries when activating the combo', function() {
        input.property('value', 'foobar').call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('↓');
        expect(body.selectAll('.combobox-option').size()).to.equal(5);
        expect(body.selectAll('.combobox-option').text()).to.equal('foobar');
    });

    it('selects the first option that matches the input', function() {
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('b');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(1);
        expect(body.selectAll('.combobox-option.selected').text()).to.equal('bar');
    });

    it('prefers an option that exactly matches the input over the first option', function() {
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('f');
        simulateKeypress('o');
        simulateKeypress('o');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(1);
        expect(body.selectAll('.combobox-option.selected').text()).to.equal('foo');  // skip foobar
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
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(0);
    });

    it('does not autocomplete if canAutocomplete(false)', function() {
        input.call(combobox.data(data).canAutocomplete(false));
        focusTypeahead(input);
        simulateKeypress('b');
        expect(input.property('value')).to.equal('b');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(0);
    });

    it('selects the completed portion of the value', function() {
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('b');
        expect(input.property('value')).to.equal('bar');
        expect(input.property('selectionStart')).to.equal(1);
        expect(input.property('selectionEnd')).to.equal(3);
    });

    it('does not preserve the case of the input portion of the value by default', function() {
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('B');
        expect(input.property('value')).to.equal('bar');
        expect(input.property('selectionStart')).to.equal(1);
        expect(input.property('selectionEnd')).to.equal(3);
    });

    it('does preserve the case of the input portion of the value with caseSensitive option', function() {
        combobox.caseSensitive(true);
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('B');
        expect(input.property('value')).to.equal('Baz');
        expect(input.property('selectionStart')).to.equal(1);
        expect(input.property('selectionEnd')).to.equal(3);
    });

    it('does not select when value is empty', function() {
        input.call(combobox.data(data));
        focusTypeahead(input);
        happen.once(input.node(), {type: 'input'});
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(0);
    });

    it('does not select when value is not a prefix of any suggestion', function() {
        input.call(combobox.fetcher(function(_, cb) { cb(data); }));
        focusTypeahead(input);
        simulateKeypress('b');
        simulateKeypress('i');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(0);
    });

    it('does not select or autocomplete after ⌫', function() {
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('b');
        simulateKeypress('⌫');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(0);
        expect(input.property('value')).to.equal('b');
    });

    it('does not select or autocomplete after ⌦', function() {
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('f');
        simulateKeypress('b');
        simulateKeypress('←');
        simulateKeypress('←');
        simulateKeypress('⌦');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(0);
        expect(input.property('value')).to.equal('b');
    });

    it('selects and autocompletes the next/prev suggestion on ↓/↑', function() {
        input.call(combobox.data(data));
        focusTypeahead(input);

        simulateKeypress('↓');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(1);
        expect(body.selectAll('.combobox-option.selected').text()).to.equal('foobar');
        expect(input.property('value')).to.equal('foobar');

        simulateKeypress('↓');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(1);
        expect(body.selectAll('.combobox-option.selected').text()).to.equal('foo');
        expect(input.property('value')).to.equal('foo');

        simulateKeypress('↑');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(1);
        expect(body.selectAll('.combobox-option.selected').text()).to.equal('foobar');
        expect(input.property('value')).to.equal('foobar');
    });

    it('emits accepted event with selected datum on ⇥', function(done) {
        combobox.on('accept', function(d) {
            expect(d).to.eql({title: 'bar', value: 'bar'});
            combobox.on('accept', null);
            done();
        });
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('b');
        simulateKeypress('⇥');
    });

    it('emits accepted event with selected datum on ↩', function(done) {
        combobox.on('accept', function(d) {
            expect(d).to.eql({title: 'bar', value: 'bar'});
            combobox.on('accept', null);
            done();
        });
        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('b');
        simulateKeypress('↩');
    });

    it('emits cancel event on ⎋', function() {
        var spy = sinon.spy();
        combobox.on('cancel', spy);

        input.call(combobox.data(data));
        focusTypeahead(input);
        simulateKeypress('b');
        simulateKeypress('⎋');
        expect(spy).to.have.been.calledOnce;
    });

    it('hides on ↩', function() {
        input.call(combobox.data(data));
        input.node().focus();
        simulateKeypress('↩');
        expect(body.selectAll('.combobox').size()).to.equal(0);
    });
});
