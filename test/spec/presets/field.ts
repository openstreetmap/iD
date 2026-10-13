import type { Field } from '@openstreetmap/id-tagging-schema';

const createField = (field: Partial<Field>) => iD.presetField('test', field as Field);

describe('iD.presetField', () => {
    describe('#evaluatePrerequisiteTags', () => {
        it('supports requires-key-any-value', () => {
            const field = createField({ prerequisiteTag: { key: 'a' } });
            expect(field.evaluatePrerequisiteTags({ a: '1' })).toBe(true);
            expect(field.evaluatePrerequisiteTags({ a: '2' })).toBe(true);
            expect(field.evaluatePrerequisiteTags({ a: '1;2' })).toBe(true);
            expect(field.evaluatePrerequisiteTags({})).toBe(false);
        });

        it('supports requires-key-equals-value', () => {
            const field = createField({ prerequisiteTag: { key: 'a', value: '1' } });
            expect(field.evaluatePrerequisiteTags({ a: '1' })).toBe(true);
            expect(field.evaluatePrerequisiteTags({ a: '2' })).toBe(false);
            expect(field.evaluatePrerequisiteTags({ a: '1;2' })).toBe(false);
            expect(field.evaluatePrerequisiteTags({})).toBe(false);
        });

        it('supports requires-key-equals-values', () => {
            const field = createField({ prerequisiteTag: { key: 'a', values: ['1', '2'] } });
            expect(field.evaluatePrerequisiteTags({ a: '1' })).toBe(true);
            expect(field.evaluatePrerequisiteTags({ a: '2' })).toBe(true);
            expect(field.evaluatePrerequisiteTags({ a: '1;2' })).toBe(false);
            expect(field.evaluatePrerequisiteTags({})).toBe(false);
        });

        it('supports requires-key-not-value', () => {
            const field = createField({ prerequisiteTag: { key: 'a', valueNot: '1' } });
            expect(field.evaluatePrerequisiteTags({ a: '1' })).toBe(false);
            expect(field.evaluatePrerequisiteTags({ a: '2' })).toBe(true);
            expect(field.evaluatePrerequisiteTags({ a: '1;2' })).toBe(true);
            expect(field.evaluatePrerequisiteTags({})).toBe(true);
        });

        it('supports requires-key-not-values', () => {
            const field = createField({ prerequisiteTag: { key: 'a', valuesNot: ['1', '2'] } });
            expect(field.evaluatePrerequisiteTags({ a: '1' })).toBe(false);
            expect(field.evaluatePrerequisiteTags({ a: '2' })).toBe(false);
            expect(field.evaluatePrerequisiteTags({ a: '1;2' })).toBe(true);
            expect(field.evaluatePrerequisiteTags({})).toBe(true);
        });
    });
});
