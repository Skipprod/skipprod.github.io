var partnership_current_form = 0,
    partnership_forms = [
        ['Предложите любимого блогера', 'partnership_about_idol'],
        ['Расскажите нам о себе', 'partnership_about_me']
    ];

var partnership_elem_title = 0,
    partnership_elem_prev = 0,
    partnership_elem_next = 0;

function partnershipInit() {
    partnership_elem_title = sel('.partnership-feedback--title', false),
    partnership_elem_prev = sel('.partnership-feedback--prev', false),
    partnership_elem_next = sel('.partnership-feedback--next', false);
    partnershipUpdate();
}
function partnershipUpdate() {
    if(!partnership_forms[partnership_current_form]) return;
    if(partnership_current_form <= 0) partnership_elem_prev.classList.add('hidden');
    else partnership_elem_prev.classList.remove('hidden');
    if(partnership_current_form >= partnership_forms.length-1) partnership_elem_next.classList.add('hidden');
    else partnership_elem_next.classList.remove('hidden');
    partnership_elem_title.innerHTML = partnership_forms[partnership_current_form][0];
    sel('.partnership-feedback-form--inputs').forEach(function(el, idx) {
        if(typeof partnership_forms[idx][1] == 'string' && partnership_forms[idx][1] == el.id) partnership_forms[idx][1] = el;
        if(idx == partnership_current_form) show(el);
        else hide(el);
    });
    sAnim.scroll();
}

function partnershipPrevForm(el) {
    if(partnership_current_form <= 0) return;
    else partnership_current_form --;
    if(partnership_current_form <= 0) partnership_elem_prev.classList.add('hidden');
    else partnership_elem_prev.classList.remove('hidden');
    var new_form = partnership_forms[partnership_current_form][1],
        last_form = partnership_forms[partnership_current_form+1][1];
    animate(partnership_elem_title, { opacity: 0, right: 15 }, 100, function() {
        partnership_elem_title.innerHTML = partnership_forms[partnership_current_form][0];
        partnership_elem_title.style = null, setStyle(partnership_elem_title, { opacity: 0, left: 15 });
        animate(partnership_elem_title, { opacity: 1, left: 0 }, 200, function() { partnershipUpdate(); });
    });
}

function partnershipNextForm(el) {
    if(partnership_current_form >= partnership_forms.length-1) return;
    else partnership_current_form ++;
    if(partnership_current_form >= partnership_forms.length-1) partnership_elem_next.classList.add('hidden');
    else partnership_elem_next.classList.remove('hidden');
    var new_form = partnership_forms[partnership_current_form][1],
        last_form = partnership_forms[partnership_current_form-1][1];
    animate(partnership_elem_title, { opacity: 0, left: 15 }, 100, function() {
        partnership_elem_title.innerHTML = partnership_forms[partnership_current_form][0];
        partnership_elem_title.style = null, setStyle(partnership_elem_title, { opacity: 0, right: 15 });
        animate(partnership_elem_title, { opacity: 1, right: 0 }, 200, function() { partnershipUpdate(); });
    });
}

function partnershipSendSuggestion(el) {
    var pff_i = sel('.partnership-feedback-form--input', partnership_forms[partnership_current_form][1]),
        pff_t = sel('.partnership-feedback-form--textarea', partnership_forms[partnership_current_form][1]);
    if(el) el.classList.add('btn-load');
    ajax.getjson('partnership.sendSuggestion', { name: pff_i[0].value, contact: pff_i[1].value, text: pff_t[0].value, category: partnership_current_form }, function(data) {
        if(el) el.classList.remove('btn-load');
        if(data.error) return topMsg(data.error.err_msg, 5, 'error');
        topMsg('Спасибо! Сообщение было успешно отправлено', 3, 'ok');
    });
}