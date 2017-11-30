export * from './check';
export * from './combo';
export * from './input';
export * from './access';
export * from './address';
export * from './cycleway';
export * from './lanes';
export * from './localized';
export * from './maxspeed';
export * from './radio';
export * from './restrictions';
export * from './textarea';
export * from './wikipedia';

import {
    uiFieldCheck,
    uiFieldDefaultCheck,
    uiFieldOnewayCheck
} from './check';

import {
    uiFieldCombo,
    uiFieldMultiCombo,
    uiFieldNetworkCombo,
    uiFieldSemiCombo,
    uiFieldTypeCombo
} from './combo';

import {
    uiFieldEmail,
    uiFieldNumber,
    uiFieldTel,
    uiFieldText,
    uiFieldUrl
} from './input';

import {
    uiFieldRadio,
    uiFieldStructureRadio
} from './radio';

import { uiFieldAccess } from './access';
import { uiFieldAddress } from './address';
import { uiFieldCycleway } from './cycleway';
import { uiFieldLanes } from './lanes';
import { uiFieldLocalized } from './localized';
import { uiFieldMaxspeed } from './maxspeed';
import { uiFieldRestrictions } from './restrictions';
import { uiFieldTextarea } from './textarea';
import { uiFieldWikipedia } from './wikipedia';

export var uiFields = {
    access: uiFieldAccess,
    address: uiFieldAddress,
    check: uiFieldCheck,
    combo: uiFieldCombo,
    cycleway: uiFieldCycleway,
    defaultCheck: uiFieldDefaultCheck,
    email: uiFieldEmail,
    lanes: uiFieldLanes,
    localized: uiFieldLocalized,
    maxspeed: uiFieldMaxspeed,
    multiCombo: uiFieldMultiCombo,
    networkCombo: uiFieldNetworkCombo,
    number: uiFieldNumber,
    onewayCheck: uiFieldOnewayCheck,
    radio: uiFieldRadio,
    restrictions: uiFieldRestrictions,
    semiCombo: uiFieldSemiCombo,
    structureRadio: uiFieldStructureRadio,
    tel: uiFieldTel,
    text: uiFieldText,
    textarea: uiFieldTextarea,
    typeCombo: uiFieldTypeCombo,
    url: uiFieldUrl,
    wikipedia: uiFieldWikipedia
};
