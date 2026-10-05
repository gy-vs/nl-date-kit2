import { NUMBER_PATTERN, parseNumberPattern } from "../constants";
import { ParsingContext } from "../../../chrono";
import { createParsingComponentsAfterBusinessDays } from "../../../calculation/businessdays";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary";

const PATTERN = new RegExp(
    `(this|last|past|next|after)\\s*` +
        `(?:(${NUMBER_PATTERN})\\s{0,3})?` +
        `(?:business|working)\\s{0,3}days?(?=\\W|$)`,
    "i"
);

const MODIFIER_GROUP = 1;
const NUMBER_GROUP = 2;

export default class ENBusinessDayCasualRelativeFormatParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(): RegExp {
        return PATTERN;
    }

    innerExtract(context: ParsingContext, match: RegExpMatchArray) {
        const modifier = match[MODIFIER_GROUP].toLowerCase();
        let businessDaysCount = match[NUMBER_GROUP] !== undefined ? parseNumberPattern(match[NUMBER_GROUP]) : 1;

        switch (modifier) {
            case "last":
            case "past":
                businessDaysCount = -businessDaysCount;
                break;
            case "this":
                // "this business day" means the current day; an explicit count is unusual but treated forward.
                if (match[NUMBER_GROUP] === undefined) {
                    businessDaysCount = 0;
                }
                break;
        }

        return createParsingComponentsAfterBusinessDays(context.reference, businessDaysCount, context.weekendDays);
    }
}
