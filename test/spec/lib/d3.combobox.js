describe("d3.combobox", function() {
    var body, content, input, combobox;

    var data = [
        {title: 'foo', value: 'foo'},
        {title: 'bar', value: 'bar'},
        {title: 'baz', value: 'baz'}
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
            case '↩':
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

    it("shows a menu of entries on focus", function() {
        input.call(combobox.data(data));
        input.node().focus();
        expect(body.selectAll('.combobox-option').size()).to.equal(3);
        expect(body.selectAll('.combobox-option').text()).to.equal('foo');
    });

    it("filters entries to those matching the value", function() {
        input.property('value', 'b').call(combobox.data(data));
        input.node().focus();
        expect(body.selectAll('.combobox-option').size()).to.equal(2);
        expect(body.selectAll('.combobox-option')[0][0].text).to.equal('bar');
        expect(body.selectAll('.combobox-option')[0][1].text).to.equal('baz');
    });

    it("shows no menu on focus if it would contain only one item", function() {
        input.property('value', 'f').call(combobox.data(data));
        input.node().focus();
        expect(body.selectAll('.combobox-option').size()).to.equal(0);
    });

    it("shows menu on focus if it would contain at least minItems items", function() {
        combobox.minItems(1);
        input.property('value', 'f').call(combobox.data(data));
        input.node().focus();
        expect(body.selectAll('.combobox-option').size()).to.equal(1);
    });

    it("shows all entries when clicking on the caret", function() {
        input.property('value', 'foo').call(combobox.data(data));
        happen.mousedown(body.selectAll('.combobox-caret').node());
        expect(body.selectAll('.combobox-option').size()).to.equal(3);
        expect(body.selectAll('.combobox-option').text()).to.equal('foo');
    });

    it("is initially shown with no selection", function() {
        input.call(combobox.data(data));
        input.node().focus();
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(0);
    });

    it("selects the first option matching the input", function() {
        input.call(combobox.data(data));
        input.node().focus();
        simulateKeypress('b');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(1);
        expect(body.selectAll('.combobox-option.selected').text()).to.equal('bar');
    });

    it("selects the completed portion of the value", function() {
        input.call(combobox.data(data));
        input.node().focus();
        simulateKeypress('b');
        expect(input.property('value')).to.equal('bar');
        expect(input.property('selectionStart')).to.equal(1);
        expect(input.property('selectionEnd')).to.equal(3);
    });

    it("does not preserve the case of the input portion of the value", function() {
        input.call(combobox.data(data));
        input.node().focus();
        simulateKeypress('B');
        expect(input.property('value')).to.equal('bar');
        expect(input.property('selectionStart')).to.equal(1);
        expect(input.property('selectionEnd')).to.equal(3);
    });

    it("does not select when value is empty", function() {
        input.call(combobox.data(data));
        input.node().focus();
        happen.once(input.node(), {type: 'input'});
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(0);
    });

    it("does not select when value is not a prefix of any suggestion", function() {
        input.call(combobox.fetcher(function(_, cb) { cb(data); }));
        input.node().focus();
        simulateKeypress('b');
        simulateKeypress('i');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(0);
    });

    it("does not select or autocomplete after ⌫", function() {
        input.call(combobox.data(data));
        input.node().focus();
        simulateKeypress('b');
        simulateKeypress('⌫');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(0);
        expect(input.property('value')).to.equal('b');
    });

    it("does not select or autocomplete after ⌦", function() {
        input.call(combobox.data(data));
        input.node().focus();
        simulateKeypress('f');
        simulateKeypress('b');
        simulateKeypress('←');
        simulateKeypress('←');
        simulateKeypress('⌦');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(0);
        expect(input.property('value')).to.equal('b');
    });

    it("selects and autocompletes the next/prev suggestion on ↓/↑", function() {
        input.call(combobox.data(data));
        input.node().focus();

        simulateKeypress('↓');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(1);
        expect(body.selectAll('.combobox-option.selected').text()).to.equal('foo');
        expect(input.property('value')).to.equal('foo');

        simulateKeypress('↓');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(1);
        expect(body.selectAll('.combobox-option.selected').text()).to.equal('bar');
        expect(input.property('value')).to.equal('bar');

        simulateKeypress('↑');
        expect(body.selectAll('.combobox-option.selected').size()).to.equal(1);
        expect(body.selectAll('.combobox-option.selected').text()).to.equal('foo');
        expect(input.property('value')).to.equal('foo');
    });

    it("emits accepted event with selected datum on ⇥", function(done) {
        combobox.on('accept', function(d) {
            expect(d).to.eql({title: 'bar', value: 'bar'});
            done();
        });
        input.call(combobox.data(data));
        input.node().focus();
        simulateKeypress('b');
        simulateKeypress('⇥');
    });

    it("emits accepted event with selected datum on ↩", function(done) {
        combobox.on('accept', function(d) {
            expect(d).to.eql({title: 'bar', value: 'bar'});
            done();
        });
        input.call(combobox.data(data));
        input.node().focus();
        simulateKeypress('b');
        simulateKeypress('↩');
    });

    it("hides on ↩", function() {
        input.call(combobox.data(data));
        input.node().focus();
        simulateKeypress('↩');
        expect(body.selectAll('.combobox').size()).to.equal(0);
    });
});
