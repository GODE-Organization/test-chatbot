export var UserState;
(function (UserState) {
    UserState["IDLE"] = "idle";
    UserState["WAITING_INPUT"] = "waiting_input";
    UserState["IN_CONVERSATION"] = "in_conversation";
    UserState["SETTINGS"] = "settings";
})(UserState || (UserState = {}));
export var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["COMMAND"] = "command";
    MessageType["CALLBACK_QUERY"] = "callback_query";
    MessageType["PHOTO"] = "photo";
    MessageType["DOCUMENT"] = "document";
    MessageType["STICKER"] = "sticker";
    MessageType["VOICE"] = "voice";
    MessageType["VIDEO"] = "video";
    MessageType["LOCATION"] = "location";
    MessageType["CONTACT"] = "contact";
})(MessageType || (MessageType = {}));
//# sourceMappingURL=bot.js.map