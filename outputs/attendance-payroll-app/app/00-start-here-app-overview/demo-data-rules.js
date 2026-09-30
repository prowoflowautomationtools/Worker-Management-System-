(function (root) {
  "use strict";

  function buildDemoData(options) {
    options = options || {};
    var makeId = options.makeId;
    var calculateAttendance = options.calculateAttendance;
    var getDayName = options.getDayName;
    var now = options.now || function () { return new Date().toISOString(); };
    var today = options.today;
    var yesterday = options.yesterday;
    var workers = [
      {
        id: makeId(), name: "Ramesh Kumar", phone: "9876543210", whatsapp: "9876543210", email: "",
        website: "", otherContact: "Site A supervisor: Manoj", type: "Mason", wageType: "daily",
        standardHours: 8, hourlyRate: 0, dailyRate: 900, overtimeRate: 150, taskRate: 0, allowance: 50,
        compensationNotes: "Daily wage with lunch allowance.", createdAt: now(), updatedAt: now()
      },
      {
        id: makeId(), name: "Sita Devi", phone: "9123456780", whatsapp: "9123456780", email: "",
        website: "", otherContact: "", type: "Helper", wageType: "hourly",
        standardHours: 8, hourlyRate: 90, dailyRate: 0, overtimeRate: 130, taskRate: 0, allowance: 0,
        compensationNotes: "Hourly helper rate.", createdAt: now(), updatedAt: now()
      },
      {
        id: makeId(), name: "Imran Shaikh", phone: "9988776655", whatsapp: "9988776655", email: "",
        website: "", otherContact: "", type: "Painter", wageType: "task",
        standardHours: 8, hourlyRate: 0, dailyRate: 0, overtimeRate: 120, taskRate: 35, allowance: 0,
        compensationNotes: "Paid per square metre completed.", createdAt: now(), updatedAt: now()
      }
    ];

    function makeAttendanceSeed(worker, date, checkIn, checkOut, breaks, taskUnits) {
      var record = {
        id: makeId(), workerId: worker.id, date: date, day: getDayName(date), status: "present",
        checkIn: checkIn, checkOut: checkOut, breaks: breaks, taskUnits: taskUnits,
        taskRateOverride: null, notes: "Demo record", createdAt: now(), updatedAt: now()
      };
      record.calculation = calculateAttendance(record, worker);
      return record;
    }

    return {
      workers: workers,
      attendance: [
        makeAttendanceSeed(workers[0], today, "08:45", "18:15", [{ startTime: "13:00", endTime: "13:45", type: "Lunch", note: "" }], 0),
        makeAttendanceSeed(workers[1], today, "09:05", "17:30", [{ startTime: "11:00", endTime: "11:15", type: "Tea", note: "" }, { startTime: "13:15", endTime: "14:00", type: "Lunch", note: "" }], 0),
        makeAttendanceSeed(workers[2], yesterday, "09:00", "16:30", [{ startTime: "13:00", endTime: "13:30", type: "Lunch", note: "" }], 42)
      ],
      leaveRecords: [{
        id: makeId(), workerId: "", type: "festival-holiday", startDate: today, endDate: today,
        reason: "Regional festival/site holiday marker for planning.", attachment: null,
        createdAt: now(), updatedAt: now()
      }]
    };
  }

  root.WorkPayDemoData = { buildDemoData: buildDemoData };
}(typeof self !== "undefined" ? self : window));
