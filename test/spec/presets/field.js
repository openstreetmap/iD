import { select as d3_select } from 'd3-selection';
import { spyOn } from '@vitest/spy';

describe('iD.presetField', function() {
    describe('#references', function() {
        it('references label and terms of another field', function() {
            var allFields = {};
            var other = iD.presetField('other', {}, allFields);
            var field = iD.presetField('test', {label: '{other}'}, allFields);
            allFields.other = other;
            allFields.preset = field;

            // mock localizer
            spyOn(other, 't');
            spyOn(field, 't');

            field.title();
            expect(other.t).toHaveBeenCalledOnce();
            expect(field.t).not.toHaveBeenCalled();

            other.t.mockClear();
            field.t.mockClear();

            field.terms();
            expect(other.t).toHaveBeenCalledOnce();
            expect(field.t).not.toHaveBeenCalled();
        });

        it('references placeholder of another field', function() {
            var allFields = {};
            var other = iD.presetField('other', {}, allFields);
            var field = iD.presetField('test', {placeholder: '{other}'}, allFields);
            allFields.other = other;
            allFields.preset = field;

            // mock localizer
            spyOn(other, 't');
            spyOn(field, 't');

            field.placeholder();
            expect(other.t).toHaveBeenCalledOnce();
            expect(field.t).not.toHaveBeenCalled();
        });

        it('references string options of another field', function() {
            var allFields = {};
            var other = iD.presetField('other', {}, allFields);
            var field = iD.presetField('test', {stringsCrossReference: '{other}', options: ['v'], key: 'k'}, allFields);
            allFields.other = other;
            allFields.preset = field;

            // mock localizer
            spyOn(other.t, 'append');
            spyOn(field.t, 'append');
            spyOn(other, 'hasTextForStringId').mockReturnValue(true);

            var context = iD.coreContext().assetPath('../dist/').init();
            var uiField = iD.uiFieldCombo(field, context);
            uiField(d3_select(document.createElement('div')).classed('form-field-input-wrap', true));
            uiField.tags({k: 'v'});
            expect(field.t.append).not.toHaveBeenCalled();
            expect(other.t.append).toHaveBeenCalled();
        });
    });
});
