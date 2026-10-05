import {
    addBusinessDays,
    isBusinessDay,
    normalizeWeekendDays,
    DEFAULT_WEEKEND_DAYS,
} from "../src/calculation/businessdays";
import { Weekday } from "../src";

test("Test - Default weekend (Saturday/Sunday)", () => {
    // Friday 2024-03-08
    const friday = new Date(2024, 2, 8, 8, 0);
    expect(addBusinessDays(friday, 1).getDay()).toBe(Weekday.MONDAY);
    expect(addBusinessDays(friday, 2).getDay()).toBe(Weekday.TUESDAY);
    expect(addBusinessDays(friday, 3).getDay()).toBe(Weekday.WEDNESDAY);

    expect(addBusinessDays(friday, 3).getDate()).toBe(13);
    expect(addBusinessDays(friday, -2).getDate()).toBe(6);

    // Saturday 2024-03-09 and Sunday 2024-03-10: the next business day is Monday
    const saturday = new Date(2024, 2, 9, 8, 0);
    const sunday = new Date(2024, 2, 10, 8, 0);
    expect(addBusinessDays(saturday, 1).getDay()).toBe(Weekday.MONDAY);
    expect(addBusinessDays(sunday, 1).getDay()).toBe(Weekday.MONDAY);

    expect(isBusinessDay(friday)).toBe(true);
    expect(isBusinessDay(saturday)).toBe(false);
    expect(isBusinessDay(sunday)).toBe(false);
});

test("Test - Longer counts cross multiple weekends", () => {
    // Friday 2024-03-08; 10 business days later = Friday 2024-03-22
    const friday = new Date(2024, 2, 8);
    const later = addBusinessDays(friday, 10);
    expect(later.getDay()).toBe(Weekday.FRIDAY);
    expect(later.getDate()).toBe(22);

    // 10 business days before = Friday 2024-02-23
    const earlier = addBusinessDays(friday, -10);
    expect(earlier.getDay()).toBe(Weekday.FRIDAY);
    expect(earlier.getMonth()).toBe(1);
    expect(earlier.getDate()).toBe(23);
});

test("Test - Custom weekend (Friday/Saturday)", () => {
    const weekend = [Weekday.FRIDAY, Weekday.SATURDAY];

    // Friday 2024-03-08 is itself on the weekend; the next business day is Sunday 2024-03-10.
    const friday = new Date(2024, 2, 8, 8, 0);
    expect(isBusinessDay(friday, weekend)).toBe(false);
    expect(addBusinessDays(friday, 1, weekend).getDay()).toBe(Weekday.SUNDAY);

    // Thursday 2024-03-07: +1 => Sunday, +2 => Monday, +3 => Tuesday
    const thursday = new Date(2024, 2, 7, 8, 0);
    expect(addBusinessDays(thursday, 1, weekend).getDay()).toBe(Weekday.SUNDAY);
    expect(addBusinessDays(thursday, 2, weekend).getDay()).toBe(Weekday.MONDAY);
    expect(addBusinessDays(thursday, 3, weekend).getDay()).toBe(Weekday.TUESDAY);

    // Backward: -1 from Thursday => Wednesday
    expect(addBusinessDays(thursday, -1, weekend).getDay()).toBe(Weekday.WEDNESDAY);
});

test("Test - normalizeWeekendDays", () => {
    expect(normalizeWeekendDays(undefined)).toEqual(DEFAULT_WEEKEND_DAYS);
    expect(normalizeWeekendDays([Weekday.SATURDAY, Weekday.SUNDAY, Weekday.SATURDAY])).toEqual([
        Weekday.SUNDAY,
        Weekday.SATURDAY,
    ]);

    expect(() => normalizeWeekendDays([])).toThrow(/weekendDays/);
    expect(() => normalizeWeekendDays([0, 1, 2, 3, 4, 5, 6])).toThrow(/weekendDays/);
    expect(() => normalizeWeekendDays([7 as Weekday])).toThrow(/weekendDays/);
    expect(() => normalizeWeekendDays([-1 as Weekday])).toThrow(/weekendDays/);
});
