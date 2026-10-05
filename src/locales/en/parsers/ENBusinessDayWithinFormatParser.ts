import { BUSINESS_DAY_TIME_UNITS_PATTERN, parseNumberPattern } from "../constants";
import { ParsingContext } from "../../../chrono";
import { createParsingComponentsAfterBusinessDays } from "../../../calculation/businessdays";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary";

const PATTERN_WITH_OPTIONAL_PREFIX = new RegExp(
    `(?:(?:within|in|for)\\s*)?` +
        `(?:(?:about|around|roughly|approximately|just)\\s*(?:~\\s*)?)?(?:${BUSINESS_DAY_TIME_UNITS_PATTERN})(?=\\W|$)`,
    "i"
);

const PATTERN_WITH_PREFIX = new RegExp(
    `(?:within|in|for)\\s*` +
        `(?:(?:about|around|roughly|approximately|just)\\s*(?:~\\s*)?)?(?:${BUSINESS_DAY_TIME_UNITS_PATTERN})(?=\\W|$)`,
    "i"
);

const GROUP_NUM_TIMEUNITS = 1;

export default class ENBusinessDayWithinFormatParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(context: ParsingContext): RegExp {
        return context.option.forwardDate ? PATTERN_WITH_OPTIONAL_PREFIX : PATTERN_WITH_PREFIX;
    }

    innerExtract(context: ParsingContext, match: RegExpMatchArray) {
        // Exclude "for the ..." phrases, e.g. "for the business day"
        if (match[0].match(/^for\s*the\s*\w+/)) {
            return null;
        }

        const businessDaysCount = parseNumberPattern(match[GROUP_NUM_TIMEUNITS]);
        return createParsingComponentsAfterBusinessDays(context.reference, businessDaysCount, context.weekendDays);
    }
}
