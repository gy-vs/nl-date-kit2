import {
    addBusinessDays,
    subtractBusinessDays,
    getNextBusinessDay,
    getPreviousBusinessDay,
    isWeekendDay,
    createBusinessDayComponents,
    DEFAULT_WEEKEND_DAYS,
    getWeekendDaySet,
} from "../src/calculation/businessDays";
import { ReferenceWithTimezone } from "../src/results";
import { Weekday } from "../src";

const DEFAULT_WEEKEND = getWeekendDaySet();
const FRI_SAT_WEEKEND = new Set<Weekday>([Weekday.FRIDAY, Weekday.SATURDAY]);

test("Test - Default weekend days", () => {
    expect(DEFAULT_WEEKEND_DAYS).toEqual([Weekday.SATURDAY, Weekday.SUNDAY]);
    expect(isWeekendDay(new Date(2024, 2, 9), DEFAULT_WEEKEND)).toBeTruthy(); // Saturday
    expect(isWeekendDay(new Date(2024, 2, 10), DEFAULT_WEEKEND)).toBeTruthy(); // Sunday
    expect(isWeekendDay(new Date(2024, 2, 8), DEFAULT_WEEKEND)).toBeFalsy(); // Friday
});

test("Test - Add business days with Saturday/Sunday weekend", () => {
    // Friday 2024-03-08
    const friday = new Date(2024, 2, 8, 8, 0);
    expect(addBusinessDays(friday, 1, DEFAULT_WEEKEND).getDate()).toBe(11); // Monday
    expect(addBusinessDays(friday, 2, DEFAULT_WEEKEND).getDate()).toBe(12); // Tuesday
    expect(addBusinessDays(friday, 3, DEFAULT_WEEKEND).getDate()).toBe(13); // Wednesday

    // Saturday 2024-03-09: the weekend itself is skipped
    const saturday = new Date(2024, 2, 9, 8, 0);
    expect(addBusinessDays(saturday, 1, DEFAULT_WEEKEND).getDate()).toBe(11); // Monday

    // Sunday 2024-03-10
    const sunday = new Date(2024, 2, 10, 8, 0);
    expect(addBusinessDays(sunday, 1, DEFAULT_WEEKEND).getDate()).toBe(11); // Monday

    // Monday 2024-03-11: 5 business days lands on the next Monday
    const monday = new Date(2024, 2, 11, 8, 0);
    expect(addBusinessDays(monday, 5, DEFAULT_WEEKEND).getDate()).toBe(18);
});

test("Test - Subtract business days with Saturday/Sunday weekend", () => {
    // Friday 2024-03-08
    const friday = new Date(2024, 2, 8, 8, 0);
    expect(subtractBusinessDays(friday, 1, DEFAULT_WEEKEND).getDate()).toBe(7); // Thursday
    expect(subtractBusinessDays(friday, 2, DEFAULT_WEEKEND).getDate()).toBe(6); // Wednesday

    // Sunday 2024-03-10: skips the weekend, lands on Friday 2024-03-08
    const sunday = new Date(2024, 2, 10, 8, 0);
    expect(subtractBusinessDays(sunday, 1, DEFAULT_WEEKEND).getDate()).toBe(8);
});

test("Test - Next/previous business day", () => {
    expect(getNextBusinessDay(new Date(2024, 2, 8), DEFAULT_WEEKEND).getDay()).toBe(Weekday.MONDAY);
    expect(getNextBusinessDay(new Date(2024, 2, 9), DEFAULT_WEEKEND).getDay()).toBe(Weekday.MONDAY);
    expect(getPreviousBusinessDay(new Date(2024, 2, 10), DEFAULT_WEEKEND).getDay()).toBe(Weekday.FRIDAY);
});

test("Test - Business days with Friday/Saturday weekend", () => {
    // Friday 2024-03-08 is part of the weekend; Sunday is a business day
    const friday = new Date(2024, 2, 8, 8, 0);
    expect(addBusinessDays(friday, 1, FRI_SAT_WEEKEND).getDay()).toBe(Weekday.SUNDAY);
    expect(addBusinessDays(friday, 3, FRI_SAT_WEEKEND).getDay()).toBe(Weekday.TUESDAY);
    expect(subtractBusinessDays(friday, 1, FRI_SAT_WEEKEND).getDay()).toBe(Weekday.THURSDAY);

    expect(isWeekendDay(new Date(2024, 2, 8), FRI_SAT_WEEKEND)).toBeTruthy();
    expect(isWeekendDay(new Date(2024, 2, 9), FRI_SAT_WEEKEND)).toBeTruthy();
    expect(isWeekendDay(new Date(2024, 2, 10), FRI_SAT_WEEKEND)).toBeFalsy();
});

test("Test - Business day components", () => {
    const reference = new ReferenceWithTimezone(new Date(2024, 2, 8, 8, 0));
    const future = createBusinessDayComponents(reference, 3, DEFAULT_WEEKEND);
    expect(future.date()).toStrictEqual(new Date(2024, 2, 13, 8, 0));
    expect(future.get("weekday")).toBe(Weekday.WEDNESDAY);
    expect(future.isCertain("hour")).toBeFalsy();

    const past = createBusinessDayComponents(reference, -2, DEFAULT_WEEKEND);
    expect(past.date()).toStrictEqual(new Date(2024, 2, 6, 8, 0));

    const nextDay = createBusinessDayComponents(reference, 1, DEFAULT_WEEKEND);
    expect(nextDay.date()).toStrictEqual(new Date(2024, 2, 11, 8, 0));
});
