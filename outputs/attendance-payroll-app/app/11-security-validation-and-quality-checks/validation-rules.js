(function (root) {
  "use strict";

  function numberValue(value, fallback) {
    if (root.WorkPayShared && root.WorkPayShared.numberValue) return root.WorkPayShared.numberValue(value, fallback);
    var num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  function validateWorkerWageConfig(worker) {
    if ((worker.wageType === "hourly" || worker.wageType === "daily") && numberValue(worker.standardHours, 0) <= 0) {
      return { ok: false, fieldKey: "standardHours", message: "Standard hours must be greater than zero for hourly or daily wages." };
    }
    if (worker.wageType === "hourly" && numberValue(worker.hourlyRate, 0) <= 0) {
      return { ok: false, fieldKey: "hourlyRate", message: "Hourly workers need an hourly rate greater than zero." };
    }
    if (worker.wageType === "daily" && numberValue(worker.dailyRate, 0) <= 0) {
      return { ok: false, fieldKey: "dailyRate", message: "Daily workers need a daily rate greater than zero." };
    }
    if (worker.wageType === "task" && numberValue(worker.taskRate, 0) <= 0) {
      return { ok: false, fieldKey: "taskRate", message: "Task-based workers need a task rate greater than zero." };
    }
    if (numberValue(worker.overtimeRate, 0) < 0 || numberValue(worker.allowance, 0) < 0) {
      return { ok: false, fieldKey: "overtimeRate", message: "Overtime and allowance values cannot be negative." };
    }
    return { ok: true };
  }

  root.WorkPayValidation = {
    validateWorkerWageConfig: validateWorkerWageConfig
  };
}(typeof self !== "undefined" ? self : window));
