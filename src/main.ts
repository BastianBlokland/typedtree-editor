/**
 * @file Entry point, responsible for initialization and starting the app logic.
 */

import * as App from "./app";
import * as SvgDisplay from "./svg.display";
import * as TreeSchemeDisplay from "./treescheme.display";

// Initialize dom elements
SvgDisplay.initialize();
TreeSchemeDisplay.initialize();

// Starting running the app
App.run();
