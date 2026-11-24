import { beforeAll } from 'vitest';
import fetchMock from 'fetch-mock';
import 'fake-indexeddb/auto';
import envs from '../config/envs.js';


global.VITEST = true;

// create global variables for this data, to match what the esbuild config does
for (const [key, value] of Object.entries(envs)) {
  Reflect.set(global, key, JSON.parse(value));
}


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

// Use fake data for the 'tagging' scope
cached.locale_tagging_en = {
  en: {
    presets: {
      fields: {
        restrictions: {
          label: 'Turn Restrictions'
        },
        access: {
          label: 'Allowed Access',
          placeholder: 'Not Specified',
          types: {
            access: 'All',
            foot: 'Foot',
            motor_vehicle: 'Motor Vehicles',
            bicycle: 'Bicycles',
            horse: 'Horses'
          },
          options: {
            yes: {
              title: 'Allowed',
              description: 'Access allowed by law; a right of way'
            },
            no: {
              title: 'Prohibited',
              description: 'Access not allowed to the general public'
            },
            permissive: {
              title: 'Permissive',
              description: 'Access allowed until such time as the owner revokes the permission'
            },
            private: {
              title: 'Private',
              description: 'Access allowed only with permission of the owner on an individual basis'
            },
            designated: {
              title: 'Designated',
              description: 'Access allowed according to signs or specific local laws'
            },
            destination: {
              title: 'Destination',
              description: 'Access allowed only to reach a destination'
            },
            dismount: {
              title: 'Dismount',
              description: 'Access allowed but rider must dismount'
            },
            permit: {
              title: 'Permit',
              description: 'Access allowed only with a valid permit or license'
            }
          }
        }
      }
    }
  }
};

// Load the actual data from `dist/locales/` for the 'general' scope
iD.localizer.loadLocale('en', 'general', 'locales');
// Load the fake data seeded above for the 'tagging' scope
iD.localizer.loadLocale('en', 'tagging', undefined!);


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
delete window.PointerEvent;  // force the browser to use mouse events

// some sticky fallbacks
const vegbilderOwsCapabilities = {
  featureTypes: [
    { typeName: 'Vegbilder_2020' },
    { typeName: 'Vegbilder_dekke_2026' },
  ],
};

fetchMock.sticky({
          url: 'https://www.vegvesen.no/kart/ogc/vegbilder_1_0/ows',
            query: {
              service: 'WFS',
              request: 'DescribeFeatureType'
            }
          }, vegbilderOwsCapabilities, {sticky: true});
fetchMock.config.fallbackToNetwork = false;
fetchMock.config.overwriteRoutes = false;

beforeAll(async () => {
  await new iD.coreLocalizer().ensureLoaded();
});
