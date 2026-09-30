(function (root) {
  "use strict";

  function createUiFeedback(options) {
    options = options || {};
    var toast = options.toast;
    var documentObject = options.document || document;
    var windowObject = options.window || root;
    var toastTimer = 0;

    function showToast(message) {
      toast.textContent = message;
      toast.classList.add("show");
      windowObject.clearTimeout(toastTimer);
      toastTimer = windowObject.setTimeout(function () {
        toast.classList.remove("show");
      }, 3200);
    }

    function showError(error) {
      console.error(error);
      showToast(error && error.message ? error.message : "Something went wrong.");
    }

    function getFieldContainer(field) {
      return field.closest("label") || field.parentElement || field;
    }

    function setFieldError(field, message) {
      if (!field) return;
      var container = getFieldContainer(field);
      var errorNode = container.querySelector('.field-error[data-for="' + (field.id || container.id || "field") + '"]');
      if (!errorNode) {
        errorNode = documentObject.createElement("div");
        errorNode.className = "field-error";
        errorNode.dataset.for = field.id || container.id || "field";
        container.appendChild(errorNode);
      }
      errorNode.textContent = message;
      field.classList.add("input-error");
      field.setAttribute("aria-invalid", "true");
      container.classList.add("label-error");
    }

    function clearFieldError(field) {
      if (!field) return;
      var container = getFieldContainer(field);
      var selector = '.field-error[data-for="' + (field.id || container.id || "field") + '"]';
      var errorNode = container.querySelector(selector);
      if (errorNode) errorNode.remove();
      field.classList.remove("input-error");
      field.removeAttribute("aria-invalid");
      if (!container.querySelector(".field-error")) container.classList.remove("label-error");
    }

    function clearFormErrors(form) {
      if (!form) return;
      form.querySelectorAll(".field-error").forEach(function (node) { node.remove(); });
      form.querySelectorAll(".input-error").forEach(function (field) {
        field.classList.remove("input-error");
        field.removeAttribute("aria-invalid");
      });
      form.querySelectorAll(".label-error").forEach(function (node) {
        node.classList.remove("label-error");
      });
    }

    function reportValidation(field, message) {
      setFieldError(field, message);
      showToast(message);
      if (field && field.focus) field.focus();
      return null;
    }

    function bindValidationListeners(form) {
      if (!form) return;
      form.addEventListener("input", function (event) {
        if (event.target && event.target.form === form) clearFieldError(event.target);
      });
      form.addEventListener("change", function (event) {
        if (event.target && event.target.form === form) clearFieldError(event.target);
      });
    }

    return {
      showToast: showToast,
      showError: showError,
      reportValidation: reportValidation,
      setFieldError: setFieldError,
      clearFieldError: clearFieldError,
      clearFormErrors: clearFormErrors,
      bindValidationListeners: bindValidationListeners
    };
  }

  root.WorkPayUiFeedback = {
    createUiFeedback: createUiFeedback
  };
}(typeof self !== "undefined" ? self : window));
