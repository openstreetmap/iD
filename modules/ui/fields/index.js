import {
    uiFieldCheck,
    uiFieldDefaultcheck
} from './check';

import {
    uiFieldCombo,
    uiFieldMultiCombo,
    uiFieldNetworkCombo,
    uiFieldTypeCombo
} from './combo';

import {
    uiFieldEmail,
    uiFieldNumber,
    uiFieldTel,
    uiFieldText,
    uiFieldUrl
} from './input';

import { uiFieldAccess } from './access';
import { uiFieldAddress } from './address';
import { uiFieldCycleway } from './cycleway';
import { uiFieldLanes } from './lanes';
import { uiFieldLocalized } from './localized';
import { uiFieldMaxspeed } from './maxspeed';
import { uiFieldRadio } from './radio';
import { uiFieldRestrictions } from './restrictions';
import { uiFieldTextarea } from './textarea';
import { uiFieldWikipedia } from './wikipedia';

export var uiFields = {
    access: uiFieldAccess,
    address: uiFieldAddress,
    check: uiFieldCheck,
    defaultcheck: uiFieldDefaultcheck,
    combo: uiFieldCombo,
    typeCombo: uiFieldTypeCombo,
    multiCombo: uiFieldMultiCombo,
    networkCombo: uiFieldNetworkCombo,
    cycleway: uiFieldCycleway,
    text: uiFieldText,
    url: uiFieldUrl,
    number: uiFieldNumber,
    email: uiFieldEmail,
    tel: uiFieldTel,
    localized: uiFieldLocalized,
    lanes: uiFieldLanes,
    maxspeed: uiFieldMaxspeed,
    radio: uiFieldRadio,
    restrictions: uiFieldRestrictions,
    textarea: uiFieldTextarea,
    wikipedia: uiFieldWikipedia
};
