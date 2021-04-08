import ext from "./utils/ext";

var connection = new WebSocket('ws://127.0.0.1:8013', 'civet-protocol');

ext.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.action === "perform-save") {
      console.log("Extension Type: ", "/* @echo extension */");
      console.log("PERFORM AJAX", request.data);
      sendResponse({ action: "saved" });
    }
  }
);