import { loadCustomPresets } from './setup.js';
import { footwayGridEntries } from '../../../../data/custom-tagging/src/presets/highway/access_grid';

describe('custom presets — footway', function() {
    loadCustomPresets();

    it('loads footway link bicycle dismount preset with expected name', function() {
        const footway = iD.presetManager.item('highway/footway/footway_link_bicycle_dismount');
        expect(footway, 'footway link bicycle dismount preset').to.exist;
        expect(footway.name()).to.equal('Footway link bicycle dismount');
        expect(footway.addable()).to.be.true;
    });

    it('finds footway link preset via line geometry search', function() {
        const pool = iD.presetManager.matchAllGeometry(['line']);
        const byLink = pool.search('link', 'line').collection.map((p) => p.id);
        expect(byLink).to.include('highway/footway/footway_link_bicycle_dismount');

        const byName = pool.search('Footway link', 'line').collection.map((p) => p.id);
        expect(byName).to.include('highway/footway/footway_link_bicycle_dismount');
    });

    it('finds restricted footway presets by alias search terms', function() {
        const pool = iD.presetManager.matchAllGeometry(['line']);
        const byPflIds = pool.search('pfl', 'line').collection.map((p) => p.id);
        expect(byPflIds).to.include('highway/footway/private_footway_link');
    });

    footwayGridEntries().forEach(function({ id, tags, addTags }) {
        it(`defines grid preset ${id}`, function() {
            const preset = iD.presetManager.item(id);
            expect(preset?.tags, id).to.eql(tags);
            expect(preset.addTags).to.eql(addTags);
        });
    });

    it('offers only the pedestrian access categories on footways', function() {
        const categories = new Set(footwayGridEntries().map((entry) => entry.category.id));
        expect([...categories]).to.eql(['private', 'customers', 'permissive', 'private_property', 'destination', 'private_ownership']);
    });

    it('defines restricted informal path and sidewalk presets', function() {
        const privateInformal = iD.presetManager.item('highway/footway/private_informal');
        const privateSidewalk = iD.presetManager.item('highway/footway/private_sidewalk');
        expect(privateInformal.tags).to.include({
            highway: 'path',
            informal: 'yes',
            access: 'private'
        });
        expect(privateSidewalk.tags).to.include({
            highway: 'footway',
            footway: 'sidewalk',
            access: 'private'
        });
        expect(privateSidewalk.tags).to.not.have.property('bicycle');
        expect(privateSidewalk.addTags.surface).to.equal('concrete');
    });

    it('defines access aisle bicycle yes preset tags', function() {
        const accessAisle = iD.presetManager.item('highway/footway/access_aisle_bicycle_yes');
        expect(accessAisle, 'access aisle bicycle yes').to.exist;
        expect(accessAisle.name()).to.equal('Access aisle bicycle yes');
        expect(accessAisle.tags).to.include({
            highway: 'footway',
            footway: 'access_aisle',
            bicycle: 'yes'
        });
    });

    it('defines private access aisle without bicycle tag', function() {
        const privateAisle = iD.presetManager.item('highway/footway/private_access_aisle');
        expect(privateAisle, 'private access aisle').to.exist;
        expect(privateAisle.tags).to.include({ access: 'private', footway: 'access_aisle' });
        expect(privateAisle.tags).to.not.have.property('bicycle');
    });

    it('defines private footway link without bicycle tag', function() {
        const privateLink = iD.presetManager.item('highway/footway/private_footway_link');
        expect(privateLink, 'private footway link').to.exist;
        expect(privateLink.tags).to.include({ footway: 'link', access: 'private' });
        expect(privateLink.tags).to.not.have.property('bicycle');
    });

    it('exposes pfl alias on private footway link', function() {
        const privateLink = iD.presetManager.item('highway/footway/private_footway_link');
        expect(privateLink, 'private footway link').to.exist;
        expect(privateLink.aliases()).to.include('pfl');
    });

    it('removes bicycle when changing from footway link bicycle dismount to private footway link', function() {
        const oldPreset = iD.presetManager.item('highway/footway/footway_link_bicycle_dismount');
        const newPreset = iD.presetManager.item('highway/footway/private_footway_link');
        const n1 = new iD.osmNode({ loc: [0, 0] });
        const n2 = new iD.osmNode({ loc: [1, 1] });
        const way = new iD.osmWay({
            nodes: [n1.id, n2.id],
            tags: {
                highway: 'footway',
                footway: 'link',
                bicycle: 'dismount',
                surface: 'asphalt'
            }
        });
        const graph = new iD.coreGraph([n1, n2, way]);
        const tags = iD.actionChangePreset(way.id, oldPreset, newPreset)(graph).entity(way.id).tags;

        expect(tags).to.include({
            highway: 'footway',
            footway: 'link',
            access: 'private',
            surface: 'asphalt'
        });
        expect(tags).to.not.have.property('bicycle');
    });

    it('defines footway bicycle yes preset tags', function() {
        const yes = iD.presetManager.item('highway/footway/bicycle_yes');
        expect(yes, 'footway bicycle yes').to.exist;
        expect(yes.tags).to.include({ highway: 'footway', bicycle: 'yes' });
        expect(yes.tags).to.not.have.property('footway');
        expect(yes.addTags.surface).to.equal('asphalt');
    });

    it('defines bicycle dismount footway presets by surface', function() {
        const asphalt = iD.presetManager.item('highway/footway/bicycle_dismount_asphalt');
        const concrete = iD.presetManager.item('highway/footway/bicycle_dismount_concrete');
        const unpaved = iD.presetManager.item('highway/footway/bicycle_dismount_unpaved');
        const other = iD.presetManager.item('highway/footway/bicycle_dismount_other');
        expect(asphalt.tags).to.include({ highway: 'footway', bicycle: 'dismount', surface: 'asphalt' });
        expect(concrete.tags).to.include({ surface: 'concrete' });
        expect(unpaved.tags).to.include({ surface: 'unpaved' });
        expect(other.tags).to.include({ bicycle: 'dismount' });
        expect(other.tags).to.not.have.property('surface');
        expect(other.tags).to.not.have.property('footway');
    });

    it('defines informal path presets with bicycle and surface', function() {
        const dismountUnpaved = iD.presetManager.item('highway/footway/informal_bicycle_dismount_unpaved');
        const dismountGrass = iD.presetManager.item('highway/footway/informal_bicycle_dismount_grass');
        const yesUnpaved = iD.presetManager.item('highway/footway/informal_bicycle_yes_unpaved');
        expect(dismountUnpaved.tags).to.eql({
            highway: 'path',
            informal: 'yes',
            bicycle: 'dismount',
            surface: 'unpaved'
        });
        expect(dismountGrass.tags).to.include({ bicycle: 'dismount', surface: 'grass' });
        expect(yesUnpaved.tags).to.eql({
            highway: 'path',
            informal: 'yes',
            bicycle: 'yes',
            surface: 'unpaved'
        });
    });

    it('defines sidewalk bicycle dismount and yes preset tags', function() {
        const dismount = iD.presetManager.item('highway/footway/sidewalk_bicycle_dismount');
        const yes = iD.presetManager.item('highway/footway/sidewalk_bicycle_yes');
        expect(dismount, 'sidewalk bicycle dismount').to.exist;
        expect(yes, 'sidewalk bicycle yes').to.exist;
        expect(dismount.tags).to.include({
            highway: 'footway',
            footway: 'sidewalk',
            bicycle: 'dismount'
        });
        expect(yes.tags).to.include({ footway: 'sidewalk', bicycle: 'yes' });
        expect(dismount.addTags.surface).to.equal('concrete');
        expect(dismount.originalFields).to.include('name');
        expect(yes.originalFields).to.include('name');
    });

    it('finds sidewalk presets via alias search', function() {
        const pool = iD.presetManager.matchAllGeometry(['line']);
        const bySbd = pool.search('sbd', 'line').collection.map((p) => p.id);
        expect(bySbd).to.include('highway/footway/sidewalk_bicycle_dismount');
        const bySby = pool.search('sby', 'line').collection.map((p) => p.id);
        expect(bySby).to.include('highway/footway/sidewalk_bicycle_yes');
    });

    it('removes access when changing from private footway link to footway link bicycle dismount', function() {
        const oldPreset = iD.presetManager.item('highway/footway/private_footway_link');
        const newPreset = iD.presetManager.item('highway/footway/footway_link_bicycle_dismount');
        const n1 = new iD.osmNode({ loc: [0, 0] });
        const n2 = new iD.osmNode({ loc: [1, 1] });
        const way = new iD.osmWay({
            nodes: [n1.id, n2.id],
            tags: {
                highway: 'footway',
                footway: 'link',
                access: 'private',
                surface: 'asphalt'
            }
        });
        const graph = new iD.coreGraph([n1, n2, way]);
        const tags = iD.actionChangePreset(way.id, oldPreset, newPreset)(graph).entity(way.id).tags;

        expect(tags).to.include({
            highway: 'footway',
            footway: 'link',
            bicycle: 'dismount',
            surface: 'asphalt'
        });
        expect(tags).to.not.have.property('access');
    });
});
