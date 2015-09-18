describe('iD.ui.preset.localized', function() {
    var selection, field;

    beforeEach(function() {
        selection = d3.select(document.createElement('div'));
        field = iD.presets.Field('test', {key: 'name'});
    });

    it("adds a blank set of fields when the + button is clicked", function() {
        var localized = iD.ui.preset.localized(field, {});
        selection.call(localized);
        happen.click(selection.selectAll('.localized-add').node());
        expect(selection.selectAll('.localized-lang').size()).to.equal(1);
        expect(selection.selectAll('.localized-value').size()).to.equal(1);
    });

    it("doesn't create a tag when the value is empty", function() {
        var localized = iD.ui.preset.localized(field, {});
        selection.call(localized);
        happen.click(selection.selectAll('.localized-add').node());

        localized.on('change', function(tags) {
            expect(tags).to.eql({});
        });

        selection.selectAll('.localized-lang').value('Deutsch');
        happen.once(selection.selectAll('.localized-lang').node(), {type: 'change'});
        happen.once(selection.selectAll('.localized-lang').node(), {type: 'blur'});
    });

    it("doesn't create a tag when the name is empty", function() {
        var localized = iD.ui.preset.localized(field, {});
        selection.call(localized);
        happen.click(selection.selectAll('.localized-add').node());

        localized.on('change', function(tags) {
            expect(tags).to.eql({});
        });

        selection.selectAll('.localized-value').value('Value');
        happen.once(selection.selectAll('.localized-value').node(), {type: 'change'});
        happen.once(selection.selectAll('.localized-value').node(), {type: 'blur'});
    });

    it("creates a tag after setting language then value", function() {
        var localized = iD.ui.preset.localized(field, {});
        selection.call(localized);
        happen.click(selection.selectAll('.localized-add').node());

        selection.selectAll('.localized-lang').value('Deutsch');
        happen.once(selection.selectAll('.localized-lang').node(), {type: 'change'});

        localized.on('change', function(tags) {
            expect(tags).to.eql({'name:de': 'Value'});
        });

        selection.selectAll('.localized-value').value('Value');
        happen.once(selection.selectAll('.localized-value').node(), {type: 'change'});
    });

    it("creates a tag after setting value then language", function() {
        var localized = iD.ui.preset.localized(field, {});
        selection.call(localized);
        happen.click(selection.selectAll('.localized-add').node());

        selection.selectAll('.localized-value').value('Value');
        happen.once(selection.selectAll('.localized-value').node(), {type: 'change'});

        localized.on('change', function(tags) {
            expect(tags).to.eql({'name:de': 'Value'});
        });

        selection.selectAll('.localized-lang').value('Deutsch');
        happen.once(selection.selectAll('.localized-lang').node(), {type: 'change'});
    });

    it("changes an existing language", function() {
        var localized = iD.ui.preset.localized(field, {});
        selection.call(localized);
        localized.tags({'name:de': 'Value'});

        localized.on('change', function(tags) {
            expect(tags).to.eql({
                'name:de': undefined,
                'name:en': 'Value'});
        });

        selection.selectAll('.localized-lang').value('English');
        happen.once(selection.selectAll('.localized-lang').node(), {type: 'change'});
    });

    it("ignores similar keys like `old_name`", function() {
        var localized = iD.ui.preset.localized(field, {});
        selection.call(localized);
        localized.tags({'old_name:de': 'Value'});

        expect(selection.selectAll('.localized-lang').empty()).to.be.ok;
        expect(selection.selectAll('.localized-value').empty()).to.be.ok;
    });

    it("removes the tag when the language is emptied", function() {
        var localized = iD.ui.preset.localized(field, {});
        selection.call(localized);
        localized.tags({'name:de': 'Value'});

        localized.on('change', function(tags) {
            expect(tags).to.eql({'name:de': undefined});
        });

        selection.selectAll('.localized-lang').value('');
        happen.once(selection.selectAll('.localized-lang').node(), {type: 'change'});
    });

    it("removes the tag when the value is emptied", function() {
        var localized = iD.ui.preset.localized(field, {});
        selection.call(localized);
        localized.tags({'name:de': 'Value'});

        localized.on('change', function(tags) {
            expect(tags).to.eql({'name:de': undefined});
        });

        selection.selectAll('.localized-value').value('');
        happen.once(selection.selectAll('.localized-value').node(), {type: 'change'});
    });
});
