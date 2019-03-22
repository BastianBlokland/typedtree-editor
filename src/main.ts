/**
 * @file Entry point, responsible for initialization and starting the app logic.
 */

import * as App from "./app";
import * as Display from "./display";

// Register serviceworker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("serviceworker.js").then(reg => {
        console.log("Serviceworker registered");
    }).catch(error => {
        console.log(`Serviceworker registration failed: '${error}'`);
    });
} else {
    console.warn("Serviceworker registration failed: not supported");
}

// Initialize dom elements.
Display.Svg.initialize();
Display.TreeScheme.initialize();

// Export functions to window for interop.
(window as any).getCurrentSchemeJson = App.getCurrentSchemeJson;
(window as any).getCurrentTreeJson = App.getCurrentTreeJson;

// Starting running the app.
App.run();
