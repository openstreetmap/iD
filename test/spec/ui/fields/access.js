describe('iD.uiFieldAccess', function() {
    var context, selection, field;

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
        selection = d3.select(document.createElement('div'));
        field = iD.presetField('access', {
            keys: ['access', 'foot', 'motor_vehicle', 'bicycle', 'horse'],
            type: 'access'
        });
    });

    it('creates inputs for a variety of modes of access', function() {
        var access = iD.uiFieldAccess(field, context);
        selection.call(access);
        expect(selection.selectAll('.preset-access-access').size()).to.equal(1);
        expect(selection.selectAll('.preset-access-foot').size()).to.equal(1);
        expect(selection.selectAll('.preset-access-motor_vehicle').size()).to.equal(1);
        expect(selection.selectAll('.preset-access-bicycle').size()).to.equal(1);
        expect(selection.selectAll('.preset-access-horse').size()).to.equal(1);
    });

    it('does not include "yes", "designated", "dismount" options for general access (#934), (#2213)', function() {
        var access = iD.uiFieldAccess(field, context);
        var options = access.options('access').map(function(v) { return v.value; });
        expect(options).not.to.include('yes');
        expect(options).not.to.include('designated');
        expect(options).not.to.include('dismount');
    });

    it('does include a "dismount" option for bicycles (#2726)', function() {
        var access = iD.uiFieldAccess(field, context);
        var options;

        options = access.options('bicycle').map(function(v) { return v.value; });
        expect(options).to.include('dismount');

        options = access.options('foot').map(function(v) { return v.value; });
        expect(options).not.to.include('dismount');
    });

    it('sets foot placeholder to "yes" for steps and pedestrian', function() {
        var access = iD.uiFieldAccess(field, context);
        selection.call(access);

        access.tags({highway: 'steps'});
        expect(selection.selectAll('.preset-input-access-foot').attr('placeholder')).to.equal('yes');

        access.tags({highway: 'pedestrian'});
        expect(selection.selectAll('.preset-input-access-foot').attr('placeholder')).to.equal('yes');
    });

    it('sets foot placeholder to "designated" for footways', function() {
        var access = iD.uiFieldAccess(field, context);
        selection.call(access);

        access.tags({highway: 'footway'});
        expect(selection.selectAll('.preset-input-access-foot').attr('placeholder')).to.equal('designated');
    });

    it('sets bicycle placeholder to "designated" for cycleways', function() {
        var access = iD.uiFieldAccess(field, context);
        selection.call(access);

        access.tags({highway: 'cycleway'});
        expect(selection.selectAll('.preset-input-access-bicycle').attr('placeholder')).to.equal('designated');
    });

    it('sets horse placeholder to "designated" for bridleways', function() {
        var access = iD.uiFieldAccess(field, context);
        selection.call(access);

        access.tags({highway: 'bridleway'});
        expect(selection.selectAll('.preset-input-access-horse').attr('placeholder')).to.equal('designated');
    });

    it('sets motor_vehicle placeholder to "no" for footways, steps, pedestrian, cycleway, bridleway, and path', function() {
        var access = iD.uiFieldAccess(field, context);
        selection.call(access);
        ['footway', 'steps', 'pedestrian', 'cycleway', 'bridleway', 'path'].forEach(function(value) {
            access.tags({highway: value});
            expect(selection.selectAll('.preset-input-access-motor_vehicle').attr('placeholder')).to.equal('no');
        });
    });

    it('sets motor_vehicle placeholder to "yes" for various other highway tags', function() {
        var access = iD.uiFieldAccess(field, context);
        selection.call(access);
        ['residential', 'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'service',
         'unclassified', 'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link'].forEach(function(value) {
            access.tags({highway: value});
            expect(selection.selectAll('.preset-input-access-motor_vehicle').attr('placeholder')).to.equal('yes');
        });
    });

    it('overrides a "yes" or "designated" placeholder with more specific access tag (#2213)', function() {
        var access = iD.uiFieldAccess(field, context);
        selection.call(access);

        access.tags({highway: 'service', access: 'emergency'});
        expect(selection.selectAll('.preset-input-access-motor_vehicle').attr('placeholder')).to.equal('emergency');

        access.tags({highway: 'cycleway', access: 'permissive'});
        expect(selection.selectAll('.preset-input-access-bicycle').attr('placeholder')).to.equal('permissive');
    });

    it('overrides a "no" placeholder with more specific access tag (#2763)', function() {
        var access = iD.uiFieldAccess(field, context);
        selection.call(access);

        access.tags({highway: 'cycleway', access: 'destination'});
        expect(selection.selectAll('.preset-input-access-motor_vehicle').attr('placeholder')).to.equal('destination');
    });

    it('sets bicycle and motor_vehicle placeholder to the value of the "vehicle" tag (id-tagging-schema#378)', function() {
        var access = iD.uiFieldAccess(field, context);
        selection.call(access);

        access.tags({highway: 'residential', vehicle: 'destination'});
        expect(selection.selectAll('.preset-input-access-motor_vehicle').attr('placeholder')).to.equal('destination');
        expect(selection.selectAll('.preset-input-access-bicycle').attr('placeholder')).to.equal('destination');
    });

    it('sets foot, bicycle and horse placeholder to "no" when there a "motorroad=yes" tag (#9333)', function() {
        var access = iD.uiFieldAccess(field, context);
        selection.call(access);

        access.tags({highway: 'primary', motorroad: 'yes'});
        expect(selection.selectAll('.preset-input-access-foot').attr('placeholder')).to.equal('no');
        expect(selection.selectAll('.preset-input-access-bicycle').attr('placeholder')).to.equal('no');
        expect(selection.selectAll('.preset-input-access-horse').attr('placeholder')).to.equal('no');
    });

    it('sets correct placeholder on a multi selection', function() {
        var access = iD.uiFieldAccess(field, context);
        selection.call(access);

        var tags = {highway: 'primary', foot: ['yes', 'no'], bicycle: ['no', undefined], vehicle: ['no', undefined]};
        tags[Symbol.for('allTags')] = [
            {highway: 'primary', foot: 'yes', bicycle: 'no'},
            {highway: 'primary', foot: 'no', vehicle: 'no'}
        ];
        access.tags(tags);
        expect(selection.selectAll('.preset-input-access-foot').attr('placeholder')).to.equal(iD.localizer.t('inspector.multiple_values'));
        expect(selection.selectAll('.preset-input-access-bicycle').attr('placeholder')).to.equal('no');
        expect(selection.selectAll('.preset-input-access-motor_vehicle').attr('placeholder')).to.equal(iD.localizer.t('inspector.multiple_values'));
    });

    it('shows access key when present in tags but not in default list (e.g. motorcar)', function() {
        var access = iD.uiFieldAccess(field, context);
        selection.call(access);
        expect(selection.selectAll('.preset-access-motorcar').size()).to.equal(0);

        access.tags({ highway: 'residential', motorcar: 'no' });
        expect(selection.selectAll('.preset-access-motorcar').size()).to.equal(1);
        expect(selection.selectAll('.preset-input-access-motorcar').size()).to.equal(1);
    });

    it('orders effective keys by canonical order (motorcar after motor_vehicle)', function() {
        var access = iD.uiFieldAccess(field, context);
        selection.call(access);
        access.tags({ highway: 'residential', motorcar: 'destination', vehicle: 'yes' });

        var keys = field.effectiveKeys;
        var motorVehicleIdx = keys.indexOf('motor_vehicle');
        var motorcarIdx = keys.indexOf('motorcar');
        expect(motorVehicleIdx).to.be.at.least(0);
        expect(motorcarIdx).to.be.at.least(0);
        expect(motorcarIdx).to.be.above(motorVehicleIdx);
    });

    it('effectiveKeys contains default keys and keys present in tags', function() {
        var access = iD.uiFieldAccess(field, context);
        selection.call(access);
        var keysWithoutTags = field.effectiveKeys;
        expect(keysWithoutTags).to.include('access');
        expect(keysWithoutTags).to.include('foot');
        expect(keysWithoutTags).to.include('motor_vehicle');
        expect(keysWithoutTags).to.include('bicycle');
        expect(keysWithoutTags).to.include('horse');
        expect(keysWithoutTags).not.to.include('motorcar');

        access.tags({ highway: 'residential', motorcar: 'no' });
        var keysWithMotorcar = field.effectiveKeys;
        expect(keysWithMotorcar).to.include('motorcar');
    });

    it('shows an add row for additional access keys after clicking the add button', function() {
        var container = d3.select('body').append('div').attr('class', 'ideditor');
        context.container(container);

        var formField = selection.append('div').attr('class', 'form-field form-field-access');
        var label = formField.append('label').attr('class', 'field-label');
        label.append('span').attr('class', 'label-text');
        label.append('button').attr('class', 'remove-icon');

        var access = iD.uiFieldAccess(field, context);
        container.append(function() { return formField.node(); });
        formField.call(access);

        expect(formField.selectAll('.access-add').size()).to.equal(1);
        expect(formField.select('.access-add').attr('aria-label')).to.equal('Add a new mode of transport');
        expect(formField.select('.preset-access-add').style('display')).to.equal('none');
        expect(formField.select('ul.rows li:first-child').classed('preset-access-add')).not.to.be.ok;
        expect(formField.selectAll('.preset-access-add .preset-input-access-wrap').size()).to.equal(0);
        expect(formField.selectAll('.preset-access-motorcar').size()).to.equal(0);

        formField.select('.access-add').node().click();

        expect(formField.select('.preset-access-add').style('display')).not.to.equal('none');
        expect(formField.select('.preset-access-add input.preset-input-access-add-key').attr('placeholder')).to.equal('Add a new mode of transport');
        expect(formField.select('ul.rows li:first-child').classed('preset-access-add')).to.be.ok;
        expect(container.selectAll('.combobox-access-add-key').size()).to.equal(1);

        container.remove();
    });

    it('opens the value combobox after selecting a new access key', async function() {
        var container = d3.select('body').append('div').attr('class', 'ideditor');
        context.container(container);

        var formField = selection.append('div').attr('class', 'form-field form-field-access');
        var label = formField.append('label').attr('class', 'field-label');
        label.append('span').attr('class', 'label-text');
        label.append('button').attr('class', 'remove-icon');
        container.append(function() { return formField.node(); });

        var access = iD.uiFieldAccess(field, context);
        formField.call(access);
        access.tags({ highway: 'residential' });

        formField.select('.access-add').node().click();
        var addInput = formField.select('.preset-access-add input');
        addInput.node().value = 'motorcar';
        addInput.node().focus();
        iD.uiCombobox.open(addInput);
        container.selectAll('.combobox-access-add-key .combobox-option')
            .filter(function() { return d3.select(this).attr('title') === 'motorcar'; })
            .node()
            .click();

        await new Promise(function(resolve) { window.setTimeout(resolve, 0); });

        expect(formField.select('.preset-access-motorcar .preset-input-access').size()).to.equal(1);
        expect(container.selectAll('.combobox-access-motorcar').size()).to.equal(1);

        container.remove();
    });

    it('sets tags with the selected access key, not a numeric index', async function() {
        var access = iD.uiFieldAccess(field, context);
        var tagsChanged;
        access.on('change', function(t) { tagsChanged = t; });
        selection.call(access);
        access.tags({ highway: 'residential', dog: 'no', ski: 'designated' });

        var dogInput = selection.select('.preset-access-dog .preset-input-access');
        expect(dogInput.size()).to.equal(1);

        tagsChanged = undefined;
        dogInput.node().value = 'yes';
        dogInput.node().dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(function(resolve) { window.setTimeout(resolve, 0); });
        expect(tagsChanged).to.deep.equal({ dog: 'yes' });
        expect(tagsChanged).to.not.have.property('0');

        tagsChanged = undefined;
        var skiInput = selection.select('.preset-access-ski .preset-input-access');
        skiInput.node().value = 'permissive';
        skiInput.node().dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(function(resolve) { window.setTimeout(resolve, 0); });
        expect(tagsChanged).to.deep.equal({ ski: 'permissive' });
        expect(tagsChanged).to.not.have.property('0');
    });

});
