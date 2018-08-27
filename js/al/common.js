var arpExpand = 'ARP' + arpNow(), arpScroll = false, arpCache = {}, arpCallback = 0, arpTs = [0, 0], isMobile = false, s_v = parseInt(cookie('s_v'));

if (!window._ua) var _ua = navigator.userAgent.toLowerCase();
if (!window.locDomain) var locDomain = location.host.toString().match(/[a-zA-Z]+\.[a-zA-Z]+\.?$/)[0];

window.navGo = false;
window.locHost = location.host;
window.locProtocol = location.protocol;
window.__debugMode = true;

var browser = {
    version: (_ua.match( /.+(?:me|ox|on|rv|it|era|opr|ie|edge)[\/: ]([\d.]+)/ ) || [0,'0'])[1],
    opera: (/opera/i.test(_ua) || /opr/i.test(_ua)),
    vivaldi: /vivaldi/i.test(_ua),
    msie: (/msie/i.test(_ua) && !/opera/i.test(_ua) || /trident\//i.test(_ua)) || /edge/i.test(_ua),
    msie6: (/msie 6/i.test(_ua) && !/opera/i.test(_ua)),
    msie7: (/msie 7/i.test(_ua) && !/opera/i.test(_ua)),
    msie8: (/msie 8/i.test(_ua) && !/opera/i.test(_ua)),
    msie9: (/msie 9/i.test(_ua) && !/opera/i.test(_ua)),
    msie_edge: (/edge/i.test(_ua) && !/opera/i.test(_ua)),
    mozilla: /firefox/i.test(_ua),
    chrome: /chrome/i.test(_ua) && !/edge/i.test(_ua),
    safari: (!(/chrome/i.test(_ua)) && /webkit|safari|khtml/i.test(_ua)),
    iphone: /iphone/i.test(_ua),
    ipod: /ipod/i.test(_ua),
    iphone4: /iphone.*OS 4/i.test(_ua),
    ipod4: /ipod.*OS 4/i.test(_ua),
    ipad: /ipad/i.test(_ua),
    android: /android/i.test(_ua),
    bada: /bada/i.test(_ua),
    mobile: /iphone|ipod|ipad|opera mini|opera mobi|iemobile|android|Nomi/i.test(_ua),
    msie_mobile: /iemobile/i.test(_ua),
    safari_mobile: /iphone|ipod|ipad/i.test(_ua),
    opera_mobile: /opera mini|opera mobi/i.test(_ua),
    opera_mini: /opera mini/i.test(_ua),
    mac: /mac/i.test(_ua),
    search_bot: /(yandex|google|stackrambler|aport|slurp|msnbot|bingbot|twitterbot|ia_archiver|facebookexternalhit)/i.test(_ua)
};

var ajax = {
    
    init: function() {
        var r = false;
        try
        {
            if (r = new XMLHttpRequest()) {
                ajax.req = function() { return new XMLHttpRequest(); }
                return;
            }
        } catch(e) {}
        if (!ajax.req) {
            location.replace('/badbrowser.php');
        } 
    },
    
    getreq: function() {
        if(!ajax.req) ajax.init();
        return ajax.req();
    },
    
    plainget: function(url, successHandler) {
        let r = ajax.getreq();
        let data = null;
        r.onreadystatechange = function() {
            if(r.readyState == 4) {
                data = JSON.parse(r.responseText);
                if(data.redir) return nav.go(data.redir, null, { nav_abort: true });
                successHandler && successHandler(data);
            }
        }
        r.open('POST', url, true);
        r.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        r.send('ajax_req=1');
        return r;
    },

    modalget: function(url, successHandler) {
        let r = ajax.getreq();
        let data = null;
        r.onreadystatechange = function() {
            if(r.readyState == 4 && r.status == 200) {
                data = JSON.parse(r.responseText);
                if(data.redir) return modality.show(data.redir, null, null);
                successHandler && successHandler(data);
            }
        }
        r.open('POST', url, true);
        r.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        r.send('ajax_req=1&modality=1');
        return r;
    },
    
    getjson: function(method, params, successHandler) {
        let r = ajax.getreq();
        let data = null;
        r.open('GET', '/methods/' + method + '.php?' + toURL(params), true);
        r.onreadystatechange = function() {
            if(r.status == 404 && successHandler) successHandler({error: {err_msg: 'Ошибка, указанный метод не найден. Попробуйте немного позже...'}});
            if(r.readyState == 4 && r.status == 200) {
                data = JSON.parse(r.responseText);
                if(data.success && data.success.captchaNeeded) {
                    modality.show('/system/captcha', null, null, {'captcha': true});
                    return arpCache['captchaCallback'] = () => { 
                        if(!arpCache['lastModality']) modality.hide();
                        ajax.getjson(method, params, (data) => { 
                            successHandler && successHandler(data); 
                            arpCache['lastModality'] && arpCache['lastModality']();
                            delete arpCache['captchaCallback'];
                        }); 
                    };
                } successHandler && successHandler(data);
            }
        }
        r.send();
        return r;
    },

    postfile: function(method, params, progressHandler, successHandler, captchaHandler) {
        let r = ajax.getreq();
        let data = null;
        r.open('POST', '/methods/' + method + '.php', true);
        if(progressHandler) r.upload.onprogress = function(e) { progressHandler(e); };
        r.onreadystatechange = function() {
            if(r.readyState == 4 && r.status == 200) {
                data = JSON.parse(r.responseText);
                if(data.success && data.success.captchaNeeded) {
                    if(modality.get().url === '/system/captcha') return;
                    modality.show('/system/captcha');
                    return arpCache['captchaCallback'] = () => {
                        modality.hide();
                        delete arpCache['captchaCallback'];
                        if(captchaHandler) captchaHandler();
                    };
                } successHandler && successHandler(data);
            }
        }
        r.send(params);
        return r;
    },

    postjson: function(method, params, successHandler) {
        let r = ajax.getreq();
        let data = null;
        r.open('POST', '/methods/' + method + '.php', true);
        r.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        r.onreadystatechange = function() {
            if(r.readyState == 4 && r.status == 200) {
                data = JSON.parse(r.responseText);
                if(data.success && data.success.captchaNeeded) {
                    modality.show('/system/captcha', null, null, {'captcha': true});
                    return arpCache['captchaCallback'] = () => { 
                        if(!arpCache['lastModality']) modality.hide();
                        ajax.postjson(method, params, (data) => { 
                            successHandler && successHandler(data); 
                            arpCache['lastModality'] && arpCache['lastModality']();
                            delete arpCache['captchaCallback'];
                        }); 
                    };
                } successHandler && successHandler(data);
            }
        }
        r.send(toURL(params));
        return r;
    },

    getjson1: function(url, params, successHandler) {
        var r = ajax.getreq();
        var data = null;
        r.open('GET', 'https://' + url + '?' + toURL(params), true);
        r.onreadystatechange = function() {
            if(r.readyState == 4 && r.status == 200) {
                data = JSON.parse(r.responseText);
                successHandler && successHandler(data);
            }
        }
        r.send();
        return r;
    }
    
}

var stManager = {

    getPage: function(loc, callback) {
        loc = loc.split('?')[0].replace(/^\/|\/$/g, '');
        if(navMap[loc] && navMap[loc][1] && !navMap[loc][0]) return stManager.add(navMap[loc][1], callback);
        for(let key in navMap) if((new RegExp('^'+key+'$')).test(loc) && navMap[key][0] && navMap[key][1]) return stManager.add(navMap[key][1], callback);
        return callback && callback();
    },

    find: function(file) {
        if(!file) return true;
        let found = false, pattern = new RegExp(file.replace(/\?.*/, ''));
        if(file.match(/\.css/)) elsFunc(sel('link'), function(el) { if(el.getAttribute('href') && el.getAttribute('href').match(pattern)) found = el; });
        else elsFunc(sel('script'), function(el) { if(el.getAttribute('src') && el.getAttribute('src').match(pattern)) found = el; });
        return found;
    },

    del: function(files, callback) {
        if(!isArray(files)) files = [files];
        each(files, function(i, file) {
            var stf = stManager.find(file);
            if(stf) return stf.remove();
        }); return true;
    },

    add: function(files, callback) {
        if(!isArray(files)) files = [files];
        let link = geByTag('link', document.head);
        let script = geByTag('script', document.head);
        each(files, function(i, file) {
            if(stManager.find(file)) return stManager.done(files, file, callback);
            if(file.match(/\.css/)) {
                if(!file.match(/\?\d+/)) {
                    ajax.getjson('system.getFileVersion', { file: file }, function(data) {
                        file += '?'+data.success;
                        var css = document.createElement('link');
                        css.rel = 'stylesheet';
                        css.type = 'text/css';
                        css.href = '/css/' + file;
                        css.onload = function() { stManager.done(files, file, callback); };
                        document.head.appendChild(css);
                    });
                    return;
                }
                var css = document.createElement('link');
                css.rel = 'stylesheet';
                css.type = 'text/css';
                css.href = '/css/' + file;
                css.onload = function() { stManager.done(files, file, callback); };
                document.head.appendChild(css);
            } else {
                if(!file.match(/\?\d+/)) {
                    ajax.getjson('system.getFileVersion', { file: file }, function(data) {
                        file += '?'+data.success;
                        var js = document.createElement('script');
                        js.type = 'text/javascript';
                        js.src = '/js/al/' + file;
                        js.onload = function() { stManager.done(files, file, callback); };
                        document.head.appendChild(js);
                    });
                    return;
                }
                var js = document.createElement('script');
                js.type = 'text/javascript';
                js.src = '/js/al/' + file;
                js.onload = function() { stManager.done(files, file, callback); };
                document.head.appendChild(js);
            } 
        });
    },

    addBody: function(files, callback) {
        if(!isArray(files)) files = [files];
        let link = geByTag('link', document.body);
        let script = geByTag('script', document.body);
        each(files, function(i, file) {
            if(stManager.find(file)) return stManager.done(files, file, callback);
            if(file.match(/\.css/)) {
                if(!file.match(/\?\d+/)) {
                    ajax.getjson('system.getFileVersion', { file: file }, function(data) {
                        file += '?'+data.success;
                        var css = document.createElement('link');
                        css.rel = 'stylesheet';
                        css.type = 'text/css';
                        css.href = '/css/' + file;
                        document.body.appendChild(css);
                    });
                    return;
                }
                var css = document.createElement('link');
                css.rel = 'stylesheet';
                css.type = 'text/css';
                css.href = '/css/' + file;
                document.body.appendChild(css);
            } else {
                if(!file.match(/\?\d+/)) {
                    ajax.getjson('system.getFileVersion', { file: file }, function(data) {
                        file += '?'+data.success;
                        var js = document.createElement('script');
                        js.type = 'text/javascript';
                        js.src = '/js/al/' + file;
                        document.body.appendChild(js);
                    });
                    return;
                }
                var js = document.createElement('script');
                js.type = 'text/javascript';
                js.src = '/js/al/' + file;
                document.body.appendChild(js);
            } 
        });
    },

    done: function(files, file, callback) {
        stManager.loaded.push(file);
        if(files.length == stManager.loaded.length) {
            stManager.loaded = []; 
            callback && callback();
        }
    },

    loaded: []

}

var nav = {
    
    go: function(loc, ev, opts, callback) {
        if(ev) ev.preventDefault();
        if(typeof roulette != 'undefined' && roulette.active) return;
        if(typeof loc != 'string') loc = loc.getAttribute('href');
        opts = opts || {};
        nav.last_loc = location.pathname + location.search;
        if(!nav.isLoad || opts.nav_abort) {
            nav.isLoad = true;
            if(nav.last_loc != loc) history.pushState(null, null, loc);
            typeof topNotifier != 'undefined' && topNotifier.hide();
            ajax.plainget(loc, function(data) {
                document.title = data.title;
                elsRem(sel('#aj'));
                clearVariables();
                data.head.forEach(function(obj) {
                    let meta = document.createElement('meta'); meta.id = 'aj';
                    for(let prop in obj) meta.setAttribute(prop, obj[prop]);
                    document.head.insertBefore(meta, sel('meta')[0]);
                });
                stManager.add(data.files, function() {
                    ge('page_wrapper').innerHTML = data.body;
                    if(typeof m != 'undefined' && typeof m == 'object') m.menu_close(); 
                    if(sel('.init-script', false)) elsFunc(sel('.init-script'), (el) => { eval(el.innerHTML); });
                    if(!opts.animScroll) arpScroll.scrollTop = 0;
                    else animate(arpScroll, { scrollTop: 0 });
                    delete arpCache['sidebar'];
                    mobileHandle();
                    page.path(loc); 
                    callback && callback();
                    nav.isLoad = false;
                });
            });
        }
    },
    
    link: function(loc, ev, opts) {
        opts = opts || {};
        if(ev) ev.preventDefault();
        if(typeof loc != 'string') loc = loc.getAttribute('href');
        if(!nav.isLoad) {
            loc = loc.replace(new RegExp('^(' + locProtocol + '//' + locHost + ')?/?', 'i'), '');
            if(opts.curWindow) return window.location.assign(loc);
            window.open(loc);
        } 
    },
    
    isLoad: false,
    last_loc: null
    
}

function Modal(url) {

    this.url = url;
    this.state = 'loading';
    this.title = document.title;
    this.elements = {};
    this.json_data = null;

    // functions
    this.create = function (json_data, callback) {
        this.json_data = json_data;
        stManager.add(json_data.files, (function() {
            var parent = ce('div', {className: 'modal-parent'}),
                overlay = ce('div', {className: 'modal-overlay'}),
                content = ce('div', {className: 'modal-content'});

            content.innerHTML = json_data.body;

            parent.appendChild(overlay);
            parent.appendChild(content);
            hide(parent);

            document.body.insertBefore(parent, document.body.children[0])
            this.elements = {parent, overlay, content};
            this.state = 'loaded';
            callback();
        }).bind(this));
    };

    this.show = function () {
        if(this.state !== 'loaded') return false;
        if('activeElement' in document) document.activeElement.blur();
        setStyle(this.elements.parent, { display: '' });
        setStyle(document.body, { overflow: 'hidden' });
        document.title = this.json_data.title || this.title;
        this.state = 'shown';
        return true;
    };

    this.hide = function () {
        if(this.state !== 'shown') return true;
        hide(this.elements.parent);
        setStyle(document.body, { overflow: '' });
        document.title = this.title;
        this.state = 'loaded';
        return true;
    };

    this.delete = function () {
        this.elements.parent.remove();
        this.elements = {};
        setStyle(document.body, { overflow: '' });
        document.title = this.title;
        this.state = 'deleted';
        return true;
    };

    this.promise = new Promise((function(resolve, reject) {

        var r = ajax.modalget(this.url, (function(json_data) {
            this.create(json_data, resolve);
        }).bind(this));

        r.onerror = function () {
            reject();
        }

    }).bind(this));

}

var modality_service = {

    show: function (loc, event, loaded, memDestroy) {
        if(event) event.preventDefault();
        if(memDestroy) this.destroy();
        else {
            var sameModal = this.mem.filter(function(modal) { return modal.url === loc; });
            if(sameModal.length) {
                var sameModelIndex = this.mem.indexOf(sameModal[0]);
                this.mem.splice(sameModelIndex, 1)[0].delete();
            }
        }

        var modal = new Modal(loc);
        modal.promise.then((function() {
            modal.show();
            if(loaded) loaded();
        }).bind(this));

        if(this.mem.length) this.mem.slice(-1)[0].hide();
        this.mem.push(modal);

        return true;
    },

    get: function() {
        if(!this.mem.length) return false;
        return this.mem.slice(-1)[0];
    },

    hide: function () {
        if(!this.mem.length) return false;
        this.mem.splice(-1)[0].delete();
        if(this.mem.length) this.mem.slice(-1)[0].show();

        return true;
    },

    destroy: function () {
        if(!this.mem.length) return false;
        this.mem.reverse().forEach(function(modal) {
            modal.delete();
        });

        this.mem = [];
        return true;
    },

    mem: []

}

var modality = {

    show: function (loc, event, loaded, memDestroy) {
        if(typeof roulette !== 'undefined' && roulette.active) return false;
        if(typeof loc !== 'string') loc = loc.getAttribute('href');
        if(memDestroy) this.hideHandle();

        // after load
        var loaded_modified = function () {
            var modal = modality_service.mem.slice(-1)[0];
            if(loaded) loaded();
            if(isMobile && modality_service.mem.length === 1) {
                modality.save_pos = arpScroll.scrollTop;
                setStyle(ge('scroll_fix_wrap'), { height: 0, visibility: 'hidden' });
            }
            modal.elements.content.onclick = function(event) {
                if(event.target === modal.elements.content)
                    modality.destroy();
            };

            mobileHandle();
            page.path(loc);
        };

        // send to service
        return modality_service.show(loc, event, loaded_modified, memDestroy);
    },

    get: function() {
        return modality_service.get();
    },

    hide: function () {
        this.hideHandle();
        return modality_service.hide();
    },

    destroy: function () {
        this.hideHandle();
        return modality_service.destroy();
    },

    hideHandle: function() {
        if(isMobile && modality_service.mem.length === 1) {
            setStyle(ge('scroll_fix_wrap'), { height: 'max-content', visibility: 'visible' });
            arpScroll.scrollTop = modality.save_pos;
            modality.save_pos = 0;
        }
    },

    active: function() {
        return !!modality_service.mem.length;
    },

    save_pos: 0

};

function ImageCarousel() {

    this.state = 'creating';
    this.elements = {};
    this.current_image_key = 0;

    this.create = function() {

        // if image currently is created
        if(this.state !== 'creating')
            return false;

        // create elements
        var wrapper = ce('figure', {className: 'image-carousel'}),
            output = ce('div', {className: 'image-carousel-output'}),
            controls = ce('div', {className: 'image-carousel-controls'}),
            output_animation = ce('div'),
            output_image = ce('img', {className: 'image-carousel-output--inner', draggable: false}),
            controls_counter = ce('div', {className: 'image-carousel-controls--counter'}),
            controls_button_left = ce('div', {className: 'image-carousel-controls--left', innerHTML: '<div class="svg-chevron-left"></div>'}),
            controls_button_right = ce('div', {className: 'image-carousel-controls--right', innerHTML: '<div class="svg-chevron-right"></div>'});

        // distribution
        wrapper.appendChild(output);
        wrapper.appendChild(controls);

        output.appendChild(output_animation);
        output_animation.appendChild(output_image);

        controls.appendChild(controls_counter);
        controls.appendChild(controls_button_left);
        controls.appendChild(controls_button_right);

        // register event handler
        controls.addEventListener('click', (function(e) { this.events(e); }).bind(this));

        // hide elements
        hide(wrapper);
        hide(controls_button_left);
        hide(controls_button_right);

        // update variables
        this.elements = {wrapper, output, controls, output_animation, output_image, controls_counter, controls_button_left, controls_button_right};
        this.state = 'created';

        return true;

    };

    this.events = function(e) {
        if(queryParentNode(e.target, this.elements.controls_button_left)) this.left();
        else if(queryParentNode(e.target, this.elements.controls_button_right)) this.right();
        else this.fullsize();
    };

    this.draw = function() {
        var data_images = this.data();
        if(this.state === 'creating') return false;

        if(data_images.length === 1) hide(this.elements.controls_counter);
        if(this.current_image_key === 0) hide(this.elements.controls_button_left);
        else show(this.elements.controls_button_left);
        if(this.current_image_key === data_images.length - 1) hide(this.elements.controls_button_right);
        else show(this.elements.controls_button_right);

        this.elements.controls_counter.innerHTML = (this.current_image_key + 1) + ' из ' + data_images.length;
        this.elements.output_image.src = data_images[this.current_image_key];

        return true;
    };

    this.add = function(images) {
        var data_images = this.data();
        if(this.state === 'creating') return false;
        if(data_images.length >= 10) return false;
        if(!images) return false;

        if(typeof images === 'string') data_images.push(images);
        else images.forEach((function(image) {
            data_images.push(image);
        }).bind(this));

        this.elements.output.setAttribute('data-images', JSON.stringify(data_images));
        return true;
    };

    this.show = function() {
        if(this.state === 'creating' || this.state === 'shown') return false;
        show(this.elements.wrapper);
        this.state = 'shown';

        return true;
    };

    this.hide = function() {
        if(this.state === 'creating' || this.state === 'hidden') return false;
        hide(this.elements.wrapper);
        this.state = 'hidden';

        return true;
    };

    this.data = function() {
        if(this.state === 'creating') return false;
        var data_images = JSON.parse(this.elements.output.getAttribute('data-images'));
        if(!data_images) return [];
        return data_images;
    };

    this.left = function() {
        if(this.state === 'creating') return false;
        if(this.current_image_key <= 0) return false;
        this.current_image_key --;
        this.draw();

        return true;
    };

    this.right = function() {
        if(this.state === 'creating') return false;
        if((this.current_image_key + 1) >= this.data().length) return false;
        this.current_image_key ++;
        this.draw();

        return true;
    };

    this.fullsize = function() {
        if(this.state !== 'shown') return false;
        if(this.elements.wrapper.classList.contains('ic-fullsize')) this.elements.wrapper.classList.remove('ic-fullsize');
        else this.elements.wrapper.classList.add('ic-fullsize');

        return true;
    }

}

var ic = {

    init: function() {

        // find inactive elements
        sel('.image-carousel').forEach(function(el) {

            // create carousel
            var carousel = new ImageCarousel();

            // re-create elements
            var wrapper = el.cloneNode(true);
            el.insertAdjacentElement('afterend', wrapper);
            el.remove();

            // setting class
            carousel.state = 'shown';
            carousel.elements = {
                wrapper: wrapper,
                output: sel('.image-carousel-output', wrapper, false),
                controls: sel('.image-carousel-controls', wrapper, false),
                output_animation: sel('.image-carousel-output > div', wrapper, false),
                output_image: sel('.image-carousel-output--inner', wrapper, false),
                controls_counter: sel('.image-carousel-controls--counter', wrapper, false),
                controls_button_left: sel('.image-carousel-controls--left', wrapper, false),
                controls_button_right: sel('.image-carousel-controls--right', wrapper, false)
            };

            // register event handler
            carousel.elements.controls.addEventListener('click', (function(e) { carousel.events(e); }).bind(carousel));

            // drawing carousel
            carousel.draw();

        });

        return true;
    },

    create: function(images) {
        if(!images) return false;
        var carousel = new ImageCarousel();
        carousel.create();
        carousel.add(images);
        carousel.draw();
        carousel.show();

        return carousel;
    }

};

var dd = {
 
    init: function() {
        elsRem(sel('.dropdown-variants'));
        elsFunc(sel('.dropdown-select'), function(el) {
            var selectElement = sel('select[id="' + el.getAttribute('for') + '"]', false, el.parentNode);
            if(selectElement) {
                if(getComputedStyle(el.parentNode)['position'] == 'static') el.parentNode.style.position = 'relative';
                var obj = sel('option[value="' + selectElement.value + '"]', false, selectElement);
                el.innerHTML = obj ? obj.innerHTML : selectElement.value;
                var ddlist = document.createElement('div');
                var identifier = 0;
                ddlist.className = 'dropdown-variants';
                ddlist.style.width = el.offsetWidth - 20;
                ddlist.style.left = el.offsetLeft + 10;
                ddlist.style.top = getStyle(el, 'borderBottom').search('none') != -1 ? (el.offsetTop + el.offsetHeight):(el.offsetTop + el.offsetHeight - 1);
                ddlist.setAttribute('id', el.getAttribute('for'));
                elsFunc(sel('option', 1, selectElement), function(val) {
                    let option = document.createElement('div');
                    for(let i = 0; i < val.attributes.length; i++) {
                        if(val.attributes[i].name == 'class' || val.attributes[i].name == 'id') continue;
                        option.setAttribute(val.attributes[i].name, val.attributes[i].value);
                        if(val.attributes[i].name.substr(0, 2) != 'on') {
                            option[val.attributes[i].name] = val[val.attributes[i].name];
                        }
                    }
                    option.setAttribute('id', (identifier + ' ' + (val.getAttribute('id') || '')).replace(/ $/, ''));
                    option.className = ('dropdown-option ' + val.className).replace(/ $/, '');
                    option.innerHTML = val.innerHTML;
                    if(!val.disabled) ddlist.appendChild(option);
                    identifier++;
                }); el.parentNode.insertAdjacentHTML('beforeend', ddlist.outerHTML);
            }
            el.addEventListener('transitionend', function() {
                if(getStyle(this, 'visibility') == 'hidden') this.style.visibility = 'hidden';
            });
            el.addEventListener('click', function() {
                var dropdown = sel('.dropdown-variants[id="' + this.getAttribute('for') + '"]', false, this.parentNode);
                dd.toggle(dropdown);
            });
        });
        elsFunc(sel('.dropdown-option'), function(el) { el.addEventListener('click', function() {
            var selectObject = sel('select[id="' + this.parentNode.getAttribute('id') + '"]', false, this.parentNode.parentNode);
            var optionNum = parseInt(this.getAttribute('id'));
            selectObject.value = sel('option', 1, selectObject)[optionNum].value;
            selectObject.dispatchEvent(new Event('change'));
            var obj = sel('option[value="' + selectObject.value + '"]', false, selectObject);
            sel('.dropdown-select[for="' + this.parentNode.getAttribute('id') + '"]', false, this.parentNode.parentNode).innerHTML = obj ? obj.innerHTML : selectObject.value;            
            dd.hide(this.parentNode);
        })});
    },
 
    toggle: function(dropdown) {
        elsFunc(sel('.dropdown-variants'), (ed) => { dd.hide(ed); });
        if(getStyle(dropdown, 'visibility') == 'hidden') dd.show(dropdown);
    },
 
    show: function(dropdown) {
        dropdown.style.visibility = 'visible';
        var ddMaxHeight = dropdown.scrollHeight;
        elsFunc(sel('*', 1, dropdown), function(el) {
            if(ddMaxHeight < 301) el.style.marginRight = '4px';
        });
        if(ddMaxHeight < 301) {
            dropdown.style.maxHeight = ddMaxHeight;
            dropdown.style.overflow = 'hidden';
        } else {
            dropdown.style.maxHeight = 301;
            dropdown.style.overflow = 'auto';
        }
    },
 
    hide: function(dropdown) {
        dropdown.style.visibility = 'hidden';
        dropdown.style.maxHeight = 0;
    }
 
}

var smart_tables = {

    init: function() {
        smart_tables.reset();
        var st = sel('.smart-table');
        smart_tables.tbls = {};
        st.forEach(function(tbl, idx) {
            smart_tables.tbls[idx] = {tbl};
            smart_tables.init_attr.forEach(function(attr, attr_key) {
                var attr_value = tbl.getAttribute(attr);
                if(isNumeric(attr_value)) attr_value = parseInt(attr_value);
                if(!attr_value) attr_value = smart_tables.init_attr_value[attr_key];
                tbl.setAttribute(attr, attr_value);
                tbl.setAttribute('idx', idx);
                smart_tables.tbls[idx][attr] = attr_value;
            });
            smart_tables.search.init(idx);
            if(smart_tables.autoLoadHandler(idx)) setTimeout(function() { 
                smart_tables.loadData(idx, true); 
            }, idx * 1000);
        });
    },

    loadData: function(idx, isInit, callback) {
        var st = smart_tables.tbls[idx], params, search;
        if(!st) return;
        if(st['params']) params = JSON.parse(st['params']);
        if(st['search'] && st['search']['req']) search = JSON.stringify(st['search']['req']);
        ajax.getjson(st['method'], Object.assign({ i: cookie('i'), server: getAsrv(), count: st['count'], offset: st['offset'], search }, params), function(data) {
            if(callback) callback();
            if(st['load_callback']) st['load_callback']();
            if(data.error) return topMsg(data.error.err_msg, 5, 'error'), smart_tables.showStart(idx, {empty: true});
            if(data.success == 0 && isInit) return smart_tables.showStart(idx, {empty: true});
            st['offset'] += st['count'];
            smart_tables.tpl(idx, data.success);
            smart_tables.colHandler(idx);
            smart_tables.buttonHandler(idx);
            smart_tables.stickableHandler(idx);
        });
    },

    loadDataButton: function(el, isStart) {
        if(!el) return;
        el.classList.add('white-load', 'white-no-transparent');
        smart_tables.loadData(parseInt(queryParent(el, '.smart-table').getAttribute('idx')), isStart, function() {
            el.classList.remove('white-load', 'white-no-transparent');
        });
    },

    autoLoadHandler: function(idx) {
        var st = smart_tables.tbls[idx];
        if(st && st['autoload'] == 1) {
            smart_tables.showStart(idx, {loader: true});
            return true;
        } else {
            smart_tables.showStart(idx, {download: true});
            if(st['autoload'] == 2) {
                var tpl = sel('.smart-table--row', st['tbl']);
                if(tpl && tpl[0]) st['tpl'] = tpl[0], tpl[0].remove();
                var after_delete = sel('.smart-table--row', st['tbl']);
                if(after_delete.length < 1) return smart_tables.showStart(idx, {empty: true});
                st['load_callback']();
            } return false;
        }
    },

    buttonHandler: function(idx) {
        var st = smart_tables.tbls[idx];
        if(!st) return;
        var stb = sel('.smart-table--button', st['tbl'], false);
        if(st['total'] > st['offset']) show(stb);
        else hide(stb);
    },

    colHandler: function(idx) {
        var st = smart_tables.tbls[idx];
        if(!st) return;
        elsFunc(sel('.smart-table--col[id]', st['tbl']), function(el) {
            var id = el.id;
            el.removeAttribute('id');
            if(['price', 'balance', 'money', 'bank', 'remain', 'sum', 'count', 'sum_got', 'sum_sent', 'sum_donate', 'sum_casino'].indexOf(id) != -1) {
                setStyle(el, {minWidth: '70px'});
                if(el.innerHTML.match('руб.')) el.innerHTML = numFormat(parseInt(el.innerHTML), 0, '', ' ') + ' руб.';
            }
            if(['date', 'appointment', 'date_time'].indexOf(id) != -1) {
                setStyle(el, {minWidth: '70px'});
                if(isNumeric(el.innerHTML)) {
                    var col_html = el.innerHTML, col_time = new specialTime(col_html);
                    el.innerHTML = '';
                    var new_div = ce('div', { innerHTML: col_time.text });
                    new_div.setAttribute('st-realtime', col_time.id);
                    new_div.setAttribute('tt_text', formatDate(col_html));
                    new_div.onmouseover = function() { tooltips.tt_black_down.show(new_div); };
                    new_div.style.cursor = 'default';
                    el.appendChild(new_div);
                }
            }
        });
    },

    stickableHandler: function(idx) {
        if(typeof Stickable != 'function') return;
        var st = smart_tables.tbls[idx];
        if(!st || !st['stickable'] || st['stickable_active']) return;
        var sth = sel('.smart-table--header', st['tbl'], false);
        if(!sth) return;
        stickable(sth, 'top', 0, st['tbl']);
        st['stickable_active'] = 1;
    },

    showStart: function(idx, opts, callback) {
        opts = opts || {};
        var st = smart_tables.tbls[idx];
        if(!st) return;
        var st_s = sel('.smart-table--start', st['tbl'], false),
            st_w = sel('.smart-table--wrapper', st['tbl'], false),
            st_sl = sel('.smart-table-start--loader', st_s, false),
            st_se = sel('.smart-table-start--empty', st_s, false),
            st_sd = sel('.smart-table-start--download', st_s, false);
        hide(st_w), show(st_s);
        hide(st_sl), hide(st_se), hide(st_sd);
        if(opts.loader) show(st_sl);
        if(opts.empty) show(st_se);
        if(opts.download) show(st_sd);
        if(callback) callback();
        st['load_callback'] = function() {
            hide(st_s), show(st_w);
            st['load_callback'] = 0;
        }
    },

    reset: function(idx, no_tpl) {
        var req_idx = '[idx]';
        if(idx) req_idx = '[idx="'+idx+'"]';
        var st_idx = sel('.smart-table'+req_idx);
        st_idx.forEach(function(tbl) {
            var idx = parseInt(tbl.getAttribute('idx')), 
                st = smart_tables.tbls[idx];
            if(!st) return;
            var parent = sel('table', st['tbl'], false),
                str = sel('.smart-table--row', parent);
            elsRem(str);
            if(!no_tpl) parent.appendChild(st['tpl']);
            st['offset'] = 0, st['total'] = 0;
        });
    },

    tpl: function(idx, data) {
        var st = smart_tables.tbls[idx];
        if(!st || !data) return;
        var parent = sel('table', st['tbl'], false);
        data.forEach(function(obj, i) {
            if(i == 0) return st['total'] = obj;
            var row_tpl = st['tpl'];
            if(!st['tpl']) {
                var tpl = sel('.smart-table--row', st['tbl'], false);
                if(!tpl) return;
                st['tpl'] = tpl;
                row_tpl = tpl;
                tpl.remove();
            }
            var row_cln = row_tpl.cloneNode(true);
            elsFunc(row_cln.cells, function(child) {
                child.innerHTML = child.innerHTML.replace(/{([A-Z_]+)}/gi, function(match, p1) { 
                    child.setAttribute('id', p1);
                    return obj[p1];
                });
            });
            parent.appendChild(row_cln);
        });
    },

    search: {

        init: function(idx) {
            var st = smart_tables.tbls[idx];
            if(!st) return;
            var sths = sel('.smart-table-header--search', st['tbl'], false);
            if(!sths) return;
            var stsi = sel('.smart-table-search--icon', sths, false),
                stsw = sel('.smart-table-search--wrapper', sths, false),
                stsw_input = sel('.smart-table-search--input', stsw, false),
                stsw_field = sel('#search_fields', stsw, false);
            if(!st['search']) st['search'] = {'block': sths, 'icon': stsi, 'wrapper': stsw, 'input': stsw_input, 'field': stsw_field};
            show(sths);
            stsi.addEventListener('click', function() { smart_tables.search.toggle(st); });
            stsw_input.addEventListener('input', function() { smart_tables.search.go(st); });
            stsw_field.addEventListener('change', function() { smart_tables.search.go(st); });
        },

        toggle: function(st) {
            if(!st) return;
            var search = smart_tables.search, st_s = st['search'];
            clearClasses(st_s['icon']);
            if(!search.active) {
                st_s['icon'].classList.add('svg-close');
                show(st_s['wrapper']);
                dd.init();
                search.active = true;
            } else {
                st_s['icon'].classList.add('svg-search');
                hide(st_s['wrapper']);
                search.active = false;
            }
        },

        go: function(st) {
            if(!st) return;
            var search = smart_tables.search, st_s = st['search'], input = st_s['input'].value, field = st_s['field'].value;
            if(!field) return;
            clearTimeout(search.timer_go);
            search.timer_go = setTimeout(() => {
                clearClasses(st_s['icon']);
                if(input) st_s['req'] = [input, field];
                else st_s['req'] = 0;
                st_s['icon'].classList.add('white-load');
                smart_tables.reset(st['idx'], true);
                smart_tables.loadData(st['idx'], true, function() {
                    st_s['icon'].classList.remove('white-load');
                    st_s['icon'].classList.add('svg-close');
                });
            }, 500);
        },

        active: false,
        timer_go: false

    },

    tbls: {},
    init_attr: ['method', 'autoload', 'params', 'stickable', 'count', 'offset', 'total', 'idx'],
    init_attr_value: [0, 0, 0, 1, 15, 0, 0, 0],

}

var gmNotify = {

    get: function() {
        var pnb = ge('page_notify_box'),
            ct = Math.floor(Date.now() / 1000),
            gmn = parseInt(cookie('gmn'));
        if(ct < gmn && gmn) return;
        ajax.getjson('tools.getIpLocate', false, function(data) {
            if(data.success && data.success.country == 'Ukraine' || cookie('gmn_test')) {
                pnb.innerHTML = gmNotify.tpl({title: 'Для игроков из Украины мы подготовили специальную инструкцию как пользоваться социальной сетью ВКонтакте', view_href: '/faq/uk_vk'});
                setStyle(pnb, {transition: isMobile ? 'unset':'', height: sel('.page-notify-box--wrap', false, pnb).clientHeight, opacity: '1'});
            } else cookie('gmn', ct + 86400);
        });
    },

    close: function(el) {
        var pnb = ge('page_notify_box'),
            pnbw = queryParent(el, '.page-notify-box--wrap');
        setStyle(pnb, {transition: isMobile ? 'unset':'', height: '0', opacity: '0'});
        pnbw.remove();
        cookie('gmn', Math.floor(Date.now() / 1000) + 86400);
    },

    tpl: function(data) {
        var html  = '<div class="page-notify-box--wrap">';
            html +=     '<div class="page-notify-box--text">'+data.title+'</div>';
            html +=     '<div class="page-notify-box--links">';
            html +=         '<a class="page-notify-box--item" href="'+data.view_href+'" onClick="return modality.show(this, event);">Посмотреть</a>';
            html +=         '<div class="divider"></div>';
            html +=         '<a class="page-notify-box--item" onClick="gmNotify.close(this);">Закрыть</a>';
            html +=     '</div>';
            html += '</div>';
        return html;
    }

}

var topNotifier = {

    show: function(el, ev) {
        var nt = geByClass1('top-notify-wrap', ge('page_header_wrap')),
            ntCount = geByClass1('top-notify-count', ge('page_header_wrap')),
            ntList = geByClass1('top-notify-list', nt), 
            ntEmpty = geByClass1('top-notify-empty', nt),
            ntResult = geByClass1('notify-result', nt), 
            ntSpinner = geByClass1('spinner-load', nt);
        if(!cookie('i')) return;
        if(nt.classList.contains('shown')) return nt.classList.remove('shown'), eventOff(document.body, 'click', '.user-menu-notify');
        if(!isVisible(ntSpinner)) show(ntSpinner);
        nt.classList.add('shown');
        ntResult.innerHTML = '', ntList.innerHTML = '';
        eventFunc(document.body, 'click', '.user-menu-notify', topNotifier.hide);
        ajax.getjson('account.getNotify', { i: cookie('i') }, function(data) {
            if(isVisible(ntEmpty)) hide(ntEmpty);
            if(isVisible(ntSpinner)) hide(ntSpinner);
            if(data.error) return msgBox(ntResult, 'err', data.error.err_msg);
            if(data.success == 0) return show(ntEmpty);
            show(ntList);
            data.success.forEach(data => {
                if(data.sender && data.comment) ntList.insertAdjacentHTML('afterbegin', '<div class="top-notify-item'+(parseInt(data.seen) ? '':' __new')+'"><div class="top-item-avatar" style="background: url(\'/images/avatars/'+data.sender.avatar+'.jpg\');"></div><div class="top-item-content"><div class="top-item-text">'+pa(data.text, '<a href="/'+data.sender.server+'/'+data.sender.name+'" onClick="return nav.go(this, event);">'+data.sender.name+'</a>', '<a href="'+data.comment.page+'" onClick="return nav.go(this, event);">'+data.comment.text+'</a>')+'</div></div></div>');
                else ntList.insertAdjacentHTML('afterbegin', '<div class="top-notify-item'+(parseInt(data.seen) ? '':' __new')+'"><div class="top-item-icon _info"></div><div class="top-item-content"><div class="top-item-text">'+data.text+'</div></div></div>');
                elsFunc(sel('.__new'), function(el) { 
                    ntCount.innerHTML = parseInt(ntCount.innerHTML) - 1;
                    if(parseInt(ntCount.innerHTML) < 1) hide(ntCount);
                    else show(ntCount);
                    setTimeout(function() { el.classList.remove('__new'); }, 2000); 
                });
            });
        });
    },

    hide: function() {
        var nt = geByClass1('top-notify-wrap', ge('page_header_wrap'));
        if(!nt) return;
        if(!nt.classList.contains('shown')) return;
        nt.classList.remove('shown');
    }

}

function uploadImage() {
    // Инициализация наших переменных
    var files = ge('input_file').files,
        files_data = [],
        files_complete = [],
        files_loaded = 0,
        sf = ge('select_files'), 
        sd = ge('status_bar');

    // Проверки
    if(!cookie('i')) return topMsg('Ошибка безопасности. Необходима авторизация в системе', 5, 'error');
    if(files.length > 10) return topMsg('Превышен лимит загрузки в 10 файлов', 5, 'error');

    // Перед загрузкой файлов, мы их должны отфильтровать
    for(i = 0; i < files.length; i++) {
        var file = files[i];
        if(!hasExtension(file.name, ['.jpg', '.gif', '.png'])) return topMsg('Один из файлов не формата JPG, PNG или GIF', 5, 'error');
        if(file.size > 5242880) return topMsg('Одно из изображений превышает лимит в 5 MB', 5, 'error');
        var fd = new FormData();
        fd.append('i', cookie('i'));
        fd.append('file', file);
        files_data.push([file, fd, 0, 0]);
    }

    // Для каждой загрузки, создаем и показываем статус бары
    hide(sf), show(sd);
    elsRem(sel('.upload-form--progress:not(._ufp_tpl)', sd));
    files_data.forEach(function(file_data) {
        var sd_prog_tpl = sel('.upload-form--progress._ufp_tpl', sd, false);
        var sd_prog = sd_prog_tpl.cloneNode(true);
        sd_prog.classList.remove('_ufp_tpl');
        sd.appendChild(sd_prog);
        var sd_prog_bar = sel('.upload-form--bar', sd_prog, false);
        file_data[2] = sd_prog;
        file_data[3] = sd_prog_bar;
    });

    // Теперь же их можно загружать
    files_data.forEach(function(file_data, idx) {
        ajax.postfile('system.uploadImage', file_data[1], function(e) {
            if(!e.lengthComputable) return;
            var sd_prog = file_data[3];
            if(!sd_prog) return;
            sd_prog.style.width = ((e.loaded / e.total) * 100) + '%';
        }, function(data) {
            if(data.error) return topMsg(data.error.err_msg, 10, 'error');
            files_loaded ++;
            files_complete[idx] = data.success;
            if(files_data.length === files_loaded && arpCallback) {
                arpCallback(files_complete);
                modality.hide();
            }
        }, uploadImage);
    });
}

function importVideo(el) {
    var input = sel('input[type="text"]')[0];
    if(!input.value.match(/^<iframe .*><\/iframe>$/)) return topMsg('Неверный формат, требуется iframe видеозапись', 10, 'error');
    if(arpCallback) arpCallback(input.value);
}

// FX

var Fx = {
    
    Transitions: {
        linear: function(t, b, c, d) { return c*t/d + b; },
        sineInOut: function(t, b, c, d) { return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b; },
        halfSine: function(t, b, c, d) { return c * (Math.sin(Math.PI * (t/d) / 2)) + b; },
        easeOutBack: function(t, b, c, d) { var s = 1.70158; return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b; },
        easeInCirc: function(t, b, c, d) { return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b; },
        easeOutCirc: function(t, b, c, d) { return c * Math.sqrt(1 - (t=t/d-1)*t) + b; },
        easeInQuint: function(t, b, c, d) { return c*(t/=d)*t*t*t*t + b; },
        easeOutQuint: function(t, b, c, d) { return c*((t=t/d-1)*t*t*t*t + 1) + b; },
        easeOutCubic: function(t, b, c, d) { return c*((t=t/d-1)*t*t + 1) + b; },
        swiftOut: function(t, b, c, d) { return c * cubicBezier(0.4, 0, 0.22, 1, t/d, 4/d) + b; }
    },
    Attrs: [
        [ 'height', 'marginTop', 'marginBottom', 'paddingTop', 'paddingBottom' ],
        [ 'width', 'marginLeft', 'marginRight', 'paddingLeft', 'paddingRight' ],
        [ 'opacity', 'left', 'top' ]
    ],
    Timers: [],
    TimerId: null
    
}, fx = Fx;

Fx.Base = function(el, options, name) {
    this.el = ge(el);
    this.name = name;
    this.options = extend({
        onStep: function(){},
        onComplete: function() {},
        transition: options.transition || Fx.Transitions.sineInOut,
        duration: 500
    }, options || {});
}

Fx.Base.prototype = {
    start: function(from, to){
        this.from = from;
        this.to = to;
        this.time = arpNow();
        this.isTweening = true;

        var self = this;
        function t(gotoEnd) {
            return self.step(gotoEnd);
        }
        t.el = this.el;
        if (t() && Fx.Timers.push(t) && !Fx.TimerId) {
            Fx.TimerId = setInterval(function() {
                var timers = Fx.Timers, l = timers.length;
                for (var i = 0; i < l; i++) {
                    if (!timers[i]()) {
                        timers.splice(i--, 1);
                        l--;
                    }
                }
                if (!l) {
                    clearInterval(Fx.TimerId);
                    Fx.TimerId = null;
                }
            }, 13);
        }
        return this;
    },

    stop: function(gotoEnd) {
        var timers = Fx.Timers;
        for (var i = timers.length - 1; i >= 0; i--) {
            if (timers[i].el == this.el ) {
                if (gotoEnd) {
                    timers[i](true);
                }
                timers.splice(i, 1);
            }
        }
        this.isTweening = false;
    },

    step: function(gotoEnd) {
        var time = arpNow();
        if (!gotoEnd && time < this.time + this.options.duration) {
            this.cTime = time - this.time;
            this.now = {};
            for (p in this.to) {
                if (isArray(this.to[p])) {
                    var color = [], j;
                    for (j = 0; j < 3; j++) {
                        if (this.from[p] === undefined || this.to[p] === undefined) {
                            return false;
                        }
                        color.push(Math.min(parseInt(this.compute(this.from[p][j], this.to[p][j])), 255));
                    }
                    this.now[p] = color;
                } else {
                    this.now[p] = this.compute(this.from[p], this.to[p]);
                    if (this.options.discrete) this.now[p] = intval(this.now[p]);
                }
            }
            this.update();
            return true;
        } else {
            setTimeout(this.options.onComplete.bind(this, this.el), 10);
            this.now = extend(this.to, this.options.orig);
            this.update();
            if (this.options.hide) hide(this.el);
            this.isTweening = false;
            return false;
        }
    },

    compute: function(from, to){
        var change = to - from;
        return this.options.transition(this.cTime, from, change, this.options.duration);
    },

    update: function(){
        this.options.onStep(this.now);
        for (var p in this.now) {
            if (isArray(this.now[p])) setStyle(this.el, p, 'rgb(' + this.now[p].join(',') + ')');
            else this.el[p] != undefined ? (this.el[p] = this.now[p]) : setStyle(this.el, p, this.now[p]);
        }
    },

    cur: function(name, force){
        if (this.el[name] != null && (!this.el.style || this.el.style[name] == null))
        return this.el[name];
        return parseFloat(getStyle(this.el, name, force)) || 0;
    }
};

function genFx(type, num) {
    var obj = {};
    each(Fx.Attrs.concat.apply([], Fx.Attrs.slice(0, num)), function() {
        obj[this] = type;
    });
    return obj;
}

// DOM
function rand(mi, ma) { return Math.random() * (ma - mi + 1) + mi; }
function irand(mi, ma) { return Math.floor(rand(mi, ma)); }
function isUndefined(obj) { return typeof obj === 'undefined' };
function isFunction(obj) {return obj && Object.prototype.toString.call(obj) === '[object Function]'; }
function isArray(obj) { return Object.prototype.toString.call(obj) === '[object Array]'; }
function isString(obj) { return typeof obj === 'string'; }
function isObject(obj) { return Object.prototype.toString.call(obj) === '[object Object]'; }
function isEmpty(o) { if(Object.prototype.toString.call(o) !== '[object Object]') {return false;} for(var i in o){ if(o.hasOwnProperty(i)){return false;} } return true; }
function arpNow() { return +new Date; }
function arpImage() { return window.Image ? (new Image()) : ce('img'); } // IE8 workaround
function stripHTML(text) { return text ? text.replace(/<(?:.|\s)*?>/g, '') : ''; }
function escapeRE(s) { return s ? s.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1') : ''; }
function boundingRectEnabled(obj) { return (typeof obj.getBoundingClientRect !== 'undefined'); }
function numFormat(number, decimals, decSeparator, thousandsSeparator) { return parseFloat(number).toLocaleString('en-US', {maximumFractionDigits:decimals}).replace(/\./g, '|'+decSeparator).replace(/,/g, '|'+thousandsSeparator).replace(/\|/g, ''); }
function intval(value) {
    if (value === true) return 1;
    return parseInt(value) || 0;
}
function floatval(value) {
    if (value === true) return 1;
    return parseFloat(value) || 0;
}
function boolval(str) {
    return /true/i.test(str);
}
function positive(value) {
    value = intval(value);
    return value < 0 ? 0 : value;
}
function isNumeric(value) {
    return !isNaN(value);
}
function isVisible(elem) {
    elem = ge(elem);
    if (!elem || !elem.style) return false;
    return getStyle(elem, 'display') != 'none';
}
function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
}
function hasExtension(name, exts) {
    return (new RegExp('(' + exts.join('|').replace(/\./g, '\\.') + ')$')).test(name);
}
function trim(str, chr) {
    var rgxtrim = (!chr) ? new RegExp('^\\s+|\\s+$', 'g') : new RegExp('^'+chr+'+|'+chr+'+$', 'g');
    return str.replace(rgxtrim, '');
}
function rtrim(str, chr) {
    var rgxtrim = (!chr) ? new RegExp('\\s+$') : new RegExp(chr+'+$');
    return str.replace(rgxtrim, '');
}
function ltrim(str, chr) {
    var rgxtrim = (!chr) ? new RegExp('^\\s+') : new RegExp('^'+chr+'+');
    return str.replace(rgxtrim, '');
}
function isNickname(name) {
    return name.match(/^([A-Za-z]+)_([A-Za-z]+)$/);
}

function ge(el) {
    return (typeof el == 'string' || typeof el == 'number') ? document.getElementById(el) : el;
}
function geByTag(searchTag, node) {
    node = ge(node) || document;
    return node.getElementsByTagName(searchTag);
}
function gpeByClass(className, elem, stopElement) {
    elem = ge(elem);
    if (!elem) return null;
    while (stopElement !== elem && (elem = elem.parentNode)) {
        if (hasClass(elem, className)) return elem;
    }
    return null;
}
function geByClass1(searchClass, node, tag) {
    node = ge(node) || document;
    tag = tag || '*';
    return node.querySelector && node.querySelector(tag + '.' + searchClass) || geByClass(searchClass, node, tag)[0];
}
function geByClass(searchClass, node, tag) {
    
    node = ge(node) || document;
    tag = tag || '*';
    var classElements = [];

    if (node.querySelectorAll && tag != '*') {
        return node.querySelectorAll(tag + '.' + searchClass);
    }
    
    if (node.getElementsByClassName) {  
        var nodes = node.getElementsByClassName(searchClass);
        if (tag != '*') {
            tag = tag.toUpperCase();
            for (var i = 0, l = nodes.length; i < l; ++i) {
                if (nodes[i].tagName.toUpperCase() == tag) {
                    classElements.push(nodes[i]);
                }
            } 
        } else {
            classElements = Array.prototype.slice.call(nodes);  
        }
        return classElements;
    }
    
    var els = geByTag(tag, node);
    var pattern = new RegExp('(^|\\s)' + searchClass + '(\\s|$)');
    for (var i = 0, l = els.length; i < l; ++i) {
        if (pattern.test(els[i].className)) {
            classElements.push(els[i]);
        }
    }
    
    return classElements;
    
}
function getSelectedNode(parentName) {
    if(document.selection) return document.selection.createRange().parentElement();
    var selection = window.getSelection();
    if(selection.rangeCount > 0) {
        var container = selection.getRangeAt(0).startContainer;
        if(!parentName) return container.parentNode;
        while(container.nodeName != parentName && container.parentNode) container = container.parentNode;
        return container.nodeName == parentName ? container : false;
    }
}
function insertNodeInSelection(node) {
    var sel, range, html;
    if(window.getSelection) {
        sel = window.getSelection();
        if(sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.collapse(false);
            range.insertNode(node);
        }
    } else if(document.selection && document.selection.createRange) {
        range = document.selection.createRange();
        range.collapse(false);
        html = (node.nodeType === 3) ? node.data : node.outerHTML;
        range.pasteHTML(html);
    }
}
function extend() {
    var a = arguments, target = a[0] || {}, i = 1, l = a.length, deep = false, options;
    if (typeof target === 'boolean') {
        deep = target;
        target = a[1] || {};
        i = 2;
    }
    
    if (typeof target !== 'object' && !isFunction(target)) target = {};

    for (; i < l; ++i) {
        if ((options = a[i]) != null) {
            for (var name in options) {
                var src = target[name], copy = options[name];
                if (target === copy) continue;
                if (deep && copy && typeof copy === 'object' && !copy.nodeType) {
                    target[name] = extend(deep, src || (copy.length != null ? [] : {}), copy);
                } else if (copy !== undefined) {
                    target[name] = copy;
                }
            }
        }
    }
    return target;
}
function getRGB(color) {
    var result;
    if (color && isArray(color) && color.length == 3)
        return color;
    if (result = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(color))
        return [parseInt(result[1]), parseInt(result[2]), parseInt(result[3])];
    if (result = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(color))
        return [parseFloat(result[1])*2.55, parseFloat(result[2])*2.55, parseFloat(result[3])*2.55];
    if (result = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(color))
        return [parseInt(result[1],16), parseInt(result[2],16), parseInt(result[3],16)];
    if (result = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(color))
        return [parseInt(result[1]+result[1],16), parseInt(result[2]+result[2],16), parseInt(result[3]+result[3],16)];
}
function getColor(elem, attr) {
    var color;
    do {
        color = getStyle(elem, attr);
        if (!color.indexOf('rgba')) color = '';
        if (color != '' && color != 'transparent' || elem.nodeName.toLowerCase() == 'body') {
            break;
        }
        attr = 'backgroundColor';
    } while (elem = elem.parentNode);
    return getRGB(color);
}
function setStyle(elem, name, value){
    elem = ge(elem);
    if (!elem) return;
    if (typeof name == 'object') return each(name, function(k, v) { setStyle(elem,k,v); });
    if (name == 'opacity') {
        if (browser.msie) {
            if ((value + '').length) {
                if (value !== 1) {
                    elem.style.filter = 'alpha(opacity=' + value * 100 + ')';
                } else {
                    elem.style.filter = '';
                }
            } else {
                elem.style.cssText = elem.style.cssText.replace(/filter\s*:[^;]*/gi, '');
            }
            elem.style.zoom = 1;
        };
        elem.style.opacity = value;
    } else {
        try {
            var isN = typeof(value) == 'number';
            if (isN && (/height|width/i).test(name)) value = Math.abs(value);
            elem.style[name] = isN && !(/z-?index|font-?weight|opacity|zoom|line-?height/i).test(name) ? value + 'px' : value;
        } catch(e) { debugLog('setStyle error: ', [name, value], e); }
    }
}
function getStyle(elem, name, force) {
    elem = ge(elem);
    if (isArray(name)) { var res = {}; each(name, function(i,v){res[v] = getStyle(elem, v);}); return res; }
    if (!elem) return '';
    if (force === undefined) {
        force = true;
    }
    if (!force && name == 'opacity' && browser.msie) {
        var filter = elem.style['filter'];
        return filter ? (filter.indexOf('opacity=') >= 0 ?
        (parseFloat(filter.match(/opacity=([^)]*)/)[1] ) / 100) + '' : '1') : '';
    }
    if (!force && elem.style && (elem.style[name] || name == 'height')) {
        return elem.style[name];
    }
    
    var ret, defaultView = document.defaultView || window;
    if (defaultView.getComputedStyle) {
        name = name.replace(/([A-Z])/g, '-$1').toLowerCase();
        var computedStyle = defaultView.getComputedStyle(elem, null);
        if (computedStyle) {
            ret = computedStyle.getPropertyValue(name);
        }
    } else if (elem.currentStyle) {
        if (name == 'opacity' && browser.msie) {
            var filter = elem.currentStyle['filter'];
            return filter && filter.indexOf('opacity=') >= 0 ?
            (parseFloat(filter.match(/opacity=([^)]*)/)[1]) / 100) + '' : '1';
        }
        var camelCase = name.replace(/\-(\w)/g, function(all, letter){
            return letter.toUpperCase();
        });
        ret = elem.currentStyle[name] || elem.currentStyle[camelCase];
        if (ret == 'auto') {
            ret = 0;
        }

        ret = (ret + '').split(' ');
        each(ret, function(i,v) {
            if (!/^\d+(px)?$/i.test(v) && /^\d/.test(v)) {
                var style = elem.style, left = style.left, rsLeft = elem.runtimeStyle.left;
                elem.runtimeStyle.left = elem.currentStyle.left;
                style.left = v || 0;
                ret[i] = style.pixelLeft + 'px';
                style.left = left;
                elem.runtimeStyle.left = rsLeft;
            }
        });
        ret = ret.join(' ');
    }

    if (force && (name == 'width' || name == 'height')) {
        var ret2 = getSize(elem, true)[({'width': 0, 'height': 1})[name]];
        ret = (intval(ret) ? Math.max(floatval(ret), ret2) : ret2) + 'px';
    }

    return ret;
}
function data(elem, name, data) {
    if (!elem) return false;
    var id = elem[arpExpand], undefined;
    if (data !== undefined) {
        if (!arpCache[id]) arpCache[id] = {};
        arpCache[id][name] = data;
    }
    return name ? arpCache[id] && arpCache[id][name] : id;
}
function animate(el, params, speed, callback) {
    el = ge(el);
    if (!el) return;
    var _cb = isFunction(callback) ? callback : function() {};
    var options = extend({}, typeof speed == 'object' ? speed : {duration: speed, onComplete: _cb});
    var fromArr = {}, toArr = {}, visible = isVisible(el), self = this, p;
    options.orig = {};
    params = clone(params);
    if (params.discrete) {
        options.discrete = 1;
        delete(params.discrete);
    }
    
    var tween = data(el, 'tween'), i, name, toggleAct = visible ? 'hide' : 'show';
    if (tween && tween.isTweening) {
        options.orig = extend(options.orig, tween.options.orig);
        tween.stop(false);
        if (tween.options.show) toggleAct = 'hide';
        else if (tween.options.hide) toggleAct = 'show';
    }
    for (p in params) {
        if (!tween && (params[p] == 'show' && visible || params[p] == 'hide' && !visible)) {
            return options.onComplete.call(this, el);
        }
        if ((p == 'height' || p == 'width') && el.style) {
            if (!params.overflow) {
                if (options.orig.overflow == undefined) {
                    options.orig.overflow = getStyle(el, 'overflow');
                }
                el.style.overflow = 'hidden';
            }
            if (!hasClass(el, 'inl_bl') && el.tagName != 'TD') {
                el.style.display = 'block';
            }
        }
        if (/show|hide|toggle/.test(params[p])) {
            if (params[p] == 'toggle') {
                params[p] = toggleAct;
            }
            if (params[p] == 'show') {
                var from = 0;
                options.show = true;
                if (options.orig[p] == undefined) {
                    options.orig[p] = getStyle(el, p, false) || '';
                    setStyle(el, p, 0);
                }

                var o = options.orig[p];
                var old = el.style[p];
                el.style[p] = o;
                params[p] = parseFloat(getStyle(el, p, true));
                el.style[p] = old;

                if (p == 'height' && browser.msie && !params.overflow) {
                    el.style.overflow = 'hidden';
                }
            } else {
                if (options.orig[p] == undefined) {
                    options.orig[p] = getStyle(el, p, false) || '';
                }
                options.hide = true;
                params[p] = 0;
            }
        }
    }
    if (options.show && !visible) {
        show(el);
    }
    tween = new Fx.Base(el, options);
    each(params, function(name, to) {
        if(/backgroundColor|borderBottomColor|borderLeftColor|borderRightColor|borderTopColor|color|borderColor|outlineColor/.test(name)) {
            var p = (name == 'borderColor') ? 'borderTopColor' : name;
            from = getColor(el, p);
            to = getRGB(to);
            if (from === undefined) return;
        } else {
            var parts = to.toString().match(/^([+-]=)?([\d+-.]+)(.*)$/),
            start = tween.cur(name, true) || 0;
            if (parts) {
                to = parseFloat(parts[2]);
                if (parts[1]) {
                    to = ((parts[1] == '-=' ? -1 : 1) * to) + to;
                }
            }

            from = tween.cur(name, true);
            if (from == 0 && (name == 'width' || name == 'height'))
            from = 1;

            if (name == 'opacity' && to > 0 && !visible) {
                setStyle(el, 'opacity', 0);
                from = 0;
                show(el);
            }
        }
        if (from != to || (isArray(from) && from.join(',') == to.join(','))) {
            fromArr[name] = from;
            toArr[name] = to;
        }
    });
    
    tween.start(fromArr, toArr);
    data(el, 'tween', tween);
    return tween;
}
function getXYRect(obj, notBounding) {
    var rect;
    if (notBounding && getStyle(obj, 'display') == 'inline') {
        var rects = obj.getClientRects();
        rect = rects && rects[0] || obj.getBoundingClientRect();
    } else {
        rect = obj.getBoundingClientRect();
    }
    return rect;
}
function getXY(obj, forFixed) {
    obj = ge(obj);
    if (!obj) return [0,0];

    var docElem, win,
    rect = {top: 0, left: 0},
    doc = obj.ownerDocument;
    if (!doc) {
        return [0, 0];
    }
    docElem = doc.documentElement;

    if (boundingRectEnabled(obj)) {
        rect = getXYRect(obj, true);
    }
    win = doc == doc.window ? doc : (doc.nodeType === 9 ? doc.defaultView || doc.parentWindow : false);
    return [
        rect.left + (!forFixed ? win.pageXOffset || docElem.scrollLeft : 0) - (docElem.clientLeft || 0),
        rect.top + (!forFixed ? win.pageYOffset || docElem.scrollTop : 0) - (docElem.clientTop || 0)
    ];
}
function isWindow(el) {
    return el != null && el === el.window;
}
function getSize(elem, withoutBounds, notBounding) {
    elem = ge(elem);
    var s = [0, 0], de = document.documentElement, rect;
    if (withoutBounds && getStyle(elem, 'boxSizing') === 'border-box') {
        withoutBounds = false;
    }
    if (elem == document) {
        s = [Math.max(
            de.clientWidth,
            bodyNode.scrollWidth, de.scrollWidth,
            bodyNode.offsetWidth, de.offsetWidth
        ), Math.max(
            de.clientHeight,
            bodyNode.scrollHeight, de.scrollHeight,
            bodyNode.offsetHeight, de.offsetHeight
        )];
    } else if (elem) {
        function getWH() {
            if (boundingRectEnabled(elem) && (rect = getXYRect(elem, notBounding)) && rect.width !== undefined) {
                s = [rect.width, rect.height];
            } else {
                s = [elem.offsetWidth, elem.offsetHeight];
            }
            if (!withoutBounds) return;
            var padding = 0, border = 0;
            each(s, function(i, v) {
                var which = i ? ['Top', 'Bottom'] : ['Left', 'Right'];
                each(which, function(){
                    s[i] -= parseFloat(getStyle(elem, 'padding' + this)) || 0;
                    s[i] -= parseFloat(getStyle(elem, 'border' + this + 'Width')) || 0;
                });
            });
        }
        if (!isVisible(elem)) {
            var props = {position: 'absolute', visibility: 'hidden', display: 'block'};
            var old = {}, old_cssText = false;
            if (elem.style.cssText.indexOf('!important') > -1) {
                old_cssText = elem.style.cssText;
            }
            each(props, function(i, v) {
                old[i] = elem.style[i];
                elem.style[i] = v;
            });
            getWH();
            each(props, function(i, v) {
                elem.style[i] = old[i];
            });
            if (old_cssText) {
                elem.style.cssText = old_cssText;
            }
        } else getWH();
    }
    return s;
}
function clearClasses(el) {
    var classList = el.classList;
    classList.forEach(function(arr, idx) {
        if(idx != 0) classList.remove(arr);
    });
}
function toURL(obj) {
    var str = "";
    for (var key in obj) {
        if (str != "") str += "&";
        str += key + "=" + encodeURIComponent(obj[key]);
    }
    return str;
}
function serialize(form) {
    var field, s = [];
    if (typeof form == 'object' && form.nodeName == "FORM") {
        var len = form.elements.length;
        for (i=0; i<len; i++) {
            field = form.elements[i];
            if (field.name && !field.disabled && field.type != 'file' && field.type != 'reset' && field.type != 'submit' && field.type != 'button') {
                if (field.type == 'select-multiple') {
                    for (j=form.elements[i].options.length-1; j>=0; j--) {
                        if(field.options[j].selected)
                            s[s.length] = encodeURIComponent(field.name) + "=" + encodeURIComponent(field.options[j].value);
                    }
                } else if ((field.type != 'checkbox' && field.type != 'radio') || field.checked) {
                    s[s.length] = encodeURIComponent(field.name) + "=" + encodeURIComponent(field.value);
                }
            }
        }
    }
    return s.join('&').replace(/%20/g, '+');
}
function ce(tagName, attr, style) {
    var el = document.createElement(tagName);
    if (attr) extend(el, attr);
    if (style) setStyle(el, style);
    return el;
}
function each(object, callback) {
    if (!isObject(object) && typeof object.length !== 'undefined') {
        for (var i = 0, length = object.length; i < length; i++) {
            var value = object[i];
            if (callback.call(value, i, value) === false) break;
        }
    } else {
        for (var name in object) {
            if(!Object.prototype.hasOwnProperty.call(object, name)) continue;
            if(callback.call(object[name], name, object[name]) === false) break;
        }
    }
    return object;
}
function clone(obj, req) {
    var newObj = !isObject(obj) && typeof obj.length !== 'undefined' ? [] : {};
    for (var i in obj) {
        if (/webkit/i.test(_ua) && (i == 'layerX' || i == 'layerY' || i == 'webkitMovementX' || i == 'webkitMovementY')) continue;
        if (req && typeof(obj[i]) === 'object' && i !== 'prototype' && obj[i] !== null) {
            newObj[i] = clone(obj[i]);
        } else {
            newObj[i] = obj[i];
        }
    }
    return newObj;
}

function attr(el, attrName, value) {
    el = ge(el);
    if (typeof value == 'undefined') {
        return el.getAttribute(attrName);
    } else {
        el.setAttribute(attrName, value);
        return value;
    }
}
function removeAttr(el) {
    for (var i = 0, l = arguments.length; i < l; ++i) {
        var n = arguments[i];
        if (el[n] === undefined) continue;
        try {
            delete el[n];
        } catch(e) {
            try {
                el.removeAttribute(n);
            } catch(e) {}
        }
    }
}
function domEL(el, p) {
  p = p ? 'previousSibling' : 'nextSibling';
  while (el && !el.tagName) el = el[p];
  return el;
}
function domNS(el) {
  return domEL((el || {}).nextSibling);
}
function domPS(el) {
  return domEL((el || {}).previousSibling, 1);
}
function domFC(el) {
  return domEL((el || {}).firstChild);
}
function domLC(el) {
  return domEL((el || {}).lastChild, 1);
}
function domPN(el) {
  return (el || {}).parentNode;
}
function domChildren(el) {
    var chidlren = [];
    var nodes = el.childNodes;
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].tagName) {
            chidlren.push(nodes[i]);
        }
    }
    return chidlren;
}
function show(elem) {
    var l = arguments.length;
    if (l > 1) {
        for (var i = 0; i < l; i++) {
            show(arguments[i]);
        } return;
    }

    elem = ge(elem);
    if(!elem || !elem.style) return;
    var old = elem.olddisplay;
    var newStyle = 'block';
    var tag = elem.tagName.toLowerCase();
    elem.style.display = old || '';

    if(getStyle(elem, 'display') !== 'none') return;
    if(hasClass(elem, 'inline') || hasClass(elem, '_inline')) {
        newStyle = 'inline';
    } else if(hasClass(elem, '_inline_block')) {
        newStyle = 'inline-block';
    } else if(hasClass(elem, 'flex')) {
        newStyle = 'flex';
    } else if(tag === 'tr' && !browser.msie) {
        newStyle = 'table-row';
    } else if(tag === 'table' && !browser.msie) {
        newStyle = 'table';
    } else {
        newStyle = 'block';
    }
    elem.style.display = elem.olddisplay = newStyle;
    sAnim.scroll();
}
function hide(elem) {
    var l = arguments.length;
    if (l > 1) {
        for (var i = 0; i < l; i++) {
            hide(arguments[i]);
        } return;
    }

    elem = ge(elem);
    if(!elem || !elem.style) return;

    var display = getStyle(elem, 'display');
    elem.olddisplay = (display != 'none' ? display : '');
    elem.style.display = 'none';
}
function cookie(name, value, expires = 86400 * 3600, path = '/') {
    if(!name || /^(?:expires|max\-age|path|domain|secure)$/i.test(name)) return false;
    if(typeof value == 'undefined') {
        return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(name).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || '';
    } else {
        if (expires) {
            switch (expires.constructor) {
                case Number:
                    expires = expires === Infinity ? "expires=Fri, 31 Dec 9999 23:59:59 GMT" : "max-age=" + expires;
                    break;
                case String:
                    expires = "expires=" + expires;
                    break;
                case Date:
                    expires = "expires=" + expires.toUTCString();
                    break;
                default:
            }
        } else expires = 'expires=Fri, 31 Dec 1970 23:59:59 GMT';
        document.cookie = encodeURIComponent(name)+'= '+encodeURIComponent(value)+'; ' + expires + (path ? '; path=' + path : '');
        return true;
    }
}
function pa(str) {
    var args = [].slice.call(arguments, 1), i = 0;
    return str.replace(/%s/g, function() {
        return args[i++];
    });
}
function pa1(str) {
    var query = str.substr(1);
    var result = {};
    query.split("&").forEach(function(part) {
        var item = part.split("=");
        result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
}
function sortAsc(element) {
    [].map.call(element.children, Object).sort(function(a, b) {
        return +b.id.match(/\d+/) - +a.id.match(/\d+/);
    }).forEach(function(elem) {
        element.appendChild(elem);
    });
}
function sortDesc(element) {
    [].map.call(element.children, Object).sort(function(a, b) {
        return +a.id.match(/\d+/) - +b.id.match(/\d+/);
    }).forEach(function(elem) {
        element.appendChild(elem);
    });
}
function elsRem(elements) {
    let c = Object.assign({}, elements);
    if(typeof(elements.length) != "undefined") Object.keys(c).forEach(function(i) { c[i].remove() });
    else elements.remove();
}
function elsFunc(elements, func) {
    if(typeof(elements.length) != "undefined") Object.keys(elements).forEach(function(i) { func(elements[i]); });
    else func(elements);
}
function sel(selector, arg1 = true, arg2 = document) {
    if(typeof(selector) == 'object') return selector;
    let context = arg2, all = arg1;
    if(typeof arg1 == 'object') context = arg1, arg2 = arg2 ? true : false, all = arg2;
    if(all) return context.querySelectorAll(selector);
    else return context.querySelector(selector);
}
function eventFunc(evElement, evType) {
    let args = [].splice.call(arguments, 2);
    eventBind(evElement, evType, function(ev) {
        if(modality.active() && !sel('.modal-hide')[0] && !sel('.vk-close')[0]) return;
        if((ev.path || (ev.composedPath && ev.composedPath())).filter(function(el) { if(el.matches && (el.matches('.tt_w') || el.matches('#system_msg') || (args[0] && el.matches(args[0])))) return el.matches; }).length) return;
        args[1] && args[1]();
        eventOff(evElement, evType, args[0]);
    }, true, args[0]);
}
function eventBind(el, ev, callback, bool = false, ident = '') {
    eventOff(el, ev, ident);
    if(NodeList.prototype.isPrototypeOf(el) || HTMLCollection.prototype.isPrototypeOf(el)) {
        el.forEach(function(v) {
            if(!v.listeners) v.listeners = [];
            v.addEventListener(ev, callback, bool);
            v.listeners.push({type: ev, listener: callback, ident: ident, bool: bool});
        });
    } else {
        if(!el.listeners) el.listeners = [];
        el.addEventListener(ev, callback, bool);
        el.listeners.push({type: ev, listener: callback, ident: ident, bool: bool});
    } return el;
}
function eventOff(el, ev, ident) {
    if(NodeList.prototype.isPrototypeOf(el) || HTMLCollection.prototype.isPrototypeOf(el)) {
        el.forEach(function(v) {
            if(v.listeners) {
                v.listeners.forEach(function(l, listenersIterator) {
                    if(l && l.type == ev && l.ident == ident) {
                        el.removeEventListener(ev, l.listener, l.bool);
                        delete v.listeners[listenersIterator];
                    }
                });
            }
        });
    } else if(el.listeners) {
        el.listeners.forEach(function(l, listenersIterator) {
            if(l && l.type == ev && l.ident == ident) {
                el.removeEventListener(ev, l.listener, l.bool);
                delete el.listeners[listenersIterator];
            }
        });
    } return el;
}
function queryParent(el, selector) {
    while(el = el.parentNode) if(el.matches(selector)) return el;
    return false;
}
function queryParentNode(el, node) {
    if(el === node) return el;
    while(el = el.parentNode) if(el === node) return el;
    return false;
}

// UTILS
Function.prototype.pbind = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(window);
    return this.bind.apply(this, args);
};
Number.prototype.pad = function(n) {
    return ('0' + this).slice(Math.max(n, this.toString().split('').length) * -1);
};

// CSS
function hasClass(obj, name) {
    obj = ge(obj);
    if(obj && obj.nodeType === 1 && (' ' + obj.className + ' ').replace(/[\t\r\n\f]/g, ' ').indexOf(' ' + name + ' ') >= 0) return true;
        return false;
}

// EVENTS
window.onpopstate = function() { 
    let ps = location.pathname + location.search;
    modality.destroy();
    return nav.go(ps, null, null); 
}
window.addEventListener('scroll', scrollFunc, true);
window.addEventListener('DOMContentLoaded', function() {
    if(window.devicePixelRatio >= 2) stManager.addBody('retina.css');
    mobileHandle();
    arpTs.fill(Date.now() / 1000);
    page.path();
    sAnim.init();
    //lpListen(lpHandler);
});
window.onerror = function(errorMsg, url, lineNumber, column, errorObj) {
    if(!window.__debugMode) return;
    return topMsg(url+':'+lineNumber+'<br><br>'+errorMsg, 0, 'error');
}

// FUNC
function formatDate(date) {
    if(!(/^\+?(0|[1-9]\d*)$/.test(date))) return date;
    var date = new Date(date * 1000);
    var day = addDateZero(date.getDate());
    var month = addDateZero(date.getMonth()+1);
    var year = date.getFullYear();
    var hour = addDateZero(date.getHours());
    var minute = addDateZero(date.getMinutes());
    return day+'.'+month+'.'+year+' '+hour+':'+minute;
}

function specialTime(time) {

    Object.defineProperty(this, 'text', {
        get: function() {
            let curUnix = Date.now() / 1000,
                pastUnix = this.pastUnix,
                curDate = new Date(curUnix * 1000),
                pastDate = this.pastDate;
            let diff = curUnix - pastUnix;
            let year = curDate.getFullYear() - pastDate.getFullYear(), day = Math.floor(diff / 86400);
            if(curDate.getHours() < pastDate.getHours()) day++;
            if(year && day > 2) {
                let str = pastDate.toLocaleString('ru-RU', { day: '2-digit', month: 'long' })+' '+pastDate.getFullYear()+', в '+pastDate.getHours().pad(2)+':'+pastDate.getMinutes().pad(2);
                return str;
            }
            let month = Math.floor(diff / 2592000);
            if(curDate.getDate() < pastDate.getDate()) month++;
            if(month || day > 2) {
                let str = pastDate.toLocaleString('ru-RU', { day: '2-digit', month: 'long' })+', '+pastDate.getHours().pad(2)+':'+pastDate.getMinutes().pad(2);
                return str;
            }
            let hour = Math.floor(diff / 3600);
            if(hour) {
                let str = ' в '+pastDate.getHours().pad(2)+':'+pastDate.getMinutes().pad(2);
                switch(day) {
                    case 0: str = 'Сегодня' + str; break;
                    case 1: str = 'Вчера' + str; break;
                    case 2: str = 'Позавчера' + str; break;
                } return str;
            }
            let minutes = Math.floor(diff / 60);
            if(minutes) {
                let str = '';
                if(minutes < 6) {
                    if(minutes == 1) str = 'Минуту назад';
                    else if(minutes == 2) str = 'Две минуты назад';
                    else if(minutes == 3) str = 'Три минуты назад';
                    else if(minutes == 4) str = 'Четыре минуты назад';
                    else if(minutes == 5) str = 'Пять минут назад';
                } else {
                    let c = minutes.toString();
                    let c2 = c.substr(Math.max(c.length - 2, 0), c.length); c = c[c.length - 1];
                    if(c == '0' || c == '5' || c == '6' || c == '7' || c == '8' || c == '9' || (c == '1' && c2 == '11')) str = minutes + ' минут назад';
                    else if(c == '1' && c2 != '11') str = minutes + ' минуту назад';
                    else if(c == '2' || c == '3' || c == '4') {
                        if(c2[0] == '1') str = minutes + ' минут назад';
                        else str = minutes + ' минуты назад';
                    }
                } return str;
            }
            let seconds = Math.floor(diff);
            if(seconds) {
                let str = '';
                if(seconds < 6) {
                    if(seconds == 1) str = 'Cекунду назад';
                    else if(seconds == 2) str = 'Две секунды назад';
                    else if(seconds == 3) str = 'Три секунды назад';
                    else if(seconds == 4) str = 'Четыре секунды назад';
                    else if(seconds == 5) str = 'Пять секунд назад';
                } else {
                    let c = seconds.toString();
                    let c2 = c.substr(Math.max(c.length - 2, 0), c.length); c = c[c.length - 1];
                    if(c == '0' || c == '5' || c == '6' || c == '7' || c == '8' || c == '9' || (c == '1' && c2 == '11')) str = seconds + ' секунд назад';
                    else if(c == '1' && c2 != '11') str = seconds + ' секунду назад';
                    else if(c == '2' || c == '3' || c == '4') {
                        if(c2[0] == '1') str = seconds + ' секунд назад';
                        else str = seconds + ' секунды назад';
                    }
                } return str;
            } return 'Только что';
        }
    });

    this.bindElement = (function(element) {
        (function() {
            var bindInterval = setInterval((function() {
                let diff = Date.now() / 1000 - this.pastUnix;
                if(diff >= 3600) clearInterval(bindInterval);
                else this.element.innerHTML = this.date.text;
            }).bind({date: this, element: element}), 5000);
        }).bind(this)();
    }).bind(this);

    this.pastUnix = time;
    this.pastDate = new Date(this.pastUnix * 1000);
    this.id = Math.random().toString(36).substr(2, 9);
    
    setTimeout((function() {
        elsFunc(sel('[st-realtime]'), (function(elem) {
            if(elem.getAttribute('st-realtime') == this.id) {
                this.bindElement(elem);
                elem.removeAttribute('st-realtime');
            }
        }).bind(this));
    }).bind(this), 0);
}
function addDateZero(i) {
    if(i < 10) i = '0' + i;
    return i;
}
function onBodyResize() {
    var pfw = ge('page_footer_wrap'),
        pnb = ge('page_notify_box'),
        pnbw = sel('.page-notify-box--wrap', false, pnb);

    scrollFunc();
    sAnim.scroll();
    dd.init();

    if(pnb && pnbw) setStyle(pnb, { height: sel('.page-notify-box--wrap', false, pnb).offsetHeight });
    if(isMobile && typeof m === 'object') m.resize();
    if((arpScroll.scrollHeight - pfw.offsetHeight) > window.innerHeight) setStyle(pfw, {display: 'block'});
    else setStyle(pfw, {display: 'none'});
}
function mobileHandle() {
    let loc = (location.pathname + location.search).split('?')[0].replace(/^\/|\/$/g, '');
    let nomobile = false;
    if(typeof navMap !== 'object') {
        setTimeout(mobileHandle, 500);
        return;
    }
    for(let key in navMap) if((new RegExp('^'+key+'$')).test(loc) && navMap[key][2]) nomobile = true; 
    if(browser.mobile && !nomobile && !s_v) mobileGo();
    else mobileDestroy();
}
function mobileGo() {
    arpScroll = document.body;
    stManager.add('mobile.js', () => { 
        stManager.addBody('mobile.css');
        m.init(); 
        isMobile = true;
    });
}
function mobileDestroy() {
    if(s_v == 1) {
        arpScroll = document.body; 
        setStyle(ge('scroll_fix_wrap'), { overflow: 'hidden', height: 'max-content', width: 'max-content' });
    } else arpScroll = ge('scroll_fix_wrap');
    ge('page_header').style.display = 'block';
    stManager.del(['mobile.css', 'mobile.js']);
    isMobile = false;
}
function toV(v) {
    cookie('s_v', v);
    location.reload();
}
function lpListen(callback) {
    if(typeof conf != 'object') return topMsg('Некоторые важные исполняемые файлы были неудачно загружены, сайт может работать нестабильно');
    ajax.getjson1(conf.lp_servers[0], { key: cookie('i'), ts: arpTs.join('_') }, function(data) {
        callback && callback(data.success);
        data.success.forEach((v, k) => { arpTs[k] = v.ts; });
        return lpListen(callback);
    });
}
function lpHandler(data) {
    data.forEach((la, lk) => {
        la.updates.forEach(u => {
            if(lk == 0) { // comments
                let c = geByClass1('comments-list', ge('page_wrapper')), ce = geByClass1('comment-list-empty', c), ci = geByClass1('comment-list-items', c), cm = geByClass1('comment-list-more', c);
                switch(u.event) {
                    case 'add': {
                        if(!c || u.page != location.pathname) return;
                        if(comments.cm[u.id]) u.manage = true;
                        if(comments.cs) u.staff = true;
                        if(ge('c'+u.id)) return;
                        u.date = Date.now() / 1000;
                        ci.insertAdjacentHTML('afterbegin', comments.tpl(u));
                        comments.of++;
                        break;
                    }
                    case 'edit': {
                        let cf = ge('c'+u.id), ct = geByClass1('comment-text-preview', cf);
                        if(!c || !cf || u.page != location.pathname) return;
                        ct.innerHTML = textToUrl(u.text);
                        break;
                    }
                    case 'like': {
                        let cf = ge('c'+u.id), cl = geByClass1('comment-like-quantity', cf)
                        if(!c || !cf || u.page != location.pathname) return;
                        if(u.like < 1) hide(cl);
                        else show(cl);
                        cl.innerHTML = u.like;
                        break;
                    }
                    case 'del': {
                        let cf = ge('c'+u.id);
                        if(!c || !cf || u.page != location.pathname) return;
                        comments.of--;
                        cf.remove();
                        break;
                    }
                }
                if(sel('.comment-list-item').length < 1) isVisible(cm) ? comments.get(cm.children[0]) : show(ce), hide(cm);
                else hide(ce);
                onBodyResize();
            }
            if(lk == 1) { // notifier
                let tnc = sel('.top-notify-count')[0];
                if(!tnc) return;
                tnc.innerHTML = parseInt(tnc.innerHTML) + 1;
                show(tnc);
            }
        });
    });
}
function scrollFunc(e) {
    let usu = sel('.useful-up')[0];
    if(typeof tooltips != 'undefined') tooltips.hide_all();
    if(arpScroll.scrollTop > arpScroll.clientHeight) {
        usu && !usu.classList.contains('shown') && usu.classList.add('shown');
        usu && setStyle(usu, { position: 'fixed', left: getXY(usu)[0] });
    } else {
        usu && usu.classList.remove('shown');
    }
}
function captchaGo(callback) {
    modality.show('/system/captcha', null, null, {'captcha': true});
    return arpCache['captchaCallback'] = () => { 
        if(!arpCache['lastModality']) modality.hide();
        if(callback) callback();
        delete arpCache['captchaCallback'];
    };
}
function captchaHandle(key) {
    if(!arpCache['captchaCallback']) return;
    ajax.getjson('mem.approveCaptcha', {i: cookie('i'), key}, () => { arpCache['captchaCallback'](); });
}
function clearVariables() {
    if(typeof roulette == 'object') roulette.scroll_fix = false;
    if(typeof market == 'object') {
        market.se_check = {};
        market.se_data = [0, 0];
    }
}
function topMsg(text, seconds, type) {
    var el = ge('system_msg');
    clearTimeout(window.topMsgTimer);
    if(!type) type = 'default';
    if(!text) return hide('system_msg');
    if(seconds) window.topMsgTimer = setTimeout(topMsg.pbind(false), seconds * 1000);
    el.className = 'fixed';
    el.classList.add(type);
    el.innerHTML = text;
    show(el);
}
function msgBox(container, type, message) {
    if(message == undefined) return;
    elsRem(sel('.msg-box'));
    container.appendChild(ce('div', {className: 'msg-box ' + type, innerHTML: '<div class=\'msg-text\'>'+message+'</div>'}));
    onBodyResize();
}
function dropmenuHandle(el) {
    elsFunc(sel('.head-menu-item'), function(el) {
        el.removeAttribute('active');
    });
    eventFunc(document.body, 'click', '#dropmenu > label', function() { 
        el.checked = false; 
        menuHandle();
    });
}
function menuHandle() {
    elsFunc(sel('.head-menu-item'), function(el) {
        el.removeAttribute('active');
        if(location.pathname.replace(/^\/(.*?)[\/?].*$/, '/$1') == el.getAttribute('href'))
            el.setAttribute('active', 1);
    });
}








