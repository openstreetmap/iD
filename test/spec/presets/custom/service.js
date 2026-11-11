import { loadCustomPresets } from './setup.js';
import { serviceGridEntries } from '../../../../data/custom-tagging/src/presets/highway/access_grid';

/** Driveway access categories as specified for the map colors: [preset id, category tags]. */
const DRIVEWAY_CASES = [
    ['highway/service/private_ownership_driveway', { ownership: 'private' }],
    ['highway/service/private_property_driveway', { access: 'destination', ownership: 'private' }],
    [
        'highway/service/business_driveway',
        { motor_vehicle: 'destination', ownership: 'private', 'operator:type': 'business' }
    ],
    ['highway/service/destination_driveway', { motor_vehicle: 'destination' }],
    ['highway/service/customers_driveway', { access: 'customers' }],
    ['highway/service/private_driveway', { access: 'private' }],
    ['highway/service/delivery_driveway', { access: 'delivery' }],
    ['highway/service/permissive_driveway', { access: 'permissive' }]
];

describe('custom presets — service roads', function() {
    loadCustomPresets();

    DRIVEWAY_CASES.forEach(function([id, categoryTags]) {
        const tags = { highway: 'service', service: 'driveway', ...categoryTags };

        it(`defines ${id} with an asphalt default`, function() {
            const preset = iD.presetManager.item(id);
            expect(preset?.tags, id).to.eql(tags);
            expect(preset.addTags.surface).to.equal('asphalt');
        });

        it(`matches ${id} after a surface change`, function() {
            const matched = iD.presetManager.matchTags({ ...tags, surface: 'paving_stones' }, 'line');
            expect(matched.id).to.equal(id);
        });
    });

    serviceGridEntries().forEach(function({ id, tags, addTags }) {
        it(`defines grid preset ${id}`, function() {
            const preset = iD.presetManager.item(id);
            expect(preset?.tags, id).to.eql(tags);
            expect(preset.addTags).to.eql(addTags);
        });
    });

    it('tags drive-through presets with service=drive-through', function() {
        expect(iD.presetManager.item('highway/service/customers_drive_through').tags.service).to.equal('drive-through');
    });

    it('only force-removes foot=use_sidepath on sidewalk variants', function() {
        const raw = iD.fileFetcher.cache().preset_custom_presets;
        expect(raw['highway/service/private_sidewalk_both'].removeTags).to.eql({ foot: 'use_sidepath' });
        expect(raw['highway/service/destination_opposite_use_sidepath'].removeTags).to.eql({ foot: 'use_sidepath' });
        // base / unpaved / subtype presets carry no removeTags
        expect(raw['highway/service/private'].removeTags).to.be.undefined;
        expect(raw['highway/service/private_driveway'].removeTags).to.be.undefined;
    });

    it('omits matchScore so plain service roads are not captured', function() {
        const raw = iD.fileFetcher.cache().preset_custom_presets;
        expect(raw['highway/service/private'].matchScore).to.be.undefined;
        expect(raw['highway/service/destination_sidewalk_left'].matchScore).to.be.undefined;
    });

    it('finds service presets by alias search', function() {
        const pool = iD.presetManager.matchAllGeometry(['line']);
        const by5du = pool.search('5du', 'line').collection.map((p) => p.id);
        expect(by5du).to.include('highway/service/private_unpaved_driveway');
        const by6d = pool.search('6d', 'line').collection.map((p) => p.id);
        expect(by6d).to.include('highway/service/destination_driveway');
        const by6pu = pool.search('6pu', 'line').collection.map((p) => p.id);
        expect(by6pu).to.include('highway/service/destination_unpaved_parking_aisle');
    });

    it('defines the private unmaintained track preset', function() {
        const preset = iD.presetManager.item('highway/track_private');
        expect(preset).to.exist;
        expect(preset.tags).to.eql({ highway: 'track', access: 'private' });
        expect(preset.addTags.surface).to.equal('unpaved');
    });

    it('defines the disused service road preset', function() {
        const preset = iD.presetManager.item('highway/service/disused');
        expect(preset).to.exist;
        expect(preset.name()).to.equal('Disused service road');
        expect(preset.tags).to.eql({ 'disused:highway': 'service' });
        expect(preset.geometry).to.eql(['line']);
    });
});
