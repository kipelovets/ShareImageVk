var App = {
    APP_ID: 4350692
}

var Options = {
    get: function (name, defaultValue) {
        if (name in localStorage) {
            return localStorage[name]
        } else {
            return defaultValue
        }
    }
    , set: function (name, value) {
        localStorage[name] = value
    }
}

var tokenChecked = false

var VK = {
    api: function () {
        var args = Array.prototype.slice.call(arguments, 0); 
        args.unshift(null); 
        var apiCall = api.bind.apply(api, args);
        checkToken(apiCall)
    }
    , checkToken: checkToken
    , auth: function (cb) {
        var redirect_uri = 'https://oauth.vk.com/blank.html';
        var redirect_regex = /^https:\/\/oauth.vk.com\/blank.html#(.*)$/i;
        chrome.windows.getCurrent(function(wnd) {
            chrome.tabs.getCurrent(function(tab) {
                chrome.windows.create({
                    url: 'https://oauth.vk.com/authorize?client_id=' + App.APP_ID + '&scope=photos,messages,friends&redirect_uri=' + redirect_uri + '&display=popup&v=5.7&response_type=token',
                    tabId: tab.id,
                    focused: true,
                    type: 'popup',
                    left: wnd.left + (wnd.width - 700) >> 1,
                    top: wnd.top + (wnd.height - 500) >> 1,
                    width: 700,
                    height: 500,
                }, function(popup) {
                    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
                        var match;
                        if (tab.windowId == popup.id && changeInfo.url && (match = changeInfo.url.match(redirect_regex))) {
                            chrome.windows.remove(popup.id);

                            var params = match[1].split('&');
                            for (var i = 0; i < params.length; i++) {
                                var kv = params[i].split('=');
                                if (kv[0] == 'access_token') {
                                    Options.set('access_token', kv[1]);
                                    cb && cb(kv[1])
                                }
                            }
                        }
                    });
                });
            });
        });
}
}

var Http = {
    download: function (url, callback) {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function(){
                if (this.readyState == 4 && this.status == 200){
                callback(this.response);
                }
            }
            xhr.open('GET', url);
            xhr.responseType = 'blob';
            xhr.send();
        }
    , upload: function (url, data, cb) {
            var formData = new FormData();
            formData.append('photo', data, 'file.jpg');
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function(){
                if (this.readyState == 4 && this.status == 200) {
                    var res = (typeof this.response == 'string') ? JSON.parse(this.response) : this.response;
                    cb(res)
                }
            }
            xhr.open('POST', url);
            xhr.responseType = 'json';
            xhr.send(formData);
        }
}

var Util = {
    notify: function (title, message) {
        var notification = window.webkitNotifications.createNotification(null, title, message);

        notification.onclick = function () {
            notification.close();
        }
        notification.show();
        setTimeout(function() {
            notification.close();
        }, 5000);
    } 
}

function api(method, params, callback) {
  var arr = ['v=5.7', 'access_token=' + Options.get('access_token')];
  for (var k in params) {
    arr.push(k + '=' + escape(params[k]));
  }

  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(){
    if (this.readyState == 4 && this.status == 200) {
      var res = (typeof this.response == 'string') ? JSON.parse(this.response) : this.response;
      if (!callback(res) && res.error) {
          notify('Ошибка ' + res.error.error_code + ' при выполнении запроса «' + method + '»',
            'Произошла ошибка «' + res.error.error_msg + ' при обращении к API ВКонтакте. Сообщите разработчику.')
      }
    }
  }
  xhr.open('POST', 'https://api.vk.com/method/' + method);
  xhr.responseType = 'json';
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.send(arr.join('&'));
}

function checkToken(cb) {
    if (tokenChecked) {
        cb()
        return
    }
    if (!Options.get('access_token')) {
        VK.auth(cb)
    } else {
        api('users.get', {}, function (resp) {
            if (resp.response) {
                VK.user_id = resp.response[0].id
                tokenChecked = true
                cb()
            } else {
                VK.auth(cb)
            }
            return true
        })
    }
}
