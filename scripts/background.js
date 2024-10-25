chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
    if (message.type === "get-config") {
        fetch(message.url, { method: 'GET', headers: { 'Content-Type': 'application/json' } }).then(res => {
            return res.json();
        }).then(res => {
            senderResponse(res);
        })
    }
    return true
});