var stickableOpts = [], stickableElements = [], scrollableParent = false;
var slider = { 

    init: function() {
        if(sel('.volume-slider-wrap').length < 1) return;
        sel('.volume-slider-wrap')[0].addEventListener('mousedown', function(e) { slider.drag = true; slider.updateVolume(e.pageX); });
        document.body.addEventListener('mouseup', function(e) { slider.drag = false; });
        document.body.addEventListener('mousemove', function(e) { if(!slider.drag) return; slider.updateVolume(e.pageX); });
    },

    updateVolume: function(x) {
        var el = geByClass1('volume-slider-wrap', ge('page_wrapper'));
        var progress = geByClass1('volume-slider-progress', ge('page_wrapper'));
        var circle = geByClass1('volume-slider-circle', ge('page_wrapper'));
        var perc = 100 * ((x - (el.offsetLeft + ge('page_wrapper').offsetLeft)) / el.offsetWidth);
        if(perc > 100) perc = 100;
        if(perc < 0) perc = 0;
        setStyle(progress, { width: perc + '%' });
        setStyle(circle, { left: perc + '%' });
        music.el.volume = perc / 200;
        cookie('volume', perc / 200);
    },

    drag: false

}

var ui_radio = {

    init: function() {
        elsFunc(sel('.ui-radio-selector'), function(p) {
            elsFunc(p.childNodes, function(c) {
                if(c.nodeName != '#text') c.value = c.getAttribute('value');
                c.addEventListener('click', function() { ui_radio.select(c, p); });
            });
        });
    },

    select: function(el, parent) {
        elsFunc(sel('.ui-radio--variant', parent), function(el) { el.removeAttribute('selected'); });
        parent.value = el.value;
        el.setAttribute('selected', 1);
    },

}

function scrollAnim(offset = 0) { animate(arpScroll, { scrollTop: offset }, 200); }
function toAnim(el, offset = 0) {
    if(!el) return;
    animate(arpScroll, { scrollTop: el.offsetTop + offset }, 500);
}
function textToUrl(text) {
    text = text.replace(/(?:https?:\/\/)?(?:[a-zа-яё0-9_\-~.]+\.(?=(?!exe|txt|rar|zip|bat|dmg))[a-zа-яё]{2,24}(?:\:\d{1,5})?){1,255}\/?[a-zа-яё0-9_\-~.\/]*\??[a-zа-яё0-9%_\-~.=&]*/gi, function($0) { return '<a href="/away.php?to='+encodeURIComponent($0)+'" target="_blank">'+$0+'</a>'; });
    text = text.replace(/\[id([0-9]+)\|(.+?)\]/, '<a href="/away.php?to=https://vk.com/id$1" target="_blank">$2</a>');
    text = text.replace(/\[club([0-9]+)\|(.+?)\]/, '<a href="/away.php?to=https://vk.com/club$1" target="_blank">$2</a>');
    return text;
}
function htmlencode(str) {
    let helper = document.createElement('textarea');
    helper.textContent = str;
    return helper.innerHTML;
}
function htmldecode(str) {
    let helper = document.createElement('textarea');
    helper.innerHTML = str;
    return helper.textContent;
}
function autoArea(el) {
    let gce = getComputedStyle(el), eptb = parseFloat(gce.paddingTop) + parseFloat(gce.paddingBottom);
    el.style.height = 0;
    el.style.height = Math.min(el.scrollHeight + 2, (parseFloat(gce.lineHeight) * 7) + eptb);
    el.scrollTop = el.scrollHeight - el.offsetHeight + 2;
}
function handleArea(el, ev, callback) {
    if(isMobile) return;
    if(ev.keyCode == 13 && !ev.shiftKey) return ev.preventDefault(), callback && callback(false, ev);
}

function stickable(el, side, offset, parent) {
    if(!Element.prototype.isPrototypeOf(el)) return false;
    if(['top', 'bottom', 'left', 'right'].indexOf(side) === -1) return false;
    return new Stickable(el, side, offset, parent);
}
function Stickable(element, side, offset, parent) {
    this.element = element;
    this.parent = parent || element.parentNode;
    this.side = side;
    this.offset = offset;
    this.clone = element.cloneNode(false);
    this.clone.style.display = 'none';
    this.clone.style.visibility = 'hidden';
    this.parent.insertBefore(this.clone, this.element);
    this.fixed = false;
    this.scrollHander = function() {
        let parentBounds = this.parent.getBoundingClientRect(),
            initialElement = this.fixed ? this.clone : this.element,
            initialBounds = initialElement.getBoundingClientRect(),
            elementBounds = this.fixed ? this.element.getBoundingClientRect() : initialBounds;
        switch(this.side) {
            case 'top': {
                let shouldBeFixed = initialBounds.top < 0,
                    minusOffset = Math.min(0, parentBounds.bottom - elementBounds.height - this.offset);
                if(!this.fixed && shouldBeFixed) {
                    this.element.style.width = this.element.offsetWidth + 'px';
                    this.element.style.position = 'fixed';
                    this.element.classList.add('stickable-active');
                    this.clone.style.display = '';
                } else if(this.fixed && !shouldBeFixed) {
                    this.element.style.width = '';
                    this.element.classList.remove('stickable-active');
                    this.element.style.position = '';
                    this.element.style.top = '';
                    this.element.style.left = '';
                    this.clone.style.display = 'none';
                }
                if(this.fixed = shouldBeFixed) {
                    this.element.style.top = minusOffset + 'px';
                    if(this.clone.offsetHeight !== this.element.offsetHeight) this.clone.style.height = this.element.offsetHeight + 'px';
                    if(this.element.offsetWidth !== this.clone.offsetWidth) this.element.style.width = this.clone.offsetWidth + 'px';
                    this.element.style.left = initialBounds.left + 'px';
                } break;
            }
            case 'bottom': {
                let shouldBeFixed = initialBounds.bottom - window.innerHeight > 0,
                    minusOffset = Math.min(0, window.innerHeight - elementBounds.height - parentBounds.top - this.offset);
                if(!this.fixed && shouldBeFixed) {
                    this.element.style.width = this.element.offsetWidth + 'px';
                    this.element.style.position = 'fixed';
                    this.element.classList.add('stickable-active');
                    this.clone.style.display = '';
                } else if(this.fixed && !shouldBeFixed) {
                    this.element.style.width = '';
                    this.element.classList.remove('stickable-active');
                    this.element.style.position = '';
                    this.element.style.bottom = '';
                    this.element.style.left = '';
                    this.clone.style.display = 'none';
                }
                if(this.fixed = shouldBeFixed) {
                    this.element.style.bottom = minusOffset + 'px';
                    if(this.clone.offsetHeight !== this.element.offsetHeight) this.clone.style.height = this.element.offsetHeight + 'px';
                    if(this.element.offsetWidth !== this.clone.offsetWidth) this.element.style.width = this.clone.offsetWidth + 'px';
                    this.element.style.left = initialBounds.left + 'px';
                } break;
            }
            case 'left': {
                let shouldBeFixed = initialBounds.left < 0,
                    minusOffset = Math.min(0, parentBounds.right - elementBounds.width - this.offset);
                if(!this.fixed && shouldBeFixed) {
                    this.element.style.height = this.element.offsetHeight + 'px';
                    this.element.style.position = 'fixed';
                    this.element.classList.add('stickable-active');
                    this.clone.style.display = '';
                } else if(this.fixed && !shouldBeFixed) {
                    this.element.style.height = '';
                    this.element.classList.remove('stickable-active');
                    this.element.style.position = '';
                    this.element.style.left = '';
                    this.element.style.top = '';
                    this.clone.style.display = 'none';
                }
                if(this.fixed = shouldBeFixed) {
                    this.element.style.left = minusOffset + 'px';
                    if(this.clone.offsetHeight !== this.element.offsetHeight) this.clone.style.height = this.element.offsetHeight + 'px';
                    if(this.element.offsetWidth !== this.clone.offsetWidth) this.element.style.width = this.clone.offsetWidth + 'px';
                    this.element.style.top = initialBounds.top + 'px';
                } break;
            }
            case 'right': {
                let shouldBeFixed = initialBounds.right - window.innerWidth > 0,
                    minusOffset = Math.min(0, window.innerWidth - elementBounds.width - parentBounds.left - this.offset);
                if(!this.fixed && shouldBeFixed) {
                    this.element.style.height = this.element.offsetHeight + 'px';
                    this.element.style.position = 'fixed';
                    this.element.classList.add('stickable-active');
                    this.clone.style.display = '';
                } else if(this.fixed && !shouldBeFixed) {
                    this.element.style.height = '';
                    this.element.classList.remove('stickable-active');
                    this.element.style.position = '';
                    this.element.style.right = '';
                    this.element.style.top = '';
                    this.clone.style.display = 'none';
                }
                if(this.fixed = shouldBeFixed) {
                    this.element.style.right = minusOffset + 'px';
                    if(this.clone.offsetHeight !== this.element.offsetHeight) this.clone.style.height = this.element.offsetHeight + 'px';
                    if(this.element.offsetWidth !== this.clone.offsetWidth) this.element.style.width = this.clone.offsetWidth + 'px';
                    this.element.style.top = initialBounds.top + 'px';
                } break;
            }
        }
    };

    window.addEventListener('scroll', this.scrollHander.bind(this), true);
    window.addEventListener('resize', this.scrollHander.bind(this), true);
    setInterval(this.scrollHander.bind(this), 0);
}







