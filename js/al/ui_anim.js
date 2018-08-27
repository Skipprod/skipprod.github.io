var sAnim = {
 
    init: function() {
        sAnim.scroll();
        window.addEventListener('scroll', this.scroll, true);
    },
 
    scroll: function(event) {
        if(!event) event = {target: document.body};
        elsFunc(sel('[sAnim]', true, event.target), function(v) {
            if(sAnim.isVisible(v)) {
                let dur = parseFloat(v.getAttribute('sDuration')) || 1;
                let animName = v.getAttribute('sAnim').toString();
                setTimeout(function() {
                    v.removeAttribute('sAnim');
                    v.removeAttribute('sDuration');
                    v.style.animationDuration = dur + 's';
                    v.classList.add('animated');
                    v.classList.add(animName);
                }, (v.getAttribute('sTimer') ? parseInt(v.getAttribute('sTimer')) : 0));
            }
        });
    },
 
    getParent: function(el) {
        if(!el) return null;
        return this.gpHelper(el.parentNode);
    },
   
    gpHelper: function(el) {
        if(!el) return null;
        let overflowY = window.getComputedStyle(el).overflowY;
        let isScrollable = overflowY !== 'hidden' && overflowY !== 'visible';
 
        if((isScrollable && el.scrollHeight > el.clientHeight) || el == document.body)
            return el;
 
        return this.gpHelper(el.parentNode);
    },
 
    isVisible: function(el) {
        var elementRect = el.getBoundingClientRect();
        var parentRects = [];
        var parentSearch = el.parentElement;
 
        while(parentSearch != null) {
            parentRects.push(parentSearch);
            parentSearch = parentSearch.parentElement;
        }
 
        var visibleInAllParents = parentRects.every(function(parent) {
            if(getComputedStyle(parent)['overflow'] == 'visible') return true;
            var parentRect = parent.getBoundingClientRect();
            var visiblePixelX = Math.min(elementRect.right, parentRect.right) - Math.max(elementRect.left, parentRect.left);
            var visiblePixelY = Math.min(elementRect.bottom, parentRect.bottom) - Math.max(elementRect.top, parentRect.top);
            var visiblePercentageX = visiblePixelX / elementRect.width * 100;
            var visiblePercentageY = visiblePixelY / elementRect.height * 100;
            if(getComputedStyle(parent)['overflowY'] == 'visible') visiblePercentageY = 100;
            if(getComputedStyle(parent)['overflowX'] == 'visible') visiblePercentageX = 100;
            return visiblePercentageX + 0.01 > 5 && visiblePercentageY + 0.01 > 5;
        });
        return visibleInAllParents && window.innerHeight > elementRect.top + parseInt(el.getAttribute('sOffset') ? el.getAttribute('sOffset') : 0) + Math.min(elementRect.height / 10, 5);
    }
 
}