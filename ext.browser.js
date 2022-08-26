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
    function isContentEditable(node) {
        if (!node) return false;
        return (
          node.contentEditable === 'true' ||
          node.contentEditable === true   ||
          isContentEditable(node.parentNode)
        );
    }
    // elm only handles http https links. e.g. leave mailto: alone
    function httpxNode(node) {
        if (!node || (node.href && typeof node.href.startsWith == 'function' && node.href.startsWith('http'))) return node;
        return httpxNode(node.parentNode);
    }
    ele.addEventListener("click", function(event) {
        if (isContentEditable(event.target)) {
            event.preventDefault();
            return false;
        }
        if (event.metaKey || event.ctrlKey) return;
        const anchorTag = httpxNode(event.target);
        if (!anchorTag) return;
        if (anchorTag.target || !isChild(anchorTag)) return;
        event.preventDefault();
        app.ports.onLocationRequest.send([locationObject(window.location), locationObject(anchorTag)]);
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

    // against more aggressive extensions, we may need to detect their presence
    // and move their nodes to the back of the parent node to avoid tripping up the virtual dom
    //
    function badNode(n) {
        return (
            // please extend this list...
            "GRAMMARLY-EXTENSION" === n.tagName ||
            "StayFocusd-infobar" === n.id ||
            (n.className && n.className.match(/cvox_indicator_container/))
        );
    }
    const config = { attributes: false, childList: true, subtree: true };
    const callback = function(mutationsList, observer) {
        for (var i in mutationsList) {
            let m = mutationsList[i];
            for (var j = (m.addedNodes.length-1); j >= 0; j--) {
                let n = m.addedNodes[j];
                if (n.movedByMutationObserver) continue;
                if (badNode(n)) {
                    console.log('moved', n);
                    n.movedByMutationObserver = true;
                    m.target.appendChild(n)
                }
            }
        }
    };
    const observer = new MutationObserver(callback);
    observer.observe(ele, config);
}
