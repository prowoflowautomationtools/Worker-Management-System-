(function (root) {
  "use strict";

  function createNavigationController(options) {
    options = options || {};
    var documentObject = options.document || document;
    var setCookie = options.setCookie;
    var sessionStorageRules = options.sessionStorageRules;
    var getState = options.getState;
    var viewTitle = options.viewTitle;
    var onReportsRequested = options.onReportsRequested;

    function switchView(view) {
      if (!documentObject.getElementById(view)) view = "dashboard";
      var state = getState();
      state.activeView = view;
      sessionStorageRules.saveActiveView("workpay.activeView", view);
      setCookie("workpayView", view, 30);
      documentObject.querySelectorAll(".view").forEach(function (element) {
        element.classList.toggle("active-view", element.id === view);
      });
      documentObject.querySelectorAll(".nav-item").forEach(function (button) {
        button.classList.toggle("active", button.dataset.view === view);
        if (button.dataset.view === view) {
          button.setAttribute("aria-current", "page");
        } else {
          button.removeAttribute("aria-current");
        }
      });
      var activeNavItem = documentObject.querySelector('.nav-item[data-view="' + view + '"]');
      if (activeNavItem) viewTitle.textContent = activeNavItem.textContent;
      documentObject.title = viewTitle.textContent + " | WorkPay India";
      if (view === "reports" && onReportsRequested) onReportsRequested(true);
      return view;
    }

    return { switchView: switchView };
  }

  root.WorkPayNavigation = {
    createNavigationController: createNavigationController
  };
}(typeof self !== "undefined" ? self : window));
