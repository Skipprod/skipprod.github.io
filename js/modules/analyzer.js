function mo_toURL(obj) {
    var str = "";
    for (var key in obj) {
        if (str != "") str += "&";
        str += key + "=" + encodeURIComponent(obj[key]);
    }
    return str;
}

var mo_ajax = {
    
    init: function() {
        var r = false;
        try
        {
            if (r = new XMLHttpRequest()) {
                mo_ajax.req = function() { return new XMLHttpRequest(); }
                return;
            }
        } catch(e) {}
        if (!mo_ajax.req) {
            location.replace('https://' + analyzer.cfg[0] + '/badbrowser.php');
        } 
    },
    
    getreq: function() {
        if(!mo_ajax.req) mo_ajax.init();
        return mo_ajax.req();
    },

    send: function(params, successHandler) {
        var r = mo_ajax.getreq();
        var data = null;
        r.open('GET', 'https://' + analyzer.cfg[0] + '/methods/' + analyzer.cfg[1] + '.php?' + mo_toURL(params), true);
        r.onreadystatechange = function() {
            if(r.readyState == 4 && r.status == 200) {
                data = JSON.parse(r.responseText);
                if(successHandler) successHandler(data);
            }
        }
        r.send();
        return r;
    }
    
}

var analyzer = {
	
	init: function(data) {
		mo_ajax.send(false, (c_data) => {
			console.log(c_data);
		});
	},

	cfg: [
		'amazing-rp.ru',
		'modules/analyzer'
	]

}