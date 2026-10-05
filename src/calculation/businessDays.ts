import { Weekday } from "../types";
import { ParsingComponents, ReferenceWithTimezone } from "../results";
import { implySimilarTime } from "../utils/dates";

/**
 * The weekdays considered as the weekend by default (Saturday and Sunday).
 */
export const DEFAULT_WEEKEND_DAYS: Weekday[] = [Weekday.SATURDAY, Weekday.SUNDAY];

/**
 * Returns the set of weekdays (using the {@link Weekday} enum values) considered
 * as the weekend according to the given option.
 * @param weekendDays The `weekendDays` option (undefined means the default).
 */
export function getWeekendDaySet(weekendDays?: Weekday[]): Set<Weekday> {
    return new Set(weekendDays ?? DEFAULT_WEEKEND_DAYS);
}

/**
 * Checks whether the given date falls on a weekend day according to `weekendDays`.
 * @param date The date to check.
 * @param weekendDays Set of weekdays considered as the weekend.
 */
export function isWeekendDay(date: Date, weekendDays: Set<Weekday>): boolean {
    return weekendDays.has(date.getDay() as Weekday);
}

/**
 * Moves the given date forward by `businessDayCount` business days, skipping
 * weekend days. If the starting date itself falls on a weekend, it is skipped
 * first and not counted.
 * @param date The starting date.
 * @param businessDayCount Number of business days to move forward (must be >= 1).
 * @param weekendDays Set of weekdays considered as the weekend.
 */
export function addBusinessDays(date: Date, businessDayCount: number, weekendDays: Set<Weekday>): Date {
    const result = new Date(date);
    let remaining = businessDayCount;
    while (remaining > 0) {
        result.setDate(result.getDate() + 1);
        if (!isWeekendDay(result, weekendDays)) {
            remaining -= 1;
        }
    }
    return result;
}

/**
 * Moves the given date backward by `businessDayCount` business days, skipping
 * weekend days. If the starting date itself falls on a weekend, it is skipped
 * first and not counted.
 * @param date The starting date.
 * @param businessDayCount Number of business days to move backward (must be >= 1).
 * @param weekendDays Set of weekdays considered as the weekend.
 */
export function subtractBusinessDays(date: Date, businessDayCount: number, weekendDays: Set<Weekday>): Date {
    const result = new Date(date);
    let remaining = businessDayCount;
    while (remaining > 0) {
        result.setDate(result.getDate() - 1);
        if (!isWeekendDay(result, weekendDays)) {
            remaining -= 1;
        }
    }
    return result;
}

/**
 * Returns the next business day after the given date. A weekend reference date
 * is skipped, so "next business day" from a weekend resolves to the following
 * first business day (e.g. Monday for a Saturday/Sunday weekend).
 * @param date The starting date.
 * @param weekendDays Set of weekdays considered as the weekend.
 */
export function getNextBusinessDay(date: Date, weekendDays: Set<Weekday>): Date {
    return addBusinessDays(date, 1, weekendDays);
}

/**
 * Returns the previous business day before the given date.
 * @param date The starting date.
 * @param weekendDays Set of weekdays considered as the weekend.
 */
export function getPreviousBusinessDay(date: Date, weekendDays: Set<Weekday>): Date {
    return subtractBusinessDays(date, 1, weekendDays);
}

/**
 * Creates the parsing components for a date that is a number of business days
 * away from the reference. The time and timezone are implied to be similar to
 * the reference, same as the normal "in N days" relative expression.
 * @param reference The parsing reference.
 * @param businessDayOffset Number of business days from the reference (positive
 * for the future, negative for the past).
 * @param weekendDays Set of weekdays considered as the weekend.
 */
export function createBusinessDayComponents(
    reference: ReferenceWithTimezone,
    businessDayOffset: number,
    weekendDays: Set<Weekday>
): ParsingComponents {
    const refDate = reference.getDateWithAdjustedTimezone();
    const targetDate =
        businessDayOffset >= 0
            ? addBusinessDays(refDate, businessDayOffset, weekendDays)
            : subtractBusinessDays(refDate, -businessDayOffset, weekendDays);

    const components = new ParsingComponents(reference);
    implySimilarTime(components, targetDate);
    components.imply("timezoneOffset", reference.getTimezoneOffset());
    components.assign("day", targetDate.getDate());
    components.assign("month", targetDate.getMonth() + 1);
    components.assign("year", targetDate.getFullYear());
    components.assign("weekday", targetDate.getDay());
    components.addTag("result/relativeDate");
    return components;
}
