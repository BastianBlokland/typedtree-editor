// Polyfill missing features
import * as ES6Promise from "es6-promise";
ES6Promise.polyfill();

// Initialize dom elements
import * as Display from "./display";
Display.initialize();

// Starting running the app
import * as App from "./app";
App.run();
