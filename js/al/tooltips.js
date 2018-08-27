var tooltips = {
    
    tt_up: {
        
        show: function(el, opts, callback) {
            
            var set_zIndx   = (modality.active() ? 302:200);
            var tt_zIndx    = document.body.getElementsByTagName('*');
            var timeShow    = setTimeout(function() {

                opts = opts || {};
                if(tooltips.tt_AC == false || opts.textarea) {
                    
                    tooltips.tt_AC = true;
                    var s = getSize(el),
                        w = getXY(el);
                    
                    setStyle(el, {position: 'relative', zIndex: set_zIndx});
                    document.body.appendChild(ce('div', {className: 'tt_w tt_default tt_up a_tt', style: 'z-index: '+set_zIndx+';', innerHTML: "<div class='tt_wrapped'><div class='tt_content'><div class='tt_header'>"+el.getAttribute("tt_header")+"</div><div class='tt_text'>"+el.getAttribute("tt_text")+"</div></div></div>"}));
                    
                    for(var i=0; i < tt_zIndx.length; i++) {
                        if(getStyle(tt_zIndx[i], 'z-index') == set_zIndx) {
                            tt_zIndx[i].onmouseleave = function(ev) {
                                if(getStyle(ev.target, 'z-index') != set_zIndx) return;
                                tooltips.tt_YE = true;
                                setTimeout(function() { tooltips.hide(el); }, 200);
                            };
                            tt_zIndx[i].onmouseenter = function(ev) { 
                                if(getStyle(ev.target, 'z-index') != set_zIndx) return;
                                tooltips.tt_YE = false; 
                            };
                        }
                    }
                    
                    var t = document.querySelector('body > .tt_w'),
                        d = getSize(t);
                    
                    var b = w[1] + s[1] + 30;
                    var x = w[1] + s[1] + 10;
                    var c = w[0] + s[0]/2 - 30;
                
                    setStyle(t, {
                        opacity: 0,
                        top: b,
                        left: c
                    }), animate(t, {
                        opacity: 1,
                        top: x,
                        left: c
                    }, 150, function() { tooltips.tt_AN = true; });

                    if(callback) 
                        callback();

                }

            }, 200);
            
            el.addEventListener('mouseleave', function() { clearTimeout(timeShow); });
            
        }
        
    },

    tt_black_down: {
        
        show: function(el) {
            if(sel('body > .tt_w')[0]) return;
            var set_zIndx = (modality.active() ? 302:200);
            var s = getSize(el), w = getXY(el);
            elsRem(sel('body > .tt_w'));
            document.body.appendChild(ce('div', {className: 'tt_w tt_black tt_down a_tt', style: 'z-index: '+set_zIndx+';', innerHTML: "<div class='tt_text'>"+el.getAttribute("tt_text")+"</div>"}));
            el.addEventListener('mouseleave', function() { tooltips.tt_AC = true; tooltips.tt_AN = true; tooltips.tt_YE = true; tooltips.hide(el); });
            var t = document.querySelector('body > .tt_w'), d = getSize(t);
            var b = w[1] - d[1] - 15;
            var x = w[1] - d[1] - 10;
            var c = w[0];
            setStyle(t, {
                opacity: 0,
                top: b,
                left: c
            }), animate(t, {
                opacity: 1,
                top: x,
                left: c
            }, 100);
        }
        
    },
    
    hide: function(el) {
        var tt = document.querySelector('body > .tt_w');
        if(tooltips.tt_YE && tooltips.tt_AC && tooltips.tt_AN && tt) {
            tooltips.tt_AN = false, tooltips.tt_YE = false;
            setStyle(el, {zIndex: 1}), setStyle(tt, {opacity: 1}), animate(tt, {opacity: 0}, 150, function() {
                tt.remove();
                tooltips.tt_AC = false;
            });
        } 
    },

    hide_all: function() {
        tooltips.tt_AN = false, 
        tooltips.tt_AC = false, 
        tooltips.tt_YE = false;
        elsRem(sel('body > .tt_w'));
    },

    tt_YE: false,
    tt_AC: false,
    tt_AN: false
    
}

var actions_menu = { 

    show: function(el, ev, opts) {
        opts = opts || {};
        var amw = sel('.actions_menu_wrap', el.parentNode, false),
            am = queryParent(amw, '.actions_menu');
        if(!amw || !am) return;
        if(isMobile) return actions_menu.toggle(el, ev);
        if(amw.classList.contains('shown')) return actions_menu.aa = true;
        var accidentFix = setTimeout(() => {
            var target = amw;
            if(opts.pos_fix) {
                elsRem(sel('#scroll_fix_wrap > .actions_menu_wrap'));
                var amw_cln = amw.cloneNode(true), amw_size = getXY(amw), amw_mtop = parseInt(getStyle(amw, 'margin-top'));
                ge('scroll_fix_wrap').appendChild(amw_cln);
                setStyle(amw_cln, { left: amw_size[0] + amw.clientWidth / 2, top: amw_size[1] - amw_mtop });
                target = amw_cln;
            }
            actions_menu.aa = true;
            target.classList.add('shown');
            target.onmouseenter = () => { actions_menu.aa = true; };
            target.onmouseleave = am.onmouseleave = actions_menu.hide;
        }, 200); el.addEventListener('mouseleave', () => { clearTimeout(accidentFix); });
    },

    toggle: function(el, ev) {
        var amw = geByClass1('actions_menu_wrap', el.parentNode);
        if(amw.classList.contains('shown')) return amw.classList.remove('shown'), eventOff(document.body, 'click', '.actions_menu');
        amw.classList.add('shown');
        eventFunc(document.body, 'click', '.actions_menu', actions_menu.hide);
    },

    hide: function() {
        var amw = sel('.actions_menu_wrap.shown', false);
        if(!amw) return;
        actions_menu.aa = false;
        setTimeout(() => { 
            if(!actions_menu.aa) amw.classList.remove('shown'); 
        }, 200);
    },

    aa: false

}















