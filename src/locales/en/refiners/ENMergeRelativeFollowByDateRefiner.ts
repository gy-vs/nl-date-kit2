import { MergingRefiner } from "../../../common/abstractRefiners";
import { ParsingComponents, ParsingResult, ReferenceWithTimezone } from "../../../results";
import { parseDuration, parseNumberPattern, BUSINESS_DAY_TIME_UNITS_PATTERN } from "../constants";
import { reverseDuration } from "../../../calculation/duration";
import { createParsingComponentsAfterBusinessDays } from "../../../calculation/businessdays";

function hasImpliedEarlierReferenceDate(result: ParsingResult): boolean {
    return result.text.match(/\s+(before|from)$/i) != null;
}

function hasImpliedLaterReferenceDate(result: ParsingResult): boolean {
    return result.text.match(/\s+(after|since)$/i) != null;
}

const BUSINESS_DAY_PATTERN = new RegExp(BUSINESS_DAY_TIME_UNITS_PATTERN, "i");

/**
 * Merges a relative data/time that follow by an absolute date.
 * - [2 weeks before] [2020-02-13]
 * - [2 days after] [next Friday]
 */
export default class ENMergeRelativeFollowByDateRefiner extends MergingRefiner {
    patternBetween(): RegExp {
        return /^\s*$/i;
    }

    shouldMergeResults(textBetween: string, currentResult: ParsingResult, nextResult: ParsingResult): boolean {
        // Dates need to be next to each other to get merged
        if (!textBetween.match(this.patternBetween())) {
            return false;
        }

        // Check if any relative tokens were swallowed by the first date.
        // E.g. [<relative_date1> from] [<date2>]
        if (!hasImpliedEarlierReferenceDate(currentResult) && !hasImpliedLaterReferenceDate(currentResult)) {
            return false;
        }

        // make sure that <date2> implies an absolute date
        return !!nextResult.start.get("day") && !!nextResult.start.get("month") && !!nextResult.start.get("year");
    }

    mergeResults(textBetween: string, currentResult: ParsingResult, nextResult: ParsingResult, context): ParsingResult {
        const mergedText = `${currentResult.text}${textBetween}${nextResult.text}`;

        const businessDayMatch = currentResult.text.match(BUSINESS_DAY_PATTERN);
        if (businessDayMatch) {
            let businessDaysCount = parseNumberPattern(businessDayMatch[1]);
            if (hasImpliedEarlierReferenceDate(currentResult)) {
                businessDaysCount = -businessDaysCount;
            }

            const components = createParsingComponentsAfterBusinessDays(
                ReferenceWithTimezone.fromDate(nextResult.start.date()),
                businessDaysCount,
                context.weekendDays
            );

            return new ParsingResult(nextResult.reference, currentResult.index, mergedText, components);
        }

        let duration = parseDuration(currentResult.text);
        if (hasImpliedEarlierReferenceDate(currentResult)) {
            duration = reverseDuration(duration);
        }

        const components = ParsingComponents.createRelativeFromReference(
            ReferenceWithTimezone.fromDate(nextResult.start.date()),
            duration
        );

        return new ParsingResult(nextResult.reference, currentResult.index, mergedText, components);
    }
}
