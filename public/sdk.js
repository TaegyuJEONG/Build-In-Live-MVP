// Build In Live - Project Integration SDK
// Inject this into your website's <head> or <body> to enable live marker sync
(function() {
  console.log('[BUILD IN LIVE SDK] Booting up...');
  
  // Get project config from script tag
  const scriptTag = document.currentScript;
  const projectId = scriptTag ? scriptTag.getAttribute('data-project-id') : null;
  console.log(`[BUILD IN LIVE SDK] Project ID: ${projectId}`);
  
  // Only run if loaded inside an iframe (like the Build_In_Live workspace)
  if (window === window.parent) {
    console.log('[BUILD IN LIVE SDK] Not in an iframe.');
    // Optional: Add a "Give Feedback" floating button here in the future
    return;
  }
  
  let lastScrollY = -1;
  let lastPathname = "";

  let cachedScrollElement = null;

  function getScrollOffset() {
    // Fast path: if we already found the element that scrolls, use it.
    if (cachedScrollElement && cachedScrollElement.scrollTop > 0) {
      return cachedScrollElement.scrollTop;
    }

    let scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
    
    if (scrollY === 0) {
      // Fast checks on common Next.js/React layout roots
      const rootElements = [
        document.getElementById('__next'),
        document.getElementById('root'),
        document.body.firstElementChild,
        document.querySelector('.portfolio-wrapper'),
        document.querySelector('.main-container'),
        document.querySelector('.right-side'),
        document.querySelector('.projects-content-left'),
        document.querySelector('.projects-box-content')
      ];
      
      for (let i = 0; i < rootElements.length; i++) {
        const el = rootElements[i];
        if (el && el.scrollTop > scrollY) {
          scrollY = el.scrollTop;
          cachedScrollElement = el;
        }
      }
      
      // If still 0, scan all elements quickly (only checking numerical scrollTop, no style calculation)
      if (scrollY === 0) {
        const all = document.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
          if (all[i].scrollTop > scrollY) {
            scrollY = all[i].scrollTop;
            cachedScrollElement = all[i];
          }
        }
      }
    } else {
      cachedScrollElement = window;
    }
    
    return scrollY || 0;
  }

  function syncLoop() {
    const currentScrollY = getScrollOffset();
    const currentPathname = window.location.pathname;

    if (currentScrollY !== lastScrollY || currentPathname !== lastPathname) {
      console.log(`[BUILD IN LIVE SDK] Sending sync: Y=${currentScrollY}, path=${currentPathname}`);
      lastScrollY = currentScrollY;
      lastPathname = currentPathname;
      
      window.parent.postMessage({
        type: 'BUILD_IN_LIVE_SYNC',
        scrollY: currentScrollY,
        pathname: currentPathname
      }, '*');
    }
    
    requestAnimationFrame(syncLoop);
  }

  function handleHashScroll() {
    try {
      const hash = window.location.hash;
      if (hash && hash.includes('bil_scroll=')) {
        const match = hash.match(/bil_scroll=(\d+)/);
        if (match && match[1]) {
          const targetY = parseInt(match[1], 10);
          console.log(`[BUILD IN LIVE SDK] Hash scroll detected: ${targetY}`);
          setTimeout(() => {
            const scrollOptions = { top: targetY, behavior: 'smooth' };
            const currentScroll = getScrollOffset(); // initialize cache
            if (cachedScrollElement && cachedScrollElement !== window) {
              cachedScrollElement.scrollTo(scrollOptions);
            } else {
              window.scrollTo(scrollOptions);
            }
          }, 300); // Give layout a moment to settle
        }
      }
    } catch (e) { console.error(e); }
  }

  if (document.readyState === 'complete') {
    console.log('[BUILD IN LIVE SDK] Ready. Starting loop.');
    handleHashScroll();
    syncLoop();
  } else {
    window.addEventListener('load', () => {
      console.log('[BUILD IN LIVE SDK] Window loaded. Starting loop.');
      handleHashScroll();
      syncLoop();
    });
  }

  // Handle scroll commands from parent
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'BUILD_IN_LIVE_SCROLL') {
      const targetY = e.data.scrollY || 0;
      console.log(`[BUILD IN LIVE SDK] Scrolling to ${targetY}`);
      
      const scrollOptions = { top: targetY, behavior: 'smooth' };
      
      if (cachedScrollElement && cachedScrollElement !== window) {
        cachedScrollElement.scrollTo(scrollOptions);
      } else {
        window.scrollTo(scrollOptions);
      }
    }
  });
})();
