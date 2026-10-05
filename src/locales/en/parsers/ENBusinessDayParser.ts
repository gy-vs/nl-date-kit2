import { ParsingContext } from "../../../chrono";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary";
import { createBusinessDayComponents } from "../../../calculation/businessDays";
import { NUMBER_PATTERN, parseNumberPattern } from "../constants";

const BUSINESS_DAY_UNIT_PATTERN = `(?:business|working)\\s{0,3}days?`;
const APPROX_PREFIX_PATTERN = `(?:(?:about|around|roughly|approximately|just)\\s*(?:~\\s*)?)?`;
const PAST_SUFFIX_PATTERN = `ago|before|earlier`;
const FUTURE_SUFFIX_PATTERN = `later|after|from\\s*now`;
const PAST_SUFFIX_REGEX = new RegExp(`^(?:${PAST_SUFFIX_PATTERN})$`);

// "in/within/for 3 business days" (the prefix is required unless forwardDate is set)
const PATTERN_WITH_PREFIX =
    `(?:(?:within|in|for)\\s*)` +
    APPROX_PREFIX_PATTERN +
    `(${NUMBER_PATTERN})\\s{0,3}${BUSINESS_DAY_UNIT_PATTERN}` +
    `(?=\\W|$)`;

const PATTERN_WITH_OPTIONAL_PREFIX =
    `(?:(?:within|in|for)\\s*)?` +
    APPROX_PREFIX_PATTERN +
    `(${NUMBER_PATTERN})\\s{0,3}${BUSINESS_DAY_UNIT_PATTERN}` +
    `(?=\\W|$)`;

// "3 business days ago" / "3 business days later" (mirrors the ago/later formats)
const PATTERN_WITH_SUFFIX =
    `(${NUMBER_PATTERN})\\s{0,3}${BUSINESS_DAY_UNIT_PATTERN}` +
    `\\s{0,5}(${PAST_SUFFIX_PATTERN}|${FUTURE_SUFFIX_PATTERN})` +
    `(?=\\W|$)`;

// "next business day" / "last working day" (mirrors the casual relative format)
const PATTERN_MODIFIER_ONLY = `(next|last|past)\\s{0,3}${BUSINESS_DAY_UNIT_PATTERN}(?=\\W|$)`;

const STRICT_PATTERN = new RegExp(`(?:${PATTERN_WITH_PREFIX}|${PATTERN_WITH_SUFFIX})`, "i");
const STRICT_FORWARD_PATTERN = new RegExp(`(?:${PATTERN_WITH_OPTIONAL_PREFIX}|${PATTERN_WITH_SUFFIX})`, "i");
const CASUAL_PATTERN = new RegExp(`(?:${PATTERN_WITH_PREFIX}|${PATTERN_WITH_SUFFIX}|${PATTERN_MODIFIER_ONLY})`, "i");
const CASUAL_FORWARD_PATTERN = new RegExp(
    `(?:${PATTERN_WITH_OPTIONAL_PREFIX}|${PATTERN_WITH_SUFFIX}|${PATTERN_MODIFIER_ONLY})`,
    "i"
);

const GROUP_PREFIXED_NUMBER = 1;
const GROUP_SUFFIX_NUMBER = 2;
const GROUP_SUFFIX = 3;
const GROUP_MODIFIER = 4;

/**
 * Parses English relative business/working day expressions, such as
 * "in 3 business days", "within 10 working days", "2 business days ago",
 * "3 working days later", or "next business day".
 */
export default class ENBusinessDayParser extends AbstractParserWithWordBoundaryChecking {
    constructor(private allowCasualModifier: boolean) {
        super();
    }

    innerPattern(context: ParsingContext): RegExp {
        if (this.allowCasualModifier) {
            return context.option.forwardDate ? CASUAL_FORWARD_PATTERN : CASUAL_PATTERN;
        }
        return context.option.forwardDate ? STRICT_FORWARD_PATTERN : STRICT_PATTERN;
    }

    innerExtract(context: ParsingContext, match: RegExpMatchArray) {
        // Exclude "for the unit" phrases, e.g. "for the business day"
        if (match[0].match(/^for\s*the\s*\w+/)) {
            return null;
        }

        if (match[GROUP_MODIFIER]) {
            const modifier = match[GROUP_MODIFIER].toLowerCase();
            switch (modifier) {
                case "next":
                    return createBusinessDayComponents(context.reference, 1, context.weekendDays).addTag(
                        "parser/ENBusinessDayParser"
                    );
                case "last":
                case "past":
                    return createBusinessDayComponents(context.reference, -1, context.weekendDays).addTag(
                        "parser/ENBusinessDayParser"
                    );
            }
        }

        let numberMatch = match[GROUP_PREFIXED_NUMBER];
        let suffix: string | null = null;
        if (numberMatch === undefined) {
            numberMatch = match[GROUP_SUFFIX_NUMBER];
            suffix = (match[GROUP_SUFFIX] || "").toLowerCase();
        }
        if (numberMatch === undefined) {
            return null;
        }

        const num = parseNumberPattern(numberMatch);
        if (!Number.isFinite(num) || num <= 0) {
            return null;
        }

        const businessDayCount = Math.round(num);
        const offset = suffix && PAST_SUFFIX_REGEX.test(suffix) ? -businessDayCount : businessDayCount;

        return createBusinessDayComponents(context.reference, offset, context.weekendDays).addTag(
            "parser/ENBusinessDayParser"
        );
    }
}
