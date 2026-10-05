import * as chrono from "../../src";
import { testSingleCase, testUnexpectedResult } from "../test_util";
import { Weekday } from "../../src";

// Reference: Friday 2024-03-08 08:00 (UTC)
const REFERENCE_DATE = new Date("2024-03-08T08:00:00Z");

test("Test - 'in/within N business/working days' (forward)", () => {
    testSingleCase(chrono, "in 3 business days", REFERENCE_DATE, (result, text) => {
        expect(result.text).toBe(text);
        expect(result.tags()).toContain("result/relativeDate");
        expect(result.tags()).toContain("result/relativeBusinessDay");
        expect(result.start).toBeDate(new Date("2024-03-13T08:00:00Z"));
    });

    testSingleCase(chrono, "will ship in 3 business days", REFERENCE_DATE, (result) => {
        expect(result.text).toBe("in 3 business days");
        expect(result.start).toBeDate(new Date("2024-03-13T08:00:00Z"));
    });

    testSingleCase(chrono, "within 10 working days", REFERENCE_DATE, (result, text) => {
        expect(result.text).toBe(text);
        expect(result.start).toBeDate(new Date("2024-03-22T08:00:00Z"));
    });

    testSingleCase(chrono, "in two business days", REFERENCE_DATE, (result, text) => {
        expect(result.text).toBe(text);
        expect(result.start).toBeDate(new Date("2024-03-12T08:00:00Z"));
    });

    testSingleCase(chrono, "in 1 working day", REFERENCE_DATE, (result, text) => {
        expect(result.text).toBe(text);
        expect(result.start).toBeDate(new Date("2024-03-11T08:00:00Z"));
    });

    testSingleCase(chrono, "in one business day", REFERENCE_DATE, (result, text) => {
        expect(result.text).toBe(text);
        expect(result.start).toBeDate(new Date("2024-03-11T08:00:00Z"));
    });
});

test("Test - 'N business/working days ago/before/earlier' (backward)", () => {
    testSingleCase(chrono, "2 business days ago", REFERENCE_DATE, (result, text) => {
        expect(result.text).toBe(text);
        expect(result.start).toBeDate(new Date("2024-03-06T08:00:00Z"));
    });

    testSingleCase(chrono, "the invoice was issued 2 business days ago", REFERENCE_DATE, (result) => {
        expect(result.text).toBe("2 business days ago");
        expect(result.start).toBeDate(new Date("2024-03-06T08:00:00Z"));
    });

    testSingleCase(chrono, "3 business days ago", REFERENCE_DATE, (result, text) => {
        expect(result.text).toBe(text);
        expect(result.start).toBeDate(new Date("2024-03-05T08:00:00Z"));
    });

    testSingleCase(chrono, "5 working days before", REFERENCE_DATE, (result, text) => {
        expect(result.text).toBe(text);
        expect(result.start).toBeDate(new Date("2024-03-01T08:00:00Z"));
    });

    testSingleCase(chrono, "1 business day earlier", REFERENCE_DATE, (result, text) => {
        expect(result.text).toBe(text);
        expect(result.start).toBeDate(new Date("2024-03-07T08:00:00Z"));
    });
});

test("Test - 'N business/working days later/after/from now' (forward)", () => {
    testSingleCase(chrono, "2 business days later", REFERENCE_DATE, (result, text) => {
        expect(result.text).toBe(text);
        expect(result.start).toBeDate(new Date("2024-03-12T08:00:00Z"));
    });

    testSingleCase(chrono, "10 working days after", REFERENCE_DATE, (result, text) => {
        expect(result.text).toBe(text);
        expect(result.start).toBeDate(new Date("2024-03-22T08:00:00Z"));
    });

    testSingleCase(chrono, "3 business days from now", REFERENCE_DATE, (result, text) => {
        expect(result.text).toBe(text);
        expect(result.start).toBeDate(new Date("2024-03-13T08:00:00Z"));
    });
});

test("Test - 'next/last business/working day'", () => {
    testSingleCase(chrono, "next business day", REFERENCE_DATE, (result, text) => {
        expect(result.text).toBe(text);
        expect(result.start).toBeDate(new Date("2024-03-11T08:00:00Z"));
    });

    testSingleCase(chrono, "we'll reply next business day", REFERENCE_DATE, (result) => {
        expect(result.text).toBe("next business day");
        expect(result.start).toBeDate(new Date("2024-03-11T08:00:00Z"));
    });

    testSingleCase(chrono, "next working day", REFERENCE_DATE, (result, text) => {
        expect(result.text).toBe(text);
        expect(result.start).toBeDate(new Date("2024-03-11T08:00:00Z"));
    });

    testSingleCase(chrono, "last business day", REFERENCE_DATE, (result, text) => {
        expect(result.text).toBe(text);
        expect(result.start).toBeDate(new Date("2024-03-07T08:00:00Z"));
    });

    testSingleCase(chrono, "past business day", REFERENCE_DATE, (result, text) => {
        expect(result.text).toBe(text);
        expect(result.start).toBeDate(new Date("2024-03-07T08:00:00Z"));
    });
});

test("Test - Reference date on the weekend", () => {
    const saturday = new Date("2024-03-09T08:00:00Z");
    const sunday = new Date("2024-03-10T08:00:00Z");

    testSingleCase(chrono, "next business day", saturday, (result) => {
        expect(result.start).toBeDate(new Date("2024-03-11T08:00:00Z"));
    });

    testSingleCase(chrono, "next business day", sunday, (result) => {
        expect(result.start).toBeDate(new Date("2024-03-11T08:00:00Z"));
    });

    testSingleCase(chrono, "in 1 business day", saturday, (result) => {
        expect(result.start).toBeDate(new Date("2024-03-11T08:00:00Z"));
    });

    testSingleCase(chrono, "1 business day ago", sunday, (result) => {
        expect(result.start).toBeDate(new Date("2024-03-08T08:00:00Z"));
    });
});

test("Test - Business day result merged with a following time", () => {
    testSingleCase(chrono, "in 2 business days at 5pm", REFERENCE_DATE, (result, text) => {
        expect(result.text).toBe(text);
        expect(result.start).toBeDate(new Date("2024-03-12T17:00:00Z"));
    });

    testSingleCase(chrono, "next business day at 9am", REFERENCE_DATE, (result, text) => {
        expect(result.text).toBe(text);
        expect(result.start).toBeDate(new Date("2024-03-11T09:00:00Z"));
    });
});

test("Test - Time implication matches the plain 'in N days' behavior", () => {
    // Without an explicit time, the reference time is implied (08:00 here), and hour is not certain.
    testSingleCase(chrono, "in 3 business days", REFERENCE_DATE, (result) => {
        expect(result.start.get("hour")).toBe(8);
        expect(result.start.get("minute")).toBe(0);
        expect(result.start.isCertain("hour")).toBe(false);
        expect(result.start.isCertain("day")).toBe(true);
        expect(result.start.get("weekday")).toBe(Weekday.WEDNESDAY);
    });
});

test("Test - Custom weekendDays option (Friday/Saturday)", () => {
    const options = { weekendDays: [Weekday.FRIDAY, Weekday.SATURDAY] };

    // Friday is itself a weekend day here.
    testSingleCase(chrono, "in 1 business day", REFERENCE_DATE, options, (result) => {
        expect(result.start).toBeDate(new Date("2024-03-10T08:00:00Z"));
        expect(result.start.get("weekday")).toBe(Weekday.SUNDAY);
    });

    testSingleCase(chrono, "in 3 business days", REFERENCE_DATE, options, (result) => {
        expect(result.start).toBeDate(new Date("2024-03-12T08:00:00Z"));
        expect(result.start.get("weekday")).toBe(Weekday.TUESDAY);
    });

    testSingleCase(chrono, "next business day", REFERENCE_DATE, options, (result) => {
        expect(result.start).toBeDate(new Date("2024-03-10T08:00:00Z"));
    });

    testSingleCase(chrono, "2 business days ago", REFERENCE_DATE, options, (result) => {
        expect(result.start).toBeDate(new Date("2024-03-06T08:00:00Z"));
        expect(result.start.get("weekday")).toBe(Weekday.WEDNESDAY);
    });
});

test("Test - Business day offset relative to an absolute date", () => {
    // Ref Friday 03-08; "Friday" without a modifier resolves to the closest Friday (today, 12:00),
    // so 2 business days before = Wednesday 03-06.
    testSingleCase(chrono, "2 business days before Friday", REFERENCE_DATE, (result) => {
        expect(result.text).toBe("2 business days before Friday");
        expect(result.start.get("weekday")).toBe(Weekday.WEDNESDAY);
        expect(result.start).toBeDate(new Date("2024-03-06T12:00:00Z"));
    });

    // "next Friday" from a Friday reference is 03-15; 2 business days before = Wednesday 03-13
    testSingleCase(chrono, "2 business days before next Friday", REFERENCE_DATE, (result) => {
        expect(result.text).toBe("2 business days before next Friday");
        expect(result.start.get("weekday")).toBe(Weekday.WEDNESDAY);
        expect(result.start).toBeDate(new Date("2024-03-13T12:00:00Z"));
    });

    // Next Monday = 03-11; 3 business days after = Thursday 03-14
    testSingleCase(chrono, "3 business days after next Monday", REFERENCE_DATE, (result) => {
        expect(result.text).toBe("3 business days after next Monday");
        expect(result.start.get("weekday")).toBe(Weekday.THURSDAY);
        expect(result.start).toBeDate(new Date("2024-03-14T12:00:00Z"));
    });
});

test("Test - Invalid weekendDays option throws", () => {
    expect(() => chrono.parse("in 3 business days", REFERENCE_DATE, { weekendDays: [] })).toThrow(/weekendDays/);
    expect(() => chrono.parseDate("in 3 business days", REFERENCE_DATE, { weekendDays: [] })).toThrow(/weekendDays/);
    expect(() =>
        chrono.parse("in 3 business days", REFERENCE_DATE, {
            weekendDays: [
                Weekday.SUNDAY,
                Weekday.MONDAY,
                Weekday.TUESDAY,
                Weekday.WEDNESDAY,
                Weekday.THURSDAY,
                Weekday.FRIDAY,
                Weekday.SATURDAY,
            ],
        })
    ).toThrow(/weekendDays/);
});

test("Test - Existing expressions are unaffected", () => {
    testSingleCase(chrono, "in 3 days", REFERENCE_DATE, (result) => {
        expect(result.start).toBeDate(new Date("2024-03-11T08:00:00Z"));
    });

    testSingleCase(chrono, "next weekday", REFERENCE_DATE, (result) => {
        expect(result.text).toBe("next weekday");
        expect(result.start.get("weekday")).toBe(Weekday.MONDAY);
    });

    testSingleCase(chrono, "next week", REFERENCE_DATE, (result) => {
        expect(result.start.get("day")).toBe(15);
    });
});

test("Test - Negative cases", () => {
    testUnexpectedResult(chrono, "business day");
    testUnexpectedResult(chrono, "business days ago");
    testUnexpectedResult(chrono, "in business days");
});
