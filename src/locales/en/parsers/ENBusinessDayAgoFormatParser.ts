import { BUSINESS_DAY_TIME_UNITS_PATTERN, parseNumberPattern } from "../constants";
import { ParsingContext } from "../../../chrono";
import { createParsingComponentsAfterBusinessDays } from "../../../calculation/businessdays";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary";

const PATTERN = new RegExp(`(?:${BUSINESS_DAY_TIME_UNITS_PATTERN})\\s{0,5}(?:ago|before|earlier)(?=\\W|$)`, "i");

const GROUP_NUM_TIMEUNITS = 1;

export default class ENBusinessDayAgoFormatParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(): RegExp {
        return PATTERN;
    }

    innerExtract(context: ParsingContext, match: RegExpMatchArray) {
        const businessDaysCount = parseNumberPattern(match[GROUP_NUM_TIMEUNITS]);
        return createParsingComponentsAfterBusinessDays(context.reference, -businessDaysCount, context.weekendDays);
    }
}
