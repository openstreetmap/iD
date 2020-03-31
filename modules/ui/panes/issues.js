
import { t } from '../../core/localizer';
import { uiPane } from '../pane';

import { uiSectionValidationIssues } from '../sections/validation_issues';
import { uiSectionValidationOptions } from '../sections/validation_options';
import { uiSectionValidationRules } from '../sections/validation_rules';
import { uiSectionValidationStatus } from '../sections/validation_status';

export function uiPaneIssues(context) {

    var issuesPane = uiPane('issues', context)
        .key(t('issues.key'))
        .title(t('issues.title'))
        .description(t('issues.title'))
        .iconName('iD-icon-alert')
        .sections([
            uiSectionValidationOptions(context),
            uiSectionValidationStatus(context),
            uiSectionValidationIssues('issues-errors', 'error', context),
            uiSectionValidationIssues('issues-warnings', 'warning', context),
            uiSectionValidationRules(context)
        ]);

    return issuesPane;
}
