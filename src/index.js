var logged = false

function onImageItemClick(info, tab) {
    chrome.windows.create({
        url: 'send.html#' + info.srcUrl 
        , width: 320
        , height: 360
        , focused: true
        , type: 'popup'
    });
}

var menuId = chrome.contextMenus.create({
    title: 'Отправить в ВК'
    , contexts: ['image']
    , onclick: onImageItemClick
})
