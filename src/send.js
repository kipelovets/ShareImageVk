var imageUrl = document.location.hash.substr(1)
var container = document.getElementById('container')

VK.checkToken(init)

function closeWindow() {
    chrome.windows.getCurrent(function (wnd) {
        chrome.windows.remove(wnd.id)
    })
}

function init() {
    VK.api('friends.get', {fields:'photo_50',order:'hints'}, function (resp) {
        container.innerHTML = Handlebars.templates.friends(resp.response)
        var lis = container.querySelectorAll('.users li')
        for (var i = 0; i < lis.length; i++) {
            lis[i].onclick = onSelectFriend
        }
    })

    var search = document.getElementById('search')
    search.onkeyup = function () {
        var lis = document.querySelectorAll('.users li'), i, s = search.value.toLowerCase()
        for (i = 0; i < lis.length; i++) {
            lis[i].style.display = lis[i].getAttribute('data-name')
                .toLowerCase()
                .indexOf(s) !== -1 ? 'block' : 'none'
        }
    }

    function onSelectFriend(e) {
        var friendId = this.getAttribute('data-id')
        container.innerHTML = 'Отправка фотографии...'
        Http.download(imageUrl, function (data) {
            VK.api('photos.getMessagesUploadServer', {}, function (resp) {
                Http.upload(resp.response.upload_url, data, function (resp) {
                    VK.api('photos.saveMessagesPhoto', resp, function (resp) {
                        VK.api('messages.send', {user_id:friendId,attachment:'photo' + VK.user_id + '_'+resp.response[0].id}, function (resp) {
                            Util.notify('Ok', 'Фотография отправлена')
                            closeWindow()
                        })
                    })
                })
            })
        })
    }
}
