# Payroll Calculation Rules

This document explains the current wage calculation behavior.

## Time Units

The app calculates working time in minutes.

Core references:

- `timeToMinutes`
- `formatMinutes`
- `calculateAttendance`

## Gross Work Minutes

Gross work minutes are calculated as:

```text
check-out time - check-in time
```

For present and half-day records, both check-in and check-out are required.

## Break Minutes

Break minutes are calculated as the sum of:

```text
break end time - break start time
```

Break rules:

- Break end must be after break start.
- Breaks must be inside the check-in/check-out range.
- Breaks cannot overlap.

## Net Working Minutes

Net working minutes are calculated as:

```text
gross work minutes - total break minutes
```

## Overtime Minutes

Overtime minutes are calculated as:

```text
net working minutes - standard working minutes
```

If overtime is disabled in settings, overtime minutes are zero.

## Hourly Wage

Hourly wage uses:

```text
regular minutes * hourly rate / 60
```

Overtime pay is added separately when applicable.

## Daily Wage

Daily wage depends on the setting:

- Prorated: daily wage is prorated based on regular minutes compared with standard minutes.
- Full-day: full daily wage is paid when any net working time exists.

## Task-Based Wage

Task pay uses:

```text
task units * task rate
```

If a task rate override is entered on an attendance record, the override is used for that record.

## Allowance

Daily allowance/extra is added when net working minutes are greater than zero.

## Total Wage

Total wage is:

```text
regular pay + overtime pay + task pay + allowance
```

