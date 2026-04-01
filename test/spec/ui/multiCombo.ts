import type { EntityId } from '../../../modules';

describe('iD.uiField as multiCombo', () => {
    let context: iD.Context;
    let selection: d3.Selection;
    let presetField: any; // not TS yet

    beforeEach(() => {
        context = iD.coreContext().assetPath('../dist/').init();
        selection = d3.select(document.createElement('div'));

        presetField = iD.presetField('fuel', { key: 'fuel:', type: 'multiCombo' });
    });

    describe('modified', () => {
        // Checks that various ways to modify the tags/values results in the correct detection of modified state

        it('field is not marked modified when tags are original', () => {
            const entity = new iD.osmNode({ id: 'n1', tags: { 'fuel:diesel': 'yes', 'fuel:petrol': 'no' } });
            context.history().merge([entity]);

            // no action performed on the entity, so tags are still original

            const field = iD.uiField(context, presetField, ['n1'], { show: true });
            field.tags({ 'fuel:diesel': 'yes', 'fuel:petrol': 'no' });
            field.render(selection);

            expect(selection.select('.form-field').classed('modified')).toBe(false);
        });

        it('marks field as modified when value is changed', () => {
            const entity = new iD.osmNode({ id: 'n1', tags: { 'fuel:diesel': 'yes', 'fuel:petrol': 'no' } });
            context.history().merge([entity]);

            // Change `fuel:petrol=no' to `fuel:petrol=yes'
            const newTags = { 'fuel:diesel': 'yes', 'fuel:petrol': 'yes' };
            context.perform(iD.actionChangeTags('n1', newTags));

            const field = iD.uiField(context, presetField, ['n1'], { show: true });
            field.tags(newTags);
            field.render(selection);

            expect(selection.select('.form-field').classed('modified')).toBe(true);
        });

        it('marks field as modified when tag is changed', () => {
            const entity = new iD.osmNode({ id: 'n1', tags: { 'fuel:diesel': 'yes', 'fuel:petrol': 'no' } });
            context.history().merge([entity]);

            // Change `fuel:diesel=yes' to `fuel:HGV_diesel=yes'
            const newTags = { 'fuel:HGV_diesel': 'yes', 'fuel:petrol': 'no' };
            context.perform(iD.actionChangeTags('n1', newTags));

            const field = iD.uiField(context, presetField, ['n1'], { show: true });
            field.tags(newTags);
            field.render(selection);

            expect(selection.select('.form-field').classed('modified')).toBe(true);
        });

        it('marks field as modified when existing tag is removed', () => {
            const entity = new iD.osmNode({ id: 'n1', tags: { 'fuel:diesel': 'yes', 'fuel:petrol': 'no' } });
            context.history().merge([entity]);

            // Remove `fuel:petrol=no'
            const newTags = { 'fuel:diesel': 'yes' };
            context.perform(iD.actionChangeTags('n1', newTags));

            const field = iD.uiField(context, presetField, ['n1'], { show: true });
            field.tags(newTags);
            field.render(selection);

            expect(selection.select('.form-field').classed('modified')).toBe(true);
        });

        it('marks field as modified when a new tag is added', () => {
            const entity = new iD.osmNode({ id: 'n1', tags: { 'fuel:diesel': 'yes', 'fuel:petrol': 'no' } });
            context.history().merge([entity]);

            // Add `fuel:propane=yes'
            const newTags = { 'fuel:diesel': 'yes', 'fuel:petrol': 'no', 'fuel:propane': 'yes' };
            context.perform(iD.actionChangeTags('n1', newTags));

            const field = iD.uiField(context, presetField, ['n1'], { show: true });
            field.tags(newTags);
            field.render(selection);

            expect(selection.select('.form-field').classed('modified')).toBe(true);
        });
    });

    describe('undo', () => {
        function wireRevert(field: any, entityID: EntityId) {
            // Simulate entity_editor.revertTags()
            field.on('revert', (keys: string[]) => {
                const original = context.graph().base().entities[entityID]!;
                const tags = { ...context.entity(entityID).tags };
                keys.forEach((key: string) => { tags[key] = original.tags[key]; });
                context.perform(iD.actionChangeTags(entityID, tags));
            });
        }

        describe('relevant tags', () => {
            it('undo reverts changed value', () => {
                const entity = new iD.osmNode({ id: 'n1', tags: { 'fuel:diesel': 'yes', 'fuel:petrol': 'no' } });
                context.history().merge([entity]);

                // Change `fuel:petrol=no' to `fuel:petrol=yes'
                const newTags = {'fuel:diesel': 'yes', 'fuel:petrol': 'yes'};
                context.perform(iD.actionChangeTags('n1', newTags));

                const field = iD.uiField(context, presetField, ['n1'], { show: true });
                field.tags(newTags);
                field.render(selection);

                wireRevert(field, 'n1');
                selection.select('.field-label > .modified-icon').dispatch('click');

                expect(context.entity('n1').tags).toEqual({ 'fuel:diesel': 'yes', 'fuel:petrol': 'no' });
            });

            it('undo reverts changed tag', () => {
                const entity = new iD.osmNode({ id: 'n1', tags: { 'fuel:diesel': 'yes', 'fuel:petrol': 'no' } });
                context.history().merge([entity]);

                // Change `fuel:diesel=yes' to `fuel:HGV_diesel=yes'
                const newTags = { 'fuel:HGV_diesel': 'yes', 'fuel:petrol': 'no' };
                context.perform(iD.actionChangeTags('n1', newTags));

                const field = iD.uiField(context, presetField, ['n1'], { show: true });
                field.tags(newTags);
                field.render(selection);

                wireRevert(field, 'n1');
                selection.select('.field-label > .modified-icon').dispatch('click');

                expect(context.entity('n1').tags).toEqual({ 'fuel:diesel': 'yes', 'fuel:petrol': 'no' });
            });

            it('undo reverts added tag', () => {
                const entity = new iD.osmNode({ id: 'n1', tags: { 'fuel:diesel': 'yes', 'fuel:petrol': 'no' } });
                context.history().merge([entity]);

                // Add `fuel:propane=yes'
                const newTags = { 'fuel:diesel': 'yes', 'fuel:petrol': 'no', 'fuel:propane': 'yes' };
                context.perform(iD.actionChangeTags('n1', newTags));

                const field = iD.uiField(context, presetField, ['n1'], { show: true });
                field.tags(newTags);
                field.render(selection);

                wireRevert(field, 'n1');
                selection.select('.field-label > .modified-icon').dispatch('click');

                expect(context.entity('n1').tags).toEqual({ 'fuel:diesel': 'yes', 'fuel:petrol': 'no' });
            });

            it('undo reverts removed tag', () => {
                const entity = new iD.osmNode({ id: 'n1', tags: { 'fuel:diesel': 'yes', 'fuel:petrol': 'no' } });
                context.history().merge([entity]);

                // Remove `fuel:petrol=no'
                const newTags = { 'fuel:diesel': 'yes' };
                context.perform(iD.actionChangeTags('n1', newTags));

                const field = iD.uiField(context, presetField, ['n1'], { show: true });
                field.tags(newTags);
                field.render(selection);

                wireRevert(field, 'n1');
                selection.select('.field-label > .modified-icon').dispatch('click');

                expect(context.entity('n1').tags).toEqual({ 'fuel:diesel': 'yes', 'fuel:petrol': 'no' });
            });
        });

        describe('unrelated tags', () => {
            it('undo doesn\'t affect unrelated value change', () => {
                const entity = new iD.osmNode({ id: 'n1', tags: { 'fuel:diesel': 'yes', 'fuel:petrol': 'no', 'existing': 'yes' } });
                context.history().merge([entity]);

                // For us, just change `fuel:petrol=no' to `fuel:petrol=yes',
                // But also do a value change that is unrelated to the field
                const newTags = { 'fuel:diesel': 'yes', 'fuel:petrol': 'yes', 'existing': 'no' };
                context.perform(iD.actionChangeTags('n1', newTags));

                const field = iD.uiField(context, presetField, ['n1'], { show: true });
                field.tags(newTags);
                field.render(selection);

                wireRevert(field, 'n1');
                selection.select('.field-label > .modified-icon').dispatch('click');
                expect(context.entity('n1').tags).toEqual({ 'fuel:diesel': 'yes', 'fuel:petrol': 'no', 'existing': 'no' });
            });

            it('undo doesn\'t affect unrelated tag addition', () => {
                const entity = new iD.osmNode({ id: 'n1', tags: { 'fuel:diesel': 'yes', 'fuel:petrol': 'no' } });
                context.history().merge([entity]);

                // For us, just change `fuel:petrol=no' to `fuel:petrol=yes',
                // But also do a tag addition that is unrelated to the field
                const newTags = { 'fuel:diesel': 'yes', 'fuel:petrol': 'yes', 'additional': 'yes' };
                context.perform(iD.actionChangeTags('n1', newTags));

                const field = iD.uiField(context, presetField, ['n1'], { show: true });
                field.tags(newTags);
                field.render(selection);

                wireRevert(field, 'n1');
                selection.select('.field-label > .modified-icon').dispatch('click');
                expect(context.entity('n1').tags).toEqual({ 'fuel:diesel': 'yes', 'fuel:petrol': 'no', 'additional': 'yes' });
            });

            it('undo doesn\'t affect unrelated tag removal', () => {
                const entity = new iD.osmNode({ id: 'n1', tags: { 'fuel:diesel': 'yes', 'fuel:petrol': 'no', 'temporary': 'yes' } });
                context.history().merge([entity]);

                // For us, just change `fuel:petrol=no' to `fuel:petrol=yes',
                // But also do a tag removal that is unrelated to the field
                const newTags = { 'fuel:diesel': 'yes', 'fuel:petrol': 'yes' }; // `temporary` is removed
                context.perform(iD.actionChangeTags('n1', newTags));

                const field = iD.uiField(context, presetField, ['n1'], { show: true });
                field.tags(newTags);
                field.render(selection);

                wireRevert(field, 'n1');
                selection.select('.field-label > .modified-icon').dispatch('click');
                expect(context.entity('n1').tags).toEqual({ 'fuel:diesel': 'yes', 'fuel:petrol': 'no' });
            });
        });
    });

    describe('remove', () => {
        function wireChange(field: any, entityID: EntityId) {
            // Simulates entity_editor.changeTags()
            field.on('change', (changed: Record<string, string | undefined>) => {
                const tags = { ...context.entity(entityID).tags };
                Object.keys(changed).forEach((key) => {
                    if (changed[key] === undefined) {
                        delete tags[key];
                    } else {
                        tags[key] = changed[key]!;
                    }
                });
                context.perform(iD.actionChangeTags(entityID, tags));
            });
        }

        describe('relevant tags', () => {
            it('removes all field tags', () => {
                const entity = new iD.osmNode({ id: 'n1', tags: { 'fuel:diesel': 'yes', 'fuel:petrol': 'no' } });
                context.history().merge([entity]);

                const field = iD.uiField(context, presetField, ['n1'], { show: true });
                field.tags(entity.tags);
                field.render(selection);

                wireChange(field, 'n1');
                selection.select('.field-label > .remove-icon').dispatch('click');

                expect(context.entity('n1').tags).toEqual({});
            });

            it('removes newly-added tags', () => {
                const entity = new iD.osmNode({ id: 'n1', tags: { 'fuel:diesel': 'yes', 'fuel:petrol': 'no' } });
                context.history().merge([entity]);

                const newTags = { 'fuel:diesel': 'yes', 'fuel:petrol': 'no', 'fuel:propane': 'yes' };
                context.perform(iD.actionChangeTags('n1', newTags));

                const field = iD.uiField(context, presetField, ['n1'], { show: true });
                field.tags(newTags);
                field.render(selection);

                wireChange(field, 'n1');
                selection.select('.field-label > .remove-icon').dispatch('click');

                expect(context.entity('n1').tags).toEqual({});
            });

            it('removes remaining tags when one was already removed', () => {
                const entity = new iD.osmNode({ id: 'n1', tags: { 'fuel:diesel': 'yes', 'fuel:petrol': 'no' } });
                context.history().merge([entity]);

                const newTags = { 'fuel:diesel': 'yes' };
                context.perform(iD.actionChangeTags('n1', newTags));

                const field = iD.uiField(context, presetField, ['n1'], { show: true });
                field.tags(newTags);
                field.render(selection);

                wireChange(field, 'n1');
                selection.select('.field-label > .remove-icon').dispatch('click');

                expect(context.entity('n1').tags).toEqual({});
            });
        });

        describe('unrelated tags', () => {
            it('remove doesn\'t affect unrelated existing tag', () => {
                const entity = new iD.osmNode({ id: 'n1', tags: { 'fuel:diesel': 'yes', 'fuel:petrol': 'no', 'existing': 'yes' } });
                context.history().merge([entity]);

                const field = iD.uiField(context, presetField, ['n1'], { show: true });
                field.tags(entity.tags);
                field.render(selection);

                wireChange(field, 'n1');
                selection.select('.field-label > .remove-icon').dispatch('click');

                expect(context.entity('n1').tags).toEqual({ 'existing': 'yes' });
            });

            it('remove doesn\'t affect unrelated added tag', () => {
                const entity = new iD.osmNode({ id: 'n1', tags: { 'fuel:diesel': 'yes', 'fuel:petrol': 'no' } });
                context.history().merge([entity]);

                const newTags = { 'fuel:diesel': 'yes', 'fuel:petrol': 'no', 'additional': 'yes' };
                context.perform(iD.actionChangeTags('n1', newTags));

                const field = iD.uiField(context, presetField, ['n1'], { show: true });
                field.tags(newTags);
                field.render(selection);

                wireChange(field, 'n1');
                selection.select('.field-label > .remove-icon').dispatch('click');

                expect(context.entity('n1').tags).toEqual({ 'additional': 'yes' });
            });

            it('remove doesn\'t restore a previously removed unrelated tag', () => {
                const entity = new iD.osmNode({ id: 'n1', tags: { 'fuel:diesel': 'yes', 'fuel:petrol': 'no', 'temporary': 'yes' } });
                context.history().merge([entity]);

                const newTags = { 'fuel:diesel': 'yes', 'fuel:petrol': 'no' };
                context.perform(iD.actionChangeTags('n1', newTags));

                const field = iD.uiField(context, presetField, ['n1'], { show: true });
                field.tags(newTags);
                field.render(selection);

                wireChange(field, 'n1');
                selection.select('.field-label > .remove-icon').dispatch('click');

                expect(context.entity('n1').tags).toEqual({});
            });
        });
    });
});

