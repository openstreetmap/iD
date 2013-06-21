describe("d3.combobox", function() {
    var body, content, input, combobox;

    var data = [
        {title: 'abbot', value: 'abbot'},
        {title: 'costello', value: 'costello'}
    ];

    function simulateKeypress(key) {
        var keyCode = d3.keybinding.keyCodes[key],
            value = input.property('value'),
            start = input.property('selectionStart'),
            finis = input.property('selectionEnd');

        happen.keydown(input.node(), {keyCode: keyCode});

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
        content = body.append('div');
        input = content.append('input');
        combobox = d3.combobox();
    });

    afterEach(function() {
        content.remove();
        body.selectAll('.combobox').remove();
    });

    it("adds the combobox-input class", function() {
        input.call(combobox);
        expect(input).to.be.classed('combobox-input');
    });

    it("creates entries for each datum", function() {
        input.call(combobox.data(data));
        input.node().focus();
        expect(body.selectAll('.combobox-option').size()).to.equal(2);
    });

    it("filters entries to those matching the value", function() {
        input.property('value', 'c').call(combobox.data(data));
        input.node().focus();
        expect(body.selectAll('.combobox-option').size()).to.equal(1);
        expect(body.selectAll('.combobox-option').text()).to.equal('costello');
    });

    it("is initially shown with no selection", function() {
        input.call(combobox.data(data));
        input.node().focus();
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(0);
    });

    it("selects the first option matching the input", function() {
        input.call(combobox.data(data));
        input.node().focus();
        simulateKeypress('c');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(1);
        expect(body.selectAll('.combobox-option.selected').text()).to.equal('costello');
    });

    it("selects the completed portion of the value", function() {
        input.call(combobox.data(data));
        input.node().focus();
        simulateKeypress('c');
        expect(input.property('value')).to.equal('costello');
        expect(input.property('selectionStart')).to.equal(1);
        expect(input.property('selectionEnd')).to.equal(8);
    });

    it("preserves the case of the input portion of the value", function() {
        input.call(combobox.data(data));
        input.node().focus();
        simulateKeypress('C');
        expect(input.property('value')).to.equal('Costello');
        expect(input.property('selectionStart')).to.equal(1);
        expect(input.property('selectionEnd')).to.equal(8);
    });

    it("does not select on ⇥", function() {
        input.call(combobox.data(data));
        input.node().focus();
        simulateKeypress('c');
        simulateKeypress('⇥');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(0);
    });

    it("does not select when value is empty", function() {
        input.call(combobox.data(data));
        input.node().focus();
        happen.once(input.node(), {type: 'input'});
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(0);
    });

    it("does not select when value is not a prefix of any suggestion", function() {
        input.call(combobox.data(data));
        input.node().focus();
        simulateKeypress('c');
        simulateKeypress('a');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(0);
    });

    it("does not select or autocomplete after ⌫", function() {
        input.call(combobox.data(data));
        input.node().focus();
        simulateKeypress('c');
        simulateKeypress('⌫');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(0);
        expect(input.property('value')).to.equal('c');
    });

    it("does not select or autocomplete after ⌦", function() {
        input.call(combobox.data(data));
        input.node().focus();
        simulateKeypress('a');
        simulateKeypress('c');
        simulateKeypress('←');
        simulateKeypress('←');
        simulateKeypress('⌦');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(0);
        expect(input.property('value')).to.equal('c');
    });

    it("selects and autocompletes the next/prev suggestion on ↓/↑", function() {
        input.call(combobox.data(data));
        input.node().focus();

        simulateKeypress('↓');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(1);
        expect(body.selectAll('.combobox-option.selected').text()).to.equal('abbot');
        expect(input.property('value')).to.equal('abbot');

        simulateKeypress('↓');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(1);
        expect(body.selectAll('.combobox-option.selected').text()).to.equal('costello');
        expect(input.property('value')).to.equal('costello');

        simulateKeypress('↑');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(1);
        expect(body.selectAll('.combobox-option.selected').text()).to.equal('abbot');
        expect(input.property('value')).to.equal('abbot');
    });
});
