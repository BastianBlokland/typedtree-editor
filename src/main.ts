/**
 * @file Entry point, responsible for initialization and starting the app logic.
 */

import * as App from "./app";
import * as SvgDisplay from "./svg.display";
import * as TreeScheme from "./treescheme";

// Initialize dom elements.
SvgDisplay.initialize();
TreeScheme.Display.initialize();

// Export functions to window for interop.
(window as any).getCurrentSchemeJson = App.getCurrentSchemeJson;
(window as any).getCurrentTreeJson = App.getCurrentTreeJson;

// Starting running the app.
App.run();
