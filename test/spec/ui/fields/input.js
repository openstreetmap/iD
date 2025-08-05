describe('iD.uiFieldText', function () {
    var context, field, container;

    beforeEach(function () {
        context = iD.coreContext().assetPath('../dist/').init();
        container = d3.select(document.createElement('div'));
    });

    describe('text field with spaces', function () {
        it('preserves spaces in text fields', function () {
            field = {
                key: 'note',
                type: 'text',
                title: function() { return 'Note'; },
                locked: function() { return false; },
                placeholder: function() { return 'Enter note'; }
            };

            var textField = iD.uiFieldText(field, context);
            container.call(textField);

            var input = container.select('input');
            input.property('value', '  This is a note with spaces  ');

            input.on('change')();

            var currentTags = {};
            textField.on('change', function(tags) {
                Object.assign(currentTags, tags);
            });

            input.on('change')();

            expect(currentTags.note).to.equal('  This is a note with spaces  ');
        });

        it('cleans values for comma-separated fields', function () {
            field = {
                key: 'cuisine',
                type: 'combo',
                title: function() { return 'Cuisine'; },
                locked: function() { return false; },
                placeholder: function() { return 'Enter cuisine'; }
            };

            var comboField = iD.uiFieldText(field, context);
            container.call(comboField);

            var input = container.select('input');
            input.property('value', '  italian, pizza  ');

            input.on('change')();

            var currentTags = {};
            comboField.on('change', function(tags) {
                Object.assign(currentTags, tags);
            });

            input.on('change')();

            expect(currentTags.cuisine).to.equal('italian, pizza');
        });
    });
});