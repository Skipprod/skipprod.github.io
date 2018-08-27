var page = {

	path: function (uri) {

        if(!uri) 
            uri = location.pathname, 
            uri = uri.replace(/\/$/, ''), 
            uri += location.search;

        if(ge('reCaptcha'))
            arpCache.reCaptcha = grecaptcha.render('reCaptcha', {'sitekey': conf.g_sec, 'callback': captchaHandle});

        menuHandle();
        news.of = 0;
        blog.of = 0;
        arpCache.faqEntry = 0; 

        switch(uri.split('?')[0]) {
            case '/news':           news.get(); break;
            case '/faq':            faqLoad(); break;
            case '/blog':           blog.get(); break;
            case '/music':          music.init(); slider.init(); comments.of = 0; comments.get(); break;
            case '/beta':           beta.init(); comments.of = 0; comments.get(); break;
            case '/top':            topInit(false); break;
        } 
        
        setTimeout(() => { 
            sAnim.scroll(); 
            dd.init(); 
            ui_radio.init();
            ic.init();
            if(!modality.active()) smart_tables.init();
        }, 100);

        onBodyResize();

	}
	
}

var news = {

    get: function(el) {
        var nw = geByClass1('news-wrap', ge('page_wrapper')), nl = geByClass1('news-entry-list', nw), lm = geByClass1('load-more', ge('page_wrapper'));
        el && el.classList.add('white-load');
        ajax.getjson('news.get', { count: 20, offset: news.of }, function(data) {
            if(geByClass1('spinner-load', nw)) geByClass1('spinner-load', nw).remove();
            if(el) el.classList.remove('white-load');
            if(data.error) return topMsg(data.error.err_msg, 10, 'error');
            if(data.success) news.of += 20, data.success.forEach((entry, i) => {
                if(i == 0) return news.nc = entry;
                nl.insertAdjacentHTML('beforeend', news.tpl(entry));
            });
            setTimeout(onBodyResize, 1);
            if(news.of >= news.nc) hide(lm);
            else show(lm);
        });
    }, 

    tpl: function(entry) {
        var at = [], md = [], time = new specialTime(entry.date);
        if(ge('w'+entry.id)) return '';
        entry.attachments && entry.attachments.forEach(a => {
            if(a.photo) at[0] = a.photo.src_big;
            if(a.link) at[1] = a.link;
            if(a.video) at[2] = a.video;
            if(a.poll) at[3] = a.poll;
        });
        if(at[3] && !at[0] && !at[1] && !at[2]) { return ''; }
        if(at[2] && at[2].description) md['text'] = '<div class="news-content-text">'+at[2].description+'</div>';
        if(entry.text) md['text'] = '<div class="news-content-text"><h2>'+entry.text+'</h2></div>';
        if(at[0] || at[2]) {
            md['media'] = '<div class="news-item-media">';
            md['media'] += at[2] ? '<a href="https://vk.com/amazing_rp?z=video'+at[2].owner_id+'_'+at[2].vid+'" target="_blank"><img class="news-media-image" src="'+at[2].image_big+'" /><div class="news-media-video animated infinite pulse"></div></a>':'';
            md['media'] += at[0] ? '<img class="news-media-image" src="'+at[0]+'" />':'';
            md['media'] += at[0] ? '<div class="news-media-shadow"></div>':'';
            md['media'] += '</div>';
        }
        if(at[1]) {
            md['extra']  = '<div class="news-content-extra">';
            md['extra'] +=     '<a class="news-extra-link" href="'+at[1].url+'" target="_blank">';
            md['extra'] +=         at[1].image_big ? '<div class="news-link-media news-item-media">':'';
            md['extra'] +=             at[1].image_big ? '<img class="news-media-image" src="'+at[1].image_big+'" alt="'+at[1].title+'">':'';
            md['extra'] +=         at[1].image_big ? '</div>':'';
            md['extra'] +=         '<div class="news-link-footer">';
            md['extra'] +=             '<div class="news-link-icon"></div>';
            md['extra'] +=             '<div class="news-link-content">';
            md['extra'] +=                 '<div class="news-link-title">'+at[1].title+'</div>';
            md['extra'] +=                 '<div class="news-link-desc">'+at[1].url+'</div>';
            md['extra'] +=             '</div>';
            md['extra'] +=         '</div>';
            md['extra'] +=     '</a>';
            md['extra'] += '</div>';
        }
        var html  = '<div class="news-entry-item" id="w'+entry.id+'" sAnim="fadeInUp" sDuration="0.5">';
            html +=     md['media'] ? md['media']:'';
            html +=     '<div class="news-item-content">';
            html +=         md['text'] ? textToUrl(md['text']):'';
            html +=         md['extra'] ? md['extra']:'';
            html +=         '<div class="news-content-footer">';
            html +=             '<div class="news-footer-left">';
            html +=                 '<a href="https://vk.com/wall'+entry.from_id+'_'+entry.id+'" target="_blank"><div class="news-footer-date" st-realtime="'+time.id+'">'+time.text+'</div></a>';
            html +=             '</div>';
            html +=             '<div class="news-footer-right" tt_text="Взято из ВКонтакте" onMouseover="tooltips.tt_black_down.show(this);">';
            html +=                 entry.likes.count > 0 ? '<div class="news-footer-likes">'+entry.likes.count+'</div>':'';
            html +=                 entry.comments.count > 0 ? '<div class="news-footer-comments">'+entry.comments.count+'</div>':'';
            html +=                 entry.reposts.count > 0 ? '<div class="news-footer-reposts">'+entry.reposts.count+'</div>':'';
            html +=                 at[2] && at[2].views > 0 ? '<div class="news-footer-views">'+at[2].views+'</div>':'';
            html +=             '</div>';
            html +=         '</div>';
            html +=     '</div>';
            html += '</div>';
        return html;
    },

    of: 0,
    nc: 0

}

var blog = {

    get: function(el) {
        var bw = sel('.blog-wrap', false),
            ad = sel('.add-button', bw, false),
            bel = sel('.blog-entry-list', bw, false),
            sl = sel('.spinner-load', bw, false),
            lm = sel('.load-more', bw, false);
        el && el.classList.add('white-load');
        ajax.getjson('blog.get', { count: 5, offset: blog.of }, function(data) {
            if(ad) ad.classList.remove('d_hidden');
            if(sl) sl.remove();
            if(el) el.classList.remove('white-load');
            if(data.error) return topMsg(data.error.err_msg, 10, 'error');
            if(data.success) blog.of += 5, data.success.forEach((entry, i) => {
                if(i == 0) return blog.bc = entry;
                bel.insertAdjacentHTML('beforeend', blog.tpl(entry));
            });
            setTimeout(onBodyResize, 1);
            if(blog.of >= blog.bc) hide(lm);
            else show(lm);
        });
    }, 

    add: function(el) {
        var fd_i = sel('.modal-form--input'), fd_t = sel('.modal-form--textarea');
        if(el) el.classList.add('btn-load');
        ajax.postjson('blog.add', { 
            i: cookie('i'), 
            title: fd_i[0].value, 
            subtitle: fd_t[0].value, 
            tagline: fd_i[1].value, 
            image: fd_i[2].value 
        }, function(data) {
            if(el) el.classList.remove('btn-load');
            if(data.error) return topMsg(data.error.err_msg, 10, 'error');
            modality.hide();
            setTimeout(function() {
                return nav.go('/blog/'+data.success[0]+'-'+data.success[1], false);
            }, 500);
        });
    },

    save: function(bID, opts, callback) {
        opts = opts || {};
        params = {'image': 0, 'text': 0};
        var bch_t = sel('.blog-content-header--title > span', false),
            bah_t = sel('.blog-attach-header--tagline > span', false),
            bcs_t = sel('.blog-content--subtitle > textarea', false),
            bch_d = sel('.blog-content-header--date > input', false),
            sei = sel('.smart-editor--input', false);
        if(opts.btn_load) opts.btn_load.classList.add('btn-load');
        if(opts.saveText) params['text'] = sei.innerHTML;
        if(opts.saveImage) params['image'] = opts.saveImage;
        clearTimeout(blog.tr);
        blog.tr = setTimeout(function() {
            ajax.postjson('blog.edit', Object.assign({ i: cookie('i'), bID: bID, title: bch_t.innerHTML, subtitle: bcs_t.value, tagline: bah_t.innerHTML, date: bch_d.value }, params), function(data) {
                if(opts.btn_load) opts.btn_load.classList.remove('btn-load');
                if(data.error) return topMsg(data.error.err_msg, 10, 'error');
                if(callback) callback();
                topMsg('Изменения сохранены', 10, 'ok');
                history.pushState(null, null, '/blog/'+bID+'-'+data.success+'/edit');
                sel('._back', false).href = '/blog/'+bID+'-'+data.success;
            });
        }, 1000);
    },

    uploadCover: function(bID) {
        modality.show('/system/upload_image', false);
        arpCallback = function(data) {
            if(!data.length) return topMsg('Кажется, изображение загрузилось некорректно, попробуйте еще раз', 10, 'error');
            blog.save(bID, {saveImage: data[0]}, function() {
                sel('.blog-entry--background', false).src = data[0];
            });
        }
    },

    uploadCoverAtCreate: function(el) {
        var fd_i = sel('.modal-form--input'), fd_t = sel('.modal-form--textarea'), fd_b = sel('.modal-form--button');
        modality.show('/system/upload_image', false);
        arpCallback = function(data) {
            if(!data.length) return topMsg('Кажется, изображение загрузилось некорректно, попробуйте еще раз', 10, 'error');
            fd_i[2].value = data[0];
            fd_b[0].classList.add('_disabled');
            fd_b[0].innerHTML = 'Обложка прикреплена';
        }
    },

    publish: function(el, bID) {
        el.classList.add('white-load');
        ajax.getjson('blog.publish', { i: cookie('i'), bID: bID }, function(data) {
            el.classList.remove('white-load');
            if(data.error) return topMsg(data.error.err_msg, 10, 'error');
            if(data.success == 'publish') topMsg('Запись опубликована', 5, 'ok'), el.innerHTML = 'Скрыть';
            else topMsg('Запись скрыта', 5, 'ok'), el.innerHTML = 'Опубликовать';
        });
    },

    delete: function(el, bID) {
        el.classList.add('white-load');
        ajax.getjson('blog.delete', { i: cookie('i'), bID: bID }, function(data) {
            el.classList.remove('white-load');
            if(data.error) return topMsg(data.error.err_msg, 10, 'error');
            if(data.success == 'deleted') topMsg('Запись удалена', 5, 'ok'), el.innerHTML = 'Восстановить';
            else topMsg('Запись восстановлена', 5, 'ok'), el.innerHTML = 'Удалить';
        });
    },

    like: function(el, bID) {
        let li = ge('like');
        if(!cookie('i')) return modality.show('/login', null);
        if(el.classList.contains('_liked')) el.classList.remove('_liked'), li.innerHTML = parseInt(li.innerHTML) - 1;
        else el.classList.add('_liked'), li.innerHTML = parseInt(li.innerHTML) + 1;
        ajax.getjson('blog.like', { i: cookie('i'), bID }, function(data) {
            if(data.error) return topMsg(data.error.err_msg, 10, 'error');
            li.innerHTML = data.success;
        });
    },

    tpl: function(entry) {
        var html  = '<a class="blog-entry '+(entry.allowed == '1' ? '':'_not_allowed')+'" href="/blog/'+entry.id+'-'+entry.page+'" onClick="return nav.go(this, event);" style="background-image: url(\''+entry.image+'\');" sAnim="fadeInUp" sDuration="0.2">';
            html +=    '<div class="blog-article">';
            html +=        '<div class="article-title">'+entry.title+'</div>';
            html +=        '<div class="article-short">'+entry.subtitle+'</div>';
            html +=    '</div>';
            html += '</div>';
        return html;
    },

    of: 0,
    bc: 0,
    tr: 0,
    adt: []

}

var music = {

    init: function() {
        var b = geByClass1('music-button', ge('page_wrapper')), c = geByClass1('music-performer-now', ge('page_wrapper')), cs = parseInt(cookie('station'));
        if(!cookie('volume')) cookie('volume', conf.def_volume);
        if(!cs) cookie('station', 0), cs = 0;
        if(geByTag('audio')[0]) b.className = 'music-button _stop', b.setAttribute('onClick', 'music.stop(this);');
        setStyle(geByClass1('volume-slider-progress', ge('page_wrapper')), { width: (cookie('volume') * 200) + '%' });
        setStyle(geByClass1('volume-slider-circle', ge('page_wrapper')), { left: (cookie('volume') * 200) + '%' });
        c.innerHTML = music.station[cs][0];
    },

    play: function(el) {
        var b = geByClass1('music-button', ge('page_wrapper'));
        b.className = 'music-button _stop';
        b.setAttribute('onClick', 'music.stop(this);');
        music.update();
    },

    stop: function(el) {
        var b = geByClass1('music-button', ge('page_wrapper'));
        b.className = 'music-button _play';
        b.setAttribute('onClick', 'music.play(this);');
        geByTag('audio')[0].remove();
    },

    update: function() {
        var cs = parseInt(cookie('station'));
        if(geByTag('audio')[0]) geByTag('audio')[0].remove();
        music.el = document.createElement('audio');
        music.el.display = 'none';
        music.el.src = music.station[cs][1];
        music.el.autoplay = true;
        music.el.volume = cookie('volume');
        document.body.appendChild(music.el);
    },

    next: function(el) {
        var c = geByClass1('music-performer-now', ge('page_wrapper')), ns = 0, cs = parseInt(cookie('station'));
        if(music.station[cs + 1]) ns = cs + 1;
        animate(c, { opacity: 0, left: 13 }, 50, function() {
            c.innerHTML = music.station[ns][0];
            c.style = null, setStyle(c, { opacity: 0, right: 13 });
            animate(c, { opacity: 1, right: 0 }, 100, function() { c.removeAttribute('style'); });
        }), music.change(ns);
    },

    prev: function(el) {
        var c = geByClass1('music-performer-now', ge('page_wrapper')), ns = music.station.length - 1, cs = parseInt(cookie('station'));
        if(music.station[cs - 1]) ns = cs - 1;
        animate(c, { opacity: 0, right: 13 }, 50, function() {
            c.innerHTML = music.station[ns][0];
            c.style = null, setStyle(c, { opacity: 0, left: 13 });
            animate(c, { opacity: 1, left: 0 }, 100, function() { c.removeAttribute('style'); });
        }), music.change(ns);
    },

    change: function(s) {
        cookie('station', s);
        if(geByTag('audio')[0]) music.update();
    },

    station: [

        ['Amazing Live', 'http://185.17.144.180:8000/live'],
        ['Авторадио', 'http://cast.radiogroup.com.ua:8000/avtoradio'],
        ['Европа Плюс', 'http://ep256.hostingradio.ru:8052/europaplus256.mp3'],
        ['Русское Радио', 'http://online-rusradio.tavrmedia.ua/RusRadio'],
        ['Радио Рекорд', 'http://air.radiorecord.ru:8101/rr_320'],
        ['Рекорд VIP', 'http://air.radiorecord.ru:8102/vip_320'],
        ['Радио Шансон', 'http://chanson.hostingradio.ru:8041/chanson256.mp3'],
        ['Ретро Радио', 'http://cast.loungefm.com.ua/retro_dance']

    ], el: false

}

var beta = {

    init: function() {
        if(!ge('betaVoteText') || !ge('betaLike') || !ge('betaDislike')) return;
        ajax.getjson('beta.getVotes', false, function(data) {
            if(data.error) return topMsg(data.error.err_msg, 10, 'error');
            if(data.success.youVoted == 'like') ge('betaVoteText').innerHTML = '<a onClick=\'beta.delVote();\'>Вы оставили положительный отзыв</a>';
            else if(data.success.youVoted == 'dislike') ge('betaVoteText').innerHTML = '<a onClick=\'beta.delVote();\'>Вы оставили отрицательный отзыв</a>';
            else ge('betaVoteText').innerHTML = 'Оцените качество модпака';
            ge('betaLike').innerHTML = data.success.like;
            ge('betaDislike').innerHTML = data.success.dislike;
        });
    },

    addVote: function(type) {
        if(type != 'like' && type != 'dislike') return;
        ajax.getjson('beta.addVote', { type: type }, function(data) {
            if(data.error) return topMsg(data.error.err_msg, 10, 'error');
            if(type == 'like') ge('betaVoteText').innerHTML = '<a onClick=\'beta.delVote();\'>Вы оставили положительный отзыв</a>', geByClass1('beta-vote-causes', ge('page_wrapper')).classList.remove('shown');
            else ge('betaVoteText').innerHTML = '<a onClick=\'beta.delVote();\'>Вы оставили отрицательный отзыв</a>', geByClass1('beta-vote-causes', ge('page_wrapper')).classList.add('shown');
            ge('betaLike').innerHTML = data.success.like;
            ge('betaDislike').innerHTML = data.success.dislike;
        });
    },

    delVote: function() {
        ajax.getjson('beta.delVote', false, function(data) {
            if(data.error) return topMsg(data.error.err_msg, 10, 'error');
            geByClass1('beta-vote-causes', ge('page_wrapper')).classList.remove('shown');
            ge('betaVoteText').innerHTML = 'Оцените качество модпака';
            ge('betaLike').innerHTML = data.success.like;
            ge('betaDislike').innerHTML = data.success.dislike;
        });
    },

    addCause: function(radio) {
        if(!radio) return;
        ajax.getjson('beta.addCause', { cause: radio.nextSibling.data }, function(data) {
            if(data.error) return topMsg(data.error.err_msg, 10, 'error');
            geByClass1('beta-vote-causes', ge('page_wrapper')).classList.remove('shown');
            topMsg('Благодарим за Ваш отзыв. Таким образом Вы помогаете улучшить наш модпак', 10, 'ok');
        });
    }

}

function faqLoad() {
    var container = geByClass1('faq-wrap', ge('page_wrapper')), dur = 0.0;
    ajax.getjson('faq.get', false, function(data) {
        if(geByClass1('spinner-load', container)) geByClass1('spinner-load', container).remove();
        if(data.error) return topMsg(data.error.err_msg, 10, 'error');
        if(!data.success) return topMsg('К сожалению, пока нет записей в FAQ', 5);
        data.success.forEach(entry => {
            arpCache.faqEntry ++;
            if(dur == 1) dur = 0.0;
            dur += 0.5;
            var faqEntry  = '<div class="faq-entry" id="f'+entry.id+'" sAnim="fadeInUp" sDuration="'+dur+'">';
                faqEntry +=    '<div class="faq-title"><h2>'+entry.question+'</h2></div>';
                faqEntry +=    '<div class="faq-text">'+entry.answer+'</div>';
                faqEntry +=    '<div class="faq-votes">';
                faqEntry +=        '<div class="faq-vote-text">'+(entry.youVoted ? (entry.youVoted == 'like' ? '<a onClick=\'faqDelVote('+entry.id+');\'>Вы оставили положительный отзыв</a>':'<a onClick=\'faqDelVote('+entry.id+');\'>Вы оставили отрицательный отзыв</a>'):'Был ли данный ответ Вам полезен?')+'</div>';
                faqEntry +=        '<div class="faq-vote-actions">';
                faqEntry +=            '<div class="faq-vote-action like">';
                faqEntry +=                '<a class="faq-vote-icon" onClick="faqAddVote(\'like\', '+entry.id+');"></a>';
                faqEntry +=                '<div class="faq-vote-quantity">'+entry.like+'</div>';
                faqEntry +=            '</div>';
                faqEntry +=            '<div class="faq-vote-action dislike">';
                faqEntry +=                '<a class="faq-vote-icon" onClick="faqAddVote(\'dislike\', '+entry.id+');"></a>';
                faqEntry +=                '<div class="faq-vote-quantity">'+entry.dislike+'</div>';
                faqEntry +=            '</div>';
                faqEntry +=        '</div>';
                faqEntry +=    '</div>';
                faqEntry += '</div>';

            container.insertAdjacentHTML('beforeend', faqEntry);
            onBodyResize();
            sAnim.scroll();
        });
    });
}

function faqAddVote(type, entryId) {
    if(!entryId) return;
    if(type != 'like' && type != 'dislike') return;
    ajax.getjson('faq.addVote', { type: type, entryId: entryId }, function(data) {
        if(data.error) return topMsg(data.error.err_msg, 10, 'error');
        if(type == 'like') geByClass1('faq-vote-text', ge('f'+entryId)).innerHTML = '<a onClick=\'faqDelVote('+entryId+');\'>Вы оставили положительный отзыв</a>';
        else geByClass1('faq-vote-text', ge('f'+entryId)).innerHTML = '<a onClick=\'faqDelVote('+entryId+');\'>Вы оставили отрицательный отзыв</a>';
        sel('#f'+entryId+' .faq-vote-action.like > .faq-vote-quantity')[0].innerHTML = data.success.like;
        sel('#f'+entryId+' .faq-vote-action.dislike > .faq-vote-quantity')[0].innerHTML = data.success.dislike;
    });
}

function faqDelVote(entryId) {
    if(!entryId) return;
    ajax.getjson('faq.delVote', { entryId: entryId }, function(data) {
        if(data.error) return topMsg(data.error.err_msg, 10, 'error');
        geByClass1('faq-vote-text', ge('f'+entryId)).innerHTML = 'Был ли данный ответ Вам полезен?';
        sel('#f'+entryId+' .faq-vote-action.like > .faq-vote-quantity')[0].innerHTML = data.success.like;
        sel('#f'+entryId+' .faq-vote-action.dislike > .faq-vote-quantity')[0].innerHTML = data.success.dislike;
    });
}

function donateSubmit(el, ev) {
    if(ev) ev.preventDefault();
    if(el) el.classList.add('btn-load');
    ajax.getjson('donate.pay', { username: ge('username').value, sum: ge('sum').value, server: ge('server').value }, function(data) {
        if(el) el.classList.remove('btn-load');
        if(data.error) return msgBox(geByClass1('donate-result', document.window), 'err', data.error.err_msg);
        msgBox(geByClass1('donate-result', document.body), 'ok', 'Информация получена. Переадресация на UnitPay...');
        location.href = data.success;
    });
}

function promoSubmit(el, ev) {
    if(ev) ev.preventDefault();
    if(el) el.classList.add('btn-load');
    ajax.getjson('promo.get', { i: cookie('i'), code: ge('code').value }, function(data) {
        if(el) el.classList.remove('btn-load');
        if(data.error) return topMsg(data.error.err_msg, 3, 'error');
        modality.show('/promo/prize?data='+JSON.stringify(data.success.data)+'&value='+data.success.value, ev);
    });
}

function vkEventSubmit(el) {
    if(el) el.classList.add('btn-load');
    ajax.getjson('events.getVK', { i: cookie('i'), url: ge('url').value, reCaptcha: grecaptcha.getResponse(arpCache.reCaptcha) }, function(data) {
        if(el) el.classList.remove('btn-load');
        if(data.error) {
            grecaptcha.reset(arpCache.reCaptcha);
            msgBox(geByClass1('vk-result', modality.get().elements.parent), 'err', data.error.err_msg);
            return;
        }
        msgBox(geByClass1('vk-result', modality.get().elements.parent), 'ok', 'Ура! Вы получили 10 000 руб. Возвращайтесь еще раз, через 12 часов ;)');
    });  
}

function topInit(ev) {
    var el = geByClass1('ucp-top-btn', ge('page_wrapper'));
    if(ev) ev.preventDefault();
    if(el) el.classList.add('btn-load');
    if(!ge('server')) return;
    setStyle(ge('topHeader'), { display: 'none' });
    elsFunc(sel('.ucp-top-row'), function(el) { el.remove(); });
    switch(location.pathname + location.search) {
        case '/top': topLoadInvite(el ? el : false); break;
        case '/top?act=money': topLoadMoney(el ? el : false); break;
        case '/top?act=level': topLoadLevel(el ? el : false); break;
    }
}

function topLoadInvite(el) {
    var table = ge('topTable'), index = 0, dur = 0.0;
    ajax.getjson('users.getTopInvite', { i: cookie('i'), server: ge('server').value }, function(data) {
        setStyle(ge('topHeader'), { display: 'table-row' });
        if(el) el.classList.remove('btn-load');
        if(data.error) return topMsg(data.error.err_msg, 10, 'error');
        if(data.success == 0) return;
        data.success.forEach(entry => {
            index ++;
            dur += 0.2;
            var tableRow  = '<tr class="ucp-top-row" sAnim="fadeInDown" sDuration="'+dur+'">';
                tableRow +=    '<td class="top-table-col">'+index+'</td>';
                tableRow +=    '<td class="top-table-col table-fix-width">';
                tableRow +=        '<a href="/'+ge('server').value+'/id'+entry.id+'" onClick="return nav.go(this, event);">'+entry.name+'</a>';
                tableRow +=    '</td>';
                tableRow += '</tr>';

            table.insertAdjacentHTML('beforeend', tableRow);
        }), sAnim.scroll(), onBodyResize();
    });
}

function topLoadMoney(el) {
    var table = ge('topTable'), index = 0, dur = 0.0;
    ajax.getjson('users.getTopMoney', { i: cookie('i'), server: ge('server').value }, function(data) {
        setStyle(ge('topHeader'), { display: 'table-row' });
        if(el) el.classList.remove('btn-load');
        if(data.error) return topMsg(data.error.err_msg, 10, 'error');
        if(data.success == 0) return;
        data.success.forEach(entry => {
            index ++;
            dur += 0.2;
            var tableRow  = '<tr class="ucp-top-row" sAnim="fadeInDown" sDuration="'+dur+'">';
                tableRow +=    '<td class="top-table-col">'+index+'</td>';
                tableRow +=    '<td class="top-table-col table-fix-width">';
                tableRow +=        '<a href="/'+ge('server').value+'/id'+entry.id+'" onClick="return nav.go(this, event);">'+entry.name+'</a>';
                tableRow +=    '</td>';
                tableRow +=    '<td class="top-table-col align-center">'+entry.fortune+'</td>';
                tableRow += '</tr>';

            table.insertAdjacentHTML('beforeend', tableRow);
        }), sAnim.scroll(), onBodyResize();
    });
}

function topLoadLevel(el) {
    var table = ge('topTable'), index = 0, dur = 0.0;
    ajax.getjson('users.getTopLevel', { i: cookie('i'), server: ge('server').value }, function(data) {
        setStyle(ge('topHeader'), { display: 'table-row' });
        if(el) el.classList.remove('btn-load');
        if(data.error) return topMsg(data.error.err_msg, 10, 'error');
        if(data.success == 0) return;
        data.success.forEach(entry => {
            index ++;
            dur += 0.2;
            var tableRow  = '<tr class="ucp-top-row" sAnim="fadeInDown" sDuration="'+dur+'">';
                tableRow +=    '<td class="top-table-col">'+index+'</td>';
                tableRow +=    '<td class="top-table-col table-fix-width">';
                tableRow +=        '<a href="/'+ge('server').value+'/id'+entry.id+'" onClick="return nav.go(this, event);">'+entry.name+'</a>';
                tableRow +=    '</td>';
                tableRow +=    '<td class="top-table-col align-center">'+entry.level+'</td>';
                tableRow += '</tr>';

            table.insertAdjacentHTML('beforeend', tableRow);
        }), sAnim.scroll(), onBodyResize();
    });
}









