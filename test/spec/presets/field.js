describe('iD.presetField', function() {
    describe('#references', function() {
        it('references label and terms of another field', function() {
            var allFields = {};
            var other = iD.presetField('other', {}, allFields);
            var field = iD.presetField('test', {label: '{other}'}, allFields);
            allFields.other = other;
            allFields.preset = field;

            // mock localizer
            sinon.spy(other, 't');
            sinon.spy(field, 't');

            field.title();
            expect(other.t).to.have.been.calledOnce;
            expect(field.t).not.to.have.been.called;

            other.t.resetHistory();
            field.t.resetHistory();

            field.terms();
            expect(other.t).to.have.been.calledOnce;
            expect(field.t).not.to.have.been.called;
        });

        it('references placeholder of another field', function() {
            var allFields = {};
            var other = iD.presetField('other', {}, allFields);
            var field = iD.presetField('test', {placeholder: '{other}'}, allFields);
            allFields.other = other;
            allFields.preset = field;

            // mock localizer
            sinon.spy(other, 't');
            sinon.spy(field, 't');

            field.placeholder();
            expect(other.t).to.have.been.calledOnce;
            expect(field.t).not.to.have.been.called;
        });

        it('references string options of another field', function() {
            var allFields = {};
            var other = iD.presetField('other', {}, allFields);
            var field = iD.presetField('test', {stringsCrossReference: '{other}', options: ['v'], key: 'k'}, allFields);
            allFields.other = other;
            allFields.preset = field;

            // mock localizer
            sinon.spy(other.t, 'append');
            sinon.spy(field.t, 'append');
            sinon.stub(other, 'hasTextForStringId').returns(true);

            var context = iD.coreContext().assetPath('../dist/').init();
            var uiField = iD.uiFieldCombo(field, context);
            uiField.tags({k: 'v'});
            expect(field.t.append).not.to.have.been.called;
            expect(other.t.append).to.have.been.called;
        });
    });
});
