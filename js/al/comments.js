var comments = {

    get: function(more = false) {
        let ph = location.pathname;
        let c = geByClass1('comments-list', ge('page_wrapper')), ca = geByClass1('comments-add', ge('page_wrapper')), ce = geByClass1('comment-list-empty', c), ci = geByClass1('comment-list-items', c), cm = geByClass1('comment-list-more', c);
        if(!c) return;
        if(!more) stickable(ca, 'bottom', 200, c.parentNode);
        else more.classList.add('white-load');
        ajax.getjson('comments.get', { i: cookie('i'), page: ph, offset: comments.of }, function(d1) {
            if(more) more.classList.remove('white-load');
            if(d1.error) return topMsg(d1.error.err_msg, 10, 'error');
            if(d1.success == 0) return show(ce), hide(cm);
            d1.success.forEach((comment, i) => {
                if(i == 0) return comments.cc = comment;
                if(sel('.comment-list-empty').length) hide(ce), hide(cm);
                if(comment.staff) comments.cs = true;
                ci.insertAdjacentHTML('beforeend', comments.tpl(comment));
                comments.of ++;
            });
            setTimeout(onBodyResize, 1);
            if(comments.cc == comments.of) hide(cm);
            else show(cm);
        });
    }, 

    pick: function(commentId) {
        if(!commentId) return;
        if(!cookie('i')) return modality.show('/login', null);
        comments.rc = commentId;
        ge('commentInput').focus();
        show(geByClass1('comments-add-reply', ge('page_wrapper')));
        sel('.comments-add-reply .comment-reply-avatar')[0].setAttribute('style', sel('#c'+commentId+' .comment-item-avatar')[0].getAttribute('style'));
        sel('.comments-add-reply .comment-reply-name')[0].innerHTML = sel('#c'+commentId+' .comment-author-name a')[0].innerHTML;
        sel('.comments-add-reply .comment-reply-text')[0].innerHTML = sel('#c'+commentId+' .comment-text-preview')[0].innerHTML.replace(/(<([^>]+)>)/ig, '');
    },

    cancelPick: function() {
        comments.rc = 0;
        hide(geByClass1('comments-add-reply', ge('page_wrapper')));
    },

    goToAnswer: function(commentId) {
        var commentsList = geByClass1('comments-list', ge('page_wrapper'));
        if(!commentId) return;
        if(!ge('c'+commentId)) return;
        if(sel('.selected').length) sel('.selected')[0].classList.remove('selected');
        if(commentsList.scrollHeight > commentsList.offsetHeight) toAnim(commentsList), commentsList.scrollTop = 0, commentsList.scrollTop = ge('c'+commentId).offsetTop - 300;
        else toAnim(ge('c'+commentId), 300);
        ge('c'+commentId).classList.add('selected');
        setTimeout(function() { if(sel('.selected')[0]) sel('.selected')[0].classList.remove('selected'); }, 4000);
    },

    add: function(el, ev) {
        let ci = ge('commentInput');
        if(ev) ev.preventDefault();
        if(!ci.value) return ci.focus();
        if(!el) el = sel('.comments-form-send')[0];
        el.classList.add('white-load');
        ajax.getjson('comments.add', {
            i: cookie('i'),
            page: location.pathname,
            text: ci.value,
            reply: comments.rc
        }, function(data) {
            el.classList.remove('white-load');
            if(data.error) return topMsg(data.error.err_msg, 10, 'error');
            hide(geByClass1('comments-add-reply', ge('page_wrapper')));
            ci.value = '';
            comments.rc = 0;
            comments.cm[parseInt(data.success)] = true;
            autoArea(ci);
        });
    },

    delete: function(commentId) {
        var c = geByClass1('comments-list', ge('page_wrapper')), ce = geByClass1('comment-list-empty', c), cm = geByClass1('comment-list-more', c), cf = ge('c'+commentId);
        if(!commentId) return;
        if(cf) cf.remove(), comments.of--;
        if(sel('.comment-list-item').length < 1) isVisible(cm) ? comments.get(cm.children[0]) : show(ce), hide(cm);
        ajax.getjson('comments.delete', { i: cookie('i'), entryId: commentId }, function(data) {
            if(data.error) return topMsg(data.error.err_msg, 10, 'error'), show(cf), hide(ce), comments.of++;
        }), onBodyResize();
    },

    editInit: function(commentId) {
        if(!commentId) return;
        hide(sel('#c'+commentId+' .comment-text-preview')[0]);
        hide(sel('#c'+commentId+' .comment-item-footer')[0]);
        show(sel('#c'+commentId+' .comment-text-editor')[0]);
        sel('#c'+commentId+' .comment-text-editor textarea')[0].value = htmldecode(
            sel('#c'+commentId+' .comment-text-preview')[0].innerHTML.replace(/<br>/g, '\n').replace(/(<([^>]+)>)/ig, '')
        );
    },

    cancelEdit: function(commentId) {
        if(!commentId) return;
        show(sel('#c'+commentId+' .comment-text-preview')[0]);
        show(sel('#c'+commentId+' .comment-item-footer')[0]);
        hide(sel('#c'+commentId+' .comment-text-editor')[0]);
        sel('#c'+commentId+' .comment-text-editor textarea')[0].value = '';
    },

    edit: function(commentId) {
        if(!commentId) return;
        show(sel('#c'+commentId+' .comment-text-preview')[0]);
        show(sel('#c'+commentId+' .comment-item-footer')[0]);
        hide(sel('#c'+commentId+' .comment-text-editor')[0]);
        sel('#c'+commentId+' .comment-text-preview')[0].innerHTML = textToUrl(
            htmlencode(sel('#c'+commentId+' .comment-text-editor textarea')[0].value.replace(/\n/g, '<br>'))
        );
        ajax.getjson('comments.edit', { 
            i: cookie('i'), 
            entryId: commentId, 
            page: location.pathname, 
            text: sel('#c'+commentId+' .comment-text-editor textarea')[0].value
        }, function(data) {
            if(data.error) return topMsg(data.error.err_msg, 10, 'error');
        });
    },

    like: function(commentId) {
        let li = sel('#c'+commentId+' .comment-like-icon'), lid = sel('#c'+commentId+' .comment-like-icon.liked'), liq = sel('#c'+commentId+' .comment-like-quantity');
        if(!commentId) return;
        if(!cookie('i')) return modality.show('/login', null);
        if(lid.length) li[0].classList.remove('liked'), liq[0].innerHTML = parseInt(liq[0].innerHTML) - 1;
        else li[0].classList.add('liked'), liq[0].innerHTML = parseInt(liq[0].innerHTML) + 1;
        if(parseInt(liq[0].innerHTML) > 0) show(liq[0]);
        else hide(liq[0]);
        if(comments.ab) comments.ab.abort();
        comments.ab = ajax.getjson('comments.like', { i: cookie('i'), entryId: commentId }, function(data) {
            if(data.error) {
                topMsg(data.error.err_msg, 10, 'error');
                li[0].classList.remove('liked');
                liq[0].innerHTML = parseInt(liq[0].innerHTML) - 1;
                hide(liq[0]);
                return;
            }
        });
    },

    tpl: function(comment) {
        var time = new specialTime(comment.date);
        var html  = '<div class="comment-list-item" id="c'+comment.id+'" sAnim="fadeIn" sDuration="0.2">';
            html +=     '<div class="comment-side-left">';
            html +=         '<div class="comment-item-avatar" style="background: url(\'/images/avatars/'+comment.avatar+'.jpg\') no-repeat top; background-size: 100%;"></div>';
            html +=     '</div>';
            html +=     '<div class="comment-side-right">';
            html +=         '<div class="comment-item-author">';
            html +=             '<div class="comment-author-name"><a href="/'+comment.server+'/'+comment.name+'" onClick="return nav.go(this, event);">'+comment.name.replace(/_/, ' ')+'</a></div>';
            html +=             (comment.replied ? '<a class="comment-author-replied" onClick="comments.goToAnswer('+comment.replied.id+');">ответил '+comment.replied.name.replace(/(.*)\_(.*)/, '$1')+'</a>':'');
            html +=             '<div class="comment-author-time" st-realtime="'+time.id+'">'+time.text+'</div>';
            html +=         '</div>';
            html +=         '<div class="comment-item-text">';
            html +=             '<div class="comment-text-preview">'+textToUrl(comment.text)+'</div>';
            html +=             '<div class="comment-text-editor">';
            html +=                 '<textarea></textarea>';
            html +=                 '<a class="comment-editor-button" onClick="comments.edit('+comment.id+');">Сохранить изменения</a>';
            html +=                 '<a class="comment-editor-button" onClick="comments.cancelEdit('+comment.id+');">Отменить</a>';
            html +=             '</div>';
            html +=         '</div>';
            html +=         '<div class="comment-item-footer">';
            html +=             '<a class="comment-footer-reply" onClick="comments.pick('+comment.id+');">Ответить</a>';
            html +=             '<div class="comment-footer-manage">';
            html +=                 Math.floor(Date.now() / 1000) < (parseInt(comment.date) + conf.edit_comments_timeout) && comment.manage ? '<a class="comment-manage-edit" onClick="comments.editInit('+comment.id+');"></a>':'';
            html +=                 Math.floor(Date.now() / 1000) < (parseInt(comment.date) + conf.delete_comments_timeout) && comment.manage || comment.staff ? '<a class="comment-manage-delete" onClick="comments.delete('+comment.id+');"></a>':'';
            html +=             '</div>';
            html +=             '<div class="comment-footer-like">';
            html +=                 '<div class="comment-like-action" onClick="comments.like('+comment.id+');">';
            html +=                     '<a class="comment-like-icon '+(parseInt(comment.youLike) ? 'liked':'')+'"></a>';
            html +=                     '<div class="comment-like-quantity" style="display: '+(parseInt(comment.like) > 0 ? 'block':'none')+'">'+parseInt(comment.like)+'</div>';
            html +=                 '</div>';
            html +=             '</div>';
            html +=         '</div>';
            html +=     '</div>';
            html += '</div>';
        return html;
    },

    ab: false,
    rc: 0,
    of: 0,
    cc: 0,
    cs: 0,
    cm: []

}