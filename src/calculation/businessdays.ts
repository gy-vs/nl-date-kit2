import { ParsingComponents, ReferenceWithTimezone } from "../results";
import { Weekday } from "../types";

/**
 * The weekdays of the weekend (non-business days) by default: Saturday and Sunday.
 */
export const DEFAULT_WEEKEND_DAYS: Weekday[] = [Weekday.SATURDAY, Weekday.SUNDAY];

/**
 * Validate the "weekendDays" option. Returns the normalized weekend days (as a sorted
 * unique array), or the default when none was provided.
 *
 * An empty array (no weekend) and an array containing all seven weekdays (every day
 * is a weekend) are considered invalid.
 */
export function normalizeWeekendDays(weekendDays?: Weekday[]): Weekday[] {
    if (weekendDays === undefined) {
        return DEFAULT_WEEKEND_DAYS;
    }

    for (const weekday of weekendDays) {
        if (!Number.isInteger(weekday) || weekday < Weekday.SUNDAY || weekday > Weekday.SATURDAY) {
            throw new Error(
                `Invalid weekendDays option: each value must be a Weekday (${Weekday.SUNDAY}-${Weekday.SATURDAY}), but got ${weekday}`
            );
        }
    }

    const uniqueWeekendDays = [...new Set(weekendDays)].sort();
    if (uniqueWeekendDays.length === 0) {
        throw new Error(`Invalid weekendDays option: weekendDays must contain at least one weekday`);
    }
    if (uniqueWeekendDays.length >= 7) {
        throw new Error(`Invalid weekendDays option: weekendDays cannot contain all seven weekdays`);
    }

    return uniqueWeekendDays as Weekday[];
}

/**
 * Returns whether the given date falls on a business day (i.e. not on a weekend day).
 */
export function isBusinessDay(date: Date, weekendDays: Weekday[] = DEFAULT_WEEKEND_DAYS): boolean {
    return !(weekendDays as number[]).includes(date.getDay());
}

/**
 * Returns the date after moving `businessDaysCount` business days from the given date.
 *
 * The given date itself is never counted (e.g. on Friday, 1 business day later is Monday
 * with the default Saturday/Sunday weekend). A negative count moves into the past.
 */
export function addBusinessDays(
    date: Date,
    businessDaysCount: number,
    weekendDays: Weekday[] = DEFAULT_WEEKEND_DAYS
): Date {
    const result = new Date(date);
    const step = businessDaysCount < 0 ? -1 : 1;
    let remaining = Math.abs(Math.trunc(businessDaysCount));

    // A fractional business day (e.g. "half a business day") is handled as a fraction of 24 hours.
    const fraction = Math.abs(businessDaysCount) - Math.floor(Math.abs(businessDaysCount));

    while (remaining > 0) {
        result.setDate(result.getDate() + step);
        if (isBusinessDay(result, weekendDays)) {
            remaining -= 1;
        }
    }

    if (fraction > 0) {
        result.setHours(result.getHours() + Math.round(fraction * 24) * step);
    }

    return result;
}

/**
 * Creates parsing components for a date relative to the reference by the given number of
 * business days. The time implication mirrors `in N days`: the reference time is implied
 * for a date-only expression, and explicitly assigned when a fraction of a business day
 * shifts the time.
 */
export function createParsingComponentsAfterBusinessDays(
    reference: ReferenceWithTimezone,
    businessDaysCount: number,
    weekendDays: Weekday[] = DEFAULT_WEEKEND_DAYS
): ParsingComponents {
    const refDate = reference.getDateWithAdjustedTimezone();
    const date = addBusinessDays(refDate, businessDaysCount, weekendDays);

    const components = new ParsingComponents(reference);
    components.addTag("result/relativeDate");
    components.addTag("result/relativeBusinessDay");

    const fraction = Math.abs(businessDaysCount) - Math.floor(Math.abs(businessDaysCount));
    if (fraction > 0) {
        components.addTag("result/relativeDateAndTime");
        components.assign("day", date.getDate());
        components.assign("month", date.getMonth() + 1);
        components.assign("year", date.getFullYear());
        components.assign("weekday", date.getDay());
        components.assign("hour", date.getHours());
        components.assign("minute", date.getMinutes());
        components.assign("second", date.getSeconds());
        components.assign("millisecond", date.getMilliseconds());
        components.assign("timezoneOffset", reference.getTimezoneOffset());
    } else {
        components.assign("day", date.getDate());
        components.assign("month", date.getMonth() + 1);
        components.assign("year", date.getFullYear());
        components.assign("weekday", date.getDay());
        components.imply("hour", date.getHours());
        components.imply("minute", date.getMinutes());
        components.imply("second", date.getSeconds());
        components.imply("millisecond", date.getMilliseconds());
        components.imply("timezoneOffset", reference.getTimezoneOffset());
    }

    return components;
}
