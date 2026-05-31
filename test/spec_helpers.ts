import { beforeAll, beforeEach, afterEach } from 'vitest';
import 'happen';
import fetchMock from 'fetch-mock';
import 'fake-indexeddb/auto';
import envs from '../config/envs.js';
import taggingEn from '@openstreetmap/id-tagging-schema/dist/translations/en.min.json' with { type: 'json' };
import { applyAccessFieldTypes } from '../modules/presets/access_field_type_strings.js';

declare var global: typeof globalThis;
declare var jsdom: typeof globalThis;

global.before = beforeEach;
global.after = afterEach;
global.fetchMock = fetchMock;
global.VITEST = true;

// create global variables for this data, to match what the esbuild config does
for (const [key, value] of Object.entries(envs)) {
  Reflect.set(global, key, JSON.parse(value));
}

// the 'happen' library explicitly references `window` when creating an event,
// but we need to use jsdom's window, so we have to patch initEvent.
const { initMouseEvent } = MouseEvent.prototype;
MouseEvent.prototype.initMouseEvent = function (...args) {
  args[3] = jsdom.window;
  return initMouseEvent.apply(this, args);
};
const { initUIEvent } = UIEvent.prototype;
UIEvent.prototype.initUIEvent = function (...args) {
  args[3] = jsdom.window;
  return initUIEvent.apply(this, args);
};

// must be imported after global envs are defined
await import('../modules/id.js');
const iD = global.iD;
iD.setDebug(true);

// @ts-expect-error
// Disable things that use the network
for (var k in iD.services) { delete iD.services[k]; }

// Try not to load imagery
window.location.hash = '#background=none';

// Run without data for speed (tests which need data can set it up themselves)
iD.fileFetcher.assetPath('../dist/');
const cached: any = iD.fileFetcher.cache();

// Initializing `coreContext` will try loading the locale data and English locale strings:
cached.locales = { en: { rtl: false, pct: 1 } };
cached.locales_index_general = { en: { rtl: false, pct: 1 } };
cached.locales_index_tagging = { en: { rtl: false, pct: 1 } };

// Tagging locale from schema, with temporary access type labels merged at runtime
applyAccessFieldTypes(taggingEn.en);
cached.locale_tagging_en = taggingEn;

// Load the actual data from `dist/locales/` for the 'general' scope
iD.localizer.loadLocale('en', 'general', 'locales');
// Load the fake data seeded above for the 'tagging' scope
iD.localizer.loadLocale('en', 'tagging');


// Initializing `coreContext` initializes `_background`, which tries loading:
cached.imagery = [];
// Initializing `coreContext` initializes `_presets`, which tries loading:
cached.preset_categories = {};
cached.preset_defaults = {};
cached.preset_fields = {};
cached.preset_presets = {};
// Initializing `coreContext` initializes `_validator`, which tries loading:
cached.deprecated = [];
// Initializing `coreContext` initializes `_uploader`, which tries loading:
cached.discarded = {};

// @ts-expect-error
window.d3 = iD.d3; // Remove this if we can avoid exporting all of d3.js

// @ts-expect-error
delete window.PointerEvent;  // force the browser to use mouse events

// some sticky fallbacks
const vegbilderOwsCapabilities = `<?xml version="1.0" encoding="UTF-8"?>
<wfs:WFS_Capabilities version="2.0.0"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns="http://www.opengis.net/wfs/2.0"
	xmlns:wfs="http://www.opengis.net/wfs/2.0"
	xmlns:ows="http://www.opengis.net/ows/1.1"
	xmlns:gml="http://www.opengis.net/gml/3.2"
	xmlns:fes="http://www.opengis.net/fes/2.0"
	xmlns:xlink="http://www.w3.org/1999/xlink"
	xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:schemaLocation="http://www.opengis.net/wfs/2.0 https://www.vegvesen.no/kart/ogc/schemas/wfs/2.0/wfs.xsd"
	xmlns:xml="http://www.w3.org/XML/1998/namespace"
	xmlns:vegbilder_1_0="http://vegbilder_1_0">
<ows:ServiceIdentification>
	<ows:Title>Mock OGC</ows:Title>
	<ows:ServiceType>WFS</ows:ServiceType>
	<ows:ServiceTypeVersion>2.0.0</ows:ServiceTypeVersion>
</ows:ServiceIdentification>
<FeatureTypeList>
	<FeatureType xmlns:vegbilder_1_0="http://vegbilder_1_0">
		<Name>vegbilder_1_0:Vegbilder_2020</Name>
		<Title>Vegbilder_2020</Title>
		<Abstract>Testlayer</Abstract>
		<DefaultCRS>urn:ogc:def:crs:EPSG::4326</DefaultCRS>
		<OtherCRS>urn:ogc:def:crs:EPSG::3857</OtherCRS>
	</FeatureType>
	<FeatureType xmlns:vegbilder_1_0="http://vegbilder_1_0">
		<Name>not_matched_layer:Vegbilder_2020</Name>
		<Title>Vegbilder_2020_4</Title>
		<Abstract>Not matched layer</Abstract>
		<DefaultCRS>urn:ogc:def:crs:EPSG::4326</DefaultCRS>
		<OtherCRS>urn:ogc:def:crs:EPSG::3857</OtherCRS>
	</FeatureType>
</FeatureTypeList>
<fes:Filter_Capabilities/>
</wfs:WFS_Capabilities>`;

fetchMock.sticky({
          url: 'https://www.vegvesen.no/kart/ogc/vegbilder_1_0/ows',
            query: {
              service: 'WFS',
              request: 'GetCapabilities'
            }
          }, vegbilderOwsCapabilities, {sticky: true});
fetchMock.config.fallbackToNetwork = true;
fetchMock.config.overwriteRoutes = false;

beforeAll(async () => {
  await iD.coreLocalizer().ensureLoaded();
});
