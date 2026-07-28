import { select as d3_select } from 'd3-selection';

describe('iD.uiField', function() {
    var context, selection;

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
        selection = d3_select(document.createElement('div'));
    });

    // Builds a `name` field (type `localized`) that gets locked because the
    // entity carries a `wikidata` tag - see modules/ui/fields/localized.js
    // `calcLocked` and https://github.com/openstreetmap/iD/issues/12330.
    function createNameField(tags) {
        var entity = new iD.osmNode({ id: 'n1', tags: tags });
        context.history().merge([entity]);
        var presetField = iD.presetField('name', { key: 'name', type: 'localized' });
        var field = iD.uiField(context, presetField, [entity.id]);
        field.tags(entity.tags);
        return { field: field, entity: entity };
    }

    function clickLockIcon() {
        selection.selectAll('.lock-icon').node()
            .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }

    it('locks the name field and shows a lock icon when the entity has a wikidata tag', function() {
        var field = createNameField({ name: 'Foo', wikidata: 'Q1' }).field;
        selection.call(field.render);

        expect(field.locked()).toBeTruthy();
        expect(selection.selectAll('.form-field').classed('locked')).toBeTruthy();
        expect(selection.selectAll('.field-label .lock-icon').size()).toEqual(1);
        expect(selection.selectAll('.localized-main').attr('readonly')).toEqual('true');
    });

    it('does not lock or show a lock icon when there is no wikidata tag', function() {
        var field = createNameField({ name: 'Foo' }).field;
        selection.call(field.render);

        expect(field.locked()).toBeFalsy();
        expect(selection.selectAll('.form-field').classed('locked')).toBeFalsy();
        expect(selection.selectAll('.field-label .lock-icon').size()).toEqual(0);
        expect(selection.selectAll('.localized-main').attr('readonly')).toBeNull();
    });

    it('renders the lock icon as a real button so it is keyboard-actionable, matching remove/revert icons', function() {
        var field = createNameField({ name: 'Foo', wikidata: 'Q1' }).field;
        selection.call(field.render);

        expect(selection.select('.field-label .lock-icon').node().tagName).toEqual('BUTTON');
    });

    it('unlocks the field for editing when the lock icon is clicked', function() {
        var field = createNameField({ name: 'Foo', wikidata: 'Q1' }).field;
        selection.call(field.render);

        clickLockIcon();

        expect(field.locked()).toBeFalsy();
        expect(selection.selectAll('.form-field').classed('locked')).toBeFalsy();
        expect(selection.selectAll('.field-label .lock-icon').size()).toEqual(0);
        expect(selection.selectAll('.localized-main').attr('readonly')).toBeNull();
    });

    it('stays unlocked across later re-renders of the same field in this session', function() {
        var setup = createNameField({ name: 'Foo', wikidata: 'Q1' });
        var field = setup.field;
        selection.call(field.render);

        clickLockIcon();
        expect(field.locked()).toBeFalsy();

        // a later tag edit re-renders the field (as happens on every keystroke) -
        // the wikidata tag is still present, but the field must not re-lock
        field.tags(setup.entity.tags);
        selection.call(field.render);

        expect(field.locked()).toBeFalsy();
        expect(selection.selectAll('.field-label .lock-icon').size()).toEqual(0);
    });
});
