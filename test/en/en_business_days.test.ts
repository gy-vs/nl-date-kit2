import * as chrono from "../../src";
import { Weekday } from "../../src";
import { testSingleCase, testUnexpectedResult } from "../test_util";

// Friday 2024-03-08 08:00 (UTC in CI)
const refDate = new Date(2024, 3 - 1, 8, 8, 0);

test("Test - Business day expression with in/within prefix", () => {
    testSingleCase(chrono, "will ship in 3 business days", refDate, (result, text) => {
        expect(result.index).toBe(10);
        expect(result.text).toBe("in 3 business days");
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 13, 8, 0));
        expect(result.tags()).toContain("result/relativeDate");
    });

    testSingleCase(chrono, "payment due within 10 working days", refDate, (result) => {
        expect(result.text).toBe("within 10 working days");
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 22, 8, 0));
    });

    testSingleCase(chrono, "in 1 business day", refDate, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 11, 8, 0));
    });

    testSingleCase(chrono, "in 1 working day", refDate, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 11, 8, 0));
    });

    testSingleCase(chrono, "in three business days", refDate, (result) => {
        expect(result.text).toBe("in three business days");
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 13, 8, 0));
    });

    testSingleCase(chrono, "within ten working days", refDate, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 22, 8, 0));
    });

    testSingleCase(chrono, "for 5 business days", refDate, (result) => {
        expect(result.text).toBe("for 5 business days");
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 15, 8, 0));
    });
});

test("Test - Business day expression with ago suffix", () => {
    testSingleCase(chrono, "the invoice was issued 2 business days ago", refDate, (result) => {
        expect(result.index).toBe(23);
        expect(result.text).toBe("2 business days ago");
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 6, 8, 0));
    });

    testSingleCase(chrono, "3 working days ago", refDate, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 5, 8, 0));
    });

    testSingleCase(chrono, "two business days before", refDate, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 6, 8, 0));
    });

    testSingleCase(chrono, "5 working days earlier", refDate, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 1, 8, 0));
    });
});

test("Test - Business day expression with later/after suffix", () => {
    testSingleCase(chrono, "3 business days later", refDate, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 13, 8, 0));
    });

    testSingleCase(chrono, "3 working days after", refDate, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 13, 8, 0));
    });

    testSingleCase(chrono, "3 business days from now", refDate, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 13, 8, 0));
    });
});

test("Test - Next/last business day expression", () => {
    testSingleCase(chrono, "we'll reply next business day", refDate, (result) => {
        expect(result.text).toBe("next business day");
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 11, 8, 0));
    });

    testSingleCase(chrono, "next working day", refDate, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 11, 8, 0));
    });

    testSingleCase(chrono, "last business day", refDate, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 7, 8, 0));
    });

    testSingleCase(chrono, "past working day", refDate, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 7, 8, 0));
    });
});

test("Test - Next business day when the reference date is on the weekend", () => {
    // Saturday 2024-03-09 -> next business day is Monday 2024-03-11
    testSingleCase(chrono, "next business day", new Date(2024, 3 - 1, 9, 8, 0), (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 11, 8, 0));
    });

    // Sunday 2024-03-10 -> next business day is Monday 2024-03-11
    testSingleCase(chrono, "next business day", new Date(2024, 3 - 1, 10, 8, 0), (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 11, 8, 0));
    });

    // From a Saturday, "in 1 business day" also skips the weekend
    testSingleCase(chrono, "in 1 business day", new Date(2024, 3 - 1, 9, 8, 0), (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 11, 8, 0));
    });

    // "2 business days ago" from a Sunday skips the weekend itself and lands
    // on Thursday 2024-03-07 (1 business day ago is Friday 2024-03-08)
    testSingleCase(chrono, "2 business days ago", new Date(2024, 3 - 1, 10, 8, 0), (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 7, 8, 0));
    });
});

test("Test - Business day expression with time merges into a single result", () => {
    testSingleCase(chrono, "in 2 business days at 5pm", refDate, (result, text) => {
        expect(result.text).toBe(text);
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 12, 17, 0));
        expect(result.start.get("hour")).toBe(17);
        expect(result.start.get("minute")).toBe(0);
    });

    testSingleCase(chrono, "next business day at 9am", refDate, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 11, 9, 0));
    });

    testSingleCase(chrono, "3 business days ago at 5pm", refDate, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 5, 17, 0));
    });
});

test("Test - Business day time implication matches the normal relative day expression", () => {
    const refWithTime = new Date(2024, 3 - 1, 8, 13, 30);

    testSingleCase(chrono, "in 3 business days", refWithTime, (result) => {
        expect(result.start.get("hour")).toBe(13);
        expect(result.start.get("minute")).toBe(30);
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 13, 13, 30));
    });

    testSingleCase(chrono, "in 3 days", refWithTime, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 11, 13, 30));
    });

    testSingleCase(chrono, "2 business days ago", refWithTime, (result) => {
        expect(result.start.get("hour")).toBe(13);
        expect(result.start.get("minute")).toBe(30);
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 6, 13, 30));
    });
});

test("Test - Business day component certainty", () => {
    testSingleCase(chrono, "in 3 business days", refDate, (result) => {
        expect(result.start.isCertain("year")).toBeTruthy();
        expect(result.start.isCertain("month")).toBeTruthy();
        expect(result.start.isCertain("day")).toBeTruthy();
        expect(result.start.isCertain("weekday")).toBeTruthy();
        expect(result.start.isCertain("hour")).toBeFalsy();
        expect(result.start.isCertain("minute")).toBeFalsy();
        expect(result.start.get("weekday")).toBe(Weekday.WEDNESDAY);
    });
});

test("Test - Custom weekendDays option (Friday-Saturday weekend)", () => {
    const options = { weekendDays: [Weekday.FRIDAY, Weekday.SATURDAY] };

    // From Friday 2024-03-08, Sunday is the next working day
    testSingleCase(chrono, "next business day", refDate, options, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 10, 8, 0));
    });

    testSingleCase(chrono, "in 1 business day", refDate, options, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 10, 8, 0));
    });

    testSingleCase(chrono, "in 3 business days", refDate, options, (result) => {
        // Sunday, Monday, Tuesday
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 12, 8, 0));
    });

    testSingleCase(chrono, "2 business days ago", refDate, options, (result) => {
        // Wednesday, Thursday
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 6, 8, 0));
    });

    testSingleCase(chrono, "within 10 working days", refDate, options, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 21, 8, 0));
    });
});

test("Test - Duplicated weekendDays values are tolerated", () => {
    const options = { weekendDays: [Weekday.SATURDAY, Weekday.SUNDAY, Weekday.SATURDAY] };
    testSingleCase(chrono, "in 3 business days", refDate, options, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 13, 8, 0));
    });
});

test("Test - Invalid weekendDays option throws", () => {
    expect(() => chrono.parse("in 3 business days", refDate, { weekendDays: [] })).toThrow(/weekendDays/);

    expect(() => chrono.parse("in 3 business days", refDate, { weekendDays: [0, 1, 2, 3, 4, 5, 6] })).toThrow(
        /weekendDays/
    );

    expect(() => chrono.parseDate("in 3 business days", refDate, { weekendDays: [] })).toThrow(/weekendDays/);

    expect(() => chrono.parse("in 3 business days", refDate, { weekendDays: [7 as Weekday] })).toThrow(/weekendDays/);
});

test("Test - Business day expression in strict mode", () => {
    testSingleCase(chrono.strict, "in 3 business days", refDate, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 13, 8, 0));
    });

    testSingleCase(chrono.strict, "2 business days ago", refDate, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 6, 8, 0));
    });

    testSingleCase(chrono.strict, "3 working days later", refDate, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 13, 8, 0));
    });

    testSingleCase(chrono.strict, "within 10 working days", refDate, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 22, 8, 0));
    });

    // The modifier-only casual phrases are not recognized in strict mode
    testUnexpectedResult(chrono.strict, "next business day", refDate);
    testUnexpectedResult(chrono.strict, "last business day", refDate);
});

test("Test - Existing expressions keep their behavior unchanged", () => {
    testSingleCase(chrono, "in 3 days", refDate, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 11, 8, 0));
    });

    testSingleCase(chrono, "next week", refDate, (result) => {
        expect(result.start.get("day")).toBe(15);
    });

    testSingleCase(chrono, "next weekday", refDate, (result) => {
        expect(result.start).toBeDate(new Date(2024, 3 - 1, 11, 12, 0));
    });
});
