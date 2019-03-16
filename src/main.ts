/**
 * @file Entry point, responsible for initialization and starting the app logic.
 */

import * as App from "./app";
import * as Display from "./display";

// Initialize dom elements.
Display.Svg.initialize();
Display.TreeScheme.initialize();

// Export functions to window for interop.
(window as any).getCurrentSchemeJson = App.getCurrentSchemeJson;
(window as any).getCurrentTreeJson = App.getCurrentTreeJson;

// Starting running the app.
App.run();
