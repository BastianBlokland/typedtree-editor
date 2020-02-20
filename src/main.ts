/**
 * @file Entry point, responsible for initialization and starting the app logic.
 */

import * as App from "./app";
import * as Display from "./display";

// If we are running on 'http' then redirect to 'https'.
if (location.protocol !== "https:" && !location.host.startsWith("127.0.0.1")) {
    console.log("Detected 'http' protocol: redirecting to 'https'");
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
} else {

    // Register serviceworker.
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
    (window as any).getCurrentPackJson = App.getCurrentPackJson;
    (window as any).getShareUrl = App.getShareUrl;
    (window as any).enqueueLoadScheme = App.enqueueLoadScheme;
    (window as any).enqueueLoadSchemeFromUrlOrFile = App.enqueueLoadSchemeFromUrlOrFile;
    (window as any).enqueueEnsureTree = App.enqueueEnsureTree;
    (window as any).enqueueNewTree = App.enqueueNewTree;
    (window as any).enqueueLoadTree = App.enqueueLoadTree;
    (window as any).enqueueLoadTreeFromUrlOrFile = App.enqueueLoadTreeFromUrlOrFile;
    (window as any).enqueueExportScheme = App.enqueueExportScheme;
    (window as any).enqueueExportTree = App.enqueueExportTree;
    (window as any).enqueueExportPack = App.enqueueExportPack;
    (window as any).enqueueCopyTreeToClipboard = App.enqueueCopyTreeToClipboard;
    (window as any).enqueuePasteTree = App.enqueuePasteTree;
    (window as any).enqueueShareToClipboard = App.enqueueShareToClipboard;
    (window as any).enqueueUndo = App.enqueueUndo;
    (window as any).enqueueRedo = App.enqueueRedo;

    // Parse the search-params from the url and cleanup browser url.
    const url = new URL(location.href);
    const searchParams = url.searchParams;
    history.replaceState("", "", url.origin + url.pathname.replace("index.html", ""));

    // Starting running the app.
    App.run(searchParams);
}
