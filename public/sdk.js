// Build In Live - Project Integration SDK v2.0 (Liveblocks Optimized)
// ⚠️ IMPORTANT: Inject this into your website's <head> or <body>
(function() {
  const SDK_LABEL = '[BUILD IN LIVE SDK]';
  console.log(`${SDK_LABEL} Initializing robust sync...`);
  
  // 1. Config extraction
  const scriptTag = document.currentScript;
  const projectId = scriptTag ? scriptTag.getAttribute('data-project-id') : 'unknown';
  
  // 2. Multi-level parent detection
  const parentWindow = (window.parent !== window) ? window.parent : (window.top !== window ? window.top : null);
  
  // Load html-to-image dynamically (Replacement for html2canvas to fix text alignment)
  const h2cScript = document.createElement('script');
  h2cScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js';
  h2cScript.crossOrigin = 'anonymous';
  document.head.appendChild(h2cScript);
  
  if (!parentWindow) {
    return;
  }

  // 3. Robust scrolling offset detection
  // Different sites use different elements for scroll (window, document, or a specific div)
  function getAbsoluteScrollY() {
    // Check window first
    let y = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
    
    // If y is still 0, look for common overflow-y: scroll wrappers
    if (y === 0) {
      const scrollableElements = [
        document.getElementById('__next'),
        document.getElementById('root'),
        document.querySelector('[data-scroll-container]'),
        document.querySelector('main'),
        document.body.firstElementChild
      ];
      
      for (const el of scrollableElements) {
        if (el && el.scrollTop > 0) {
          y = el.scrollTop;
          break;
        }
      }
    }
    return y || 0;
  }

  // 4. Throttled Mouse Tracking
  let lastX = -1, lastY = -1;
  let lastMoveTime = 0;
  
  // 5. Scroll & Pathname Sync Loop
  let lastSyncScrollY = -1;
  let lastSyncPathname = "";
  let lastSyncSearch = "";
  const MOVE_INTERVAL = 30; // ~33fps for smoothness and efficiency
  let activeAddClickHandler = null;
  let cursorStyleEl = null;

  function stopAddingMode() {
    const el = cursorStyleEl || document.getElementById('build-in-live-cursor-style');
    if (el) el.innerHTML = '';
    if (activeAddClickHandler) {
      window.removeEventListener('click', activeAddClickHandler, true);
      activeAddClickHandler = null;
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      stopAddingMode();
      parentWindow.postMessage({ type: 'BUILD_IN_LIVE_CANCEL_ADDING' }, '*');
    }
  }, true);

  window.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastMoveTime < MOVE_INTERVAL) return;
    
    const currentX = e.clientX;
    const currentY = e.clientY + getAbsoluteScrollY();

    // Only send if moved significantly or just started
    if (Math.abs(currentX - lastX) > 1 || Math.abs(currentY - lastY) > 1) {
      lastX = currentX;
      lastY = currentY;
      lastMoveTime = now;

      parentWindow.postMessage({
        type: 'BUILD_IN_LIVE_MOUSEMOVE',
        x: currentX,
        y: currentY,
        projectId: projectId
      }, '*');
    }
  }, { passive: true });

  function syncState() {
    const currentY = getAbsoluteScrollY();
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;

    if (currentY !== lastSyncScrollY || currentPath !== lastSyncPathname || currentSearch !== lastSyncSearch) {
      lastSyncScrollY = currentY;
      lastSyncPathname = currentPath;
      lastSyncSearch = currentSearch;

      parentWindow.postMessage({
        type: 'BUILD_IN_LIVE_SYNC',
        scrollY: currentY,
        pathname: currentPath,
        search: currentSearch
      }, '*');
    }
    requestAnimationFrame(syncState);
  }

  // 6. Unique Selector Generator
  function getUniqueSelector(el) {
    if (!(el instanceof Element)) return;
    const path = [];
    while (el.nodeType === Node.ELEMENT_NODE) {
      let selector = el.nodeName.toLowerCase();
      if (el.id) {
        selector += '#' + el.id;
        path.unshift(selector);
        break;
      } else {
        let sib = el, nth = 1;
        while (sib = sib.previousElementSibling) {
          if (sib.nodeName.toLowerCase() == selector) nth++;
        }
        if (nth != 1) selector += ":nth-of-type(" + nth + ")";
      }
      path.unshift(selector);
      el = el.parentNode;
    }
    return path.join(" > ");
  }

  // 7. Parent Command Listener
  window.addEventListener('message', (e) => {
    if (!e.data || !e.data.type) return;

    if (e.data.type === 'BUILD_IN_LIVE_STOP_ADDING') {
      stopAddingMode();
    }

    if (e.data.type === 'BUILD_IN_LIVE_SCROLL') {
      const targetY = e.data.scrollY || 0;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
      const wrappers = [document.documentElement, document.body, document.getElementById('__next')];
      wrappers.forEach(w => w?.scrollTo?.({ top: targetY, behavior: 'smooth' }));
    }

    if (e.data.type === 'BUILD_IN_LIVE_NAVIGATE') {
      const targetPath = e.data.pathname || '/';
      const targetSearch = e.data.search || '';
      const fullTarget = targetPath + targetSearch;
      
      if (window.location.pathname + window.location.search !== fullTarget) {
        window.location.href = fullTarget;
      }
    }

    if (e.data.type === 'BUILD_IN_LIVE_FOCUS_SELECTOR') {
      const selector = e.data.selector;
      if (!selector) return;
      
      try {
        const el = document.querySelector(selector);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Flash element for visual feedback
          const originalOutline = el.style.outline;
          el.style.outline = '4px solid #F95A56';
          setTimeout(() => el.style.outline = originalOutline, 2000);
        }
      } catch (err) {}
    }

    if (e.data.type === 'BUILD_IN_LIVE_GET_ELEMENT_RECTS') {
      const selectors = e.data.selectors || [];
      const rects = {};
      selectors.forEach(sel => {
        try {
          const el = document.querySelector(sel);
          if (el) {
            const rect = el.getBoundingClientRect();
            // We want screen-space relative to the window
            rects[sel] = {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              visible: rect.width > 0 && rect.height > 0
            };
          }
        } catch (err) {}
      });
      parentWindow.postMessage({
        type: 'BUILD_IN_LIVE_RECTS_SYNC',
        rects: rects
      }, '*');
    }

    if (e.data.type === 'BUILD_IN_LIVE_START_ADDING') {
      
      // Inject global cursor style to override everything
      if (!cursorStyleEl) {
        cursorStyleEl = document.getElementById('build-in-live-cursor-style');
        if (!cursorStyleEl) {
          cursorStyleEl = document.createElement('style');
          cursorStyleEl.id = 'build-in-live-cursor-style';
          cursorStyleEl.setAttribute('data-html2canvas-ignore', 'true');
          document.head.appendChild(cursorStyleEl);
        }
      }
      const cursorUrl = `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='16' cy='16' r='10' fill='%23F95A56' stroke='white' stroke-width='2'/%3E%3Cpath d='M16 26L16 30' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") 16 16, crosshair`;
      cursorStyleEl.innerHTML = `* { cursor: ${cursorUrl} !important; }`;

      const handleAddClick = (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        
        stopAddingMode();
        
        const el = clickEvent.target;
        const selector = getUniqueSelector(el);
        
        const xPercent = (clickEvent.clientX / window.innerWidth) * 100;
        const yPercent = (clickEvent.clientY / window.innerHeight) * 100;

        if (typeof htmlToImage !== 'undefined') {
          htmlToImage.toJpeg(document.documentElement, {
            quality: 0.8,
            backgroundColor: '#000000',
            filter: (node) => {
              if (node && node.hasAttribute && node.hasAttribute('data-html2canvas-ignore')) return false;
              const isSDK = node && node.className && typeof node.className === 'string' && (node.className.includes('build-in-live') || node.className.includes('FeedbackHandle'));
              const isSDKId = node && node.id && typeof node.id === 'string' && node.id.includes('build-in-live');
              if (isSDK || isSDKId) return false;
              return true;
            }
          }).then(screenshot => {
            parentWindow.postMessage({
              type: 'BUILD_IN_LIVE_ELEMENT_CLICK',
              selector,
              xPercent,
              yPercent,
              search: window.location.search,
              screenshot: screenshot,
              x: clickEvent.clientX,
              y: clickEvent.clientY + getAbsoluteScrollY()
            }, '*');
          }).catch(err => {
            parentWindow.postMessage({
              type: 'BUILD_IN_LIVE_ELEMENT_CLICK',
              selector,
              xPercent,
              yPercent,
              search: window.location.search,
              x: clickEvent.clientX,
              y: clickEvent.clientY + getAbsoluteScrollY()
            }, '*');
          });
        } else {
          // Fallback if lib not loaded
          parentWindow.postMessage({
            type: 'BUILD_IN_LIVE_ELEMENT_CLICK',
            selector,
            xPercent,
            yPercent,
            search: window.location.search,
            x: clickEvent.clientX,
            y: clickEvent.clientY + getAbsoluteScrollY()
          }, '*');
        }

        window.removeEventListener('click', handleAddClick, true);
      };
      activeAddClickHandler = handleAddClick;
      window.addEventListener('click', handleAddClick, true);
    }
  });

  // Start Sync
  if (document.readyState === 'complete') {
    syncState();
  } else {
    window.addEventListener('load', syncState);
  }

  console.log(`${SDK_LABEL} Robust sync ACTIVE for project: ${projectId}`);
})();
