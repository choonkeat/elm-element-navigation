function locationObject(loc) {
    return { protocol : loc.protocol
           , host : loc.hostname
           , port_ : loc.port
           , pathname : loc.pathname
           , search : loc.search
           , hash : loc.hash
           }
}
function generateSpaFlags() {
  return {
      location: locationObject(window.location),
      navKey: Math.random()
  }
}
function extBrowserSetup(app, spaFlags, document, ele) {
    function isChild(node) {
        if (node === ele) return true;
        return (node && isChild(node.parentNode));
    }
    ele.addEventListener("click", function(event) {
        if (event.metaKey || event.ctrlKey) return;
        if (! (event.target && event.target.href)) return;
        if (event.target.target || !isChild(event.target)) return;
        event.preventDefault();
        app.ports.onLocationRequest.send([locationObject(window.location), locationObject(event.target)]);
    }, false);
    window.addEventListener("popstate", function(event) {
        app.ports.onLocationChange.send(locationObject(window.location));
    }, false);
    if (app.ports.pushUrl) app.ports.pushUrl.subscribe(function(args) {
        if (args[0] !== spaFlags.navKey) return;
        history.pushState({}, '', args[1]);
        app.ports.onLocationChange.send(locationObject(window.location));
    });
    if (app.ports.replaceUrl) app.ports.replaceUrl.subscribe(function(args) {
        if (args[0] !== spaFlags.navKey) return;
        history.replaceState({}, '', args[1]);
        app.ports.onLocationChange.send(locationObject(window.location));
    });
    if (app.ports.back) app.ports.back.subscribe(function(args) {
        if (args[0] !== spaFlags.navKey) return;
        history.go(-args[1]);
        app.ports.onLocationChange.send(locationObject(window.location));
    });
    if (app.ports.forward) app.ports.forward.subscribe(function(args) {
        if (args[0] !== spaFlags.navKey) return;
        history.go(args[1]);
        app.ports.onLocationChange.send(locationObject(window.location));
    });

    var cachedPageTitle = document.title;
    if (app.ports.setPageTitle) app.ports.setPageTitle.subscribe(function(pageTitle) {
        if (cachedPageTitle !== pageTitle) document.title = cachedPageTitle = pageTitle;
    });
}
