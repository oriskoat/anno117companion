'use strict';
// Android can deliver a bundled snapshot while later classic scripts are still
// parsing. Reconcile once after every feature module has registered its hooks.
if(snapshot)model();
render(true);
window.localizeUI?.();
window.updateModeSwitch?.();
