!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(require("type-r/ext-types"),require("type-r")):"function"==typeof define&&define.amd?define(["type-r/ext-types","type-r"],t):t(e.ExtTypes,e.Nested)}(this,function(e,t){"use strict";Function.prototype.value=function(e){return new t.ChainableAttributeSpec({type:this,value:e,hasCustomDefault:!0})},Object.defineProperty(Function.prototype,"isRequired",{get:function(){return this._isRequired||this.has.isRequired},set:function(e){this._isRequired=e}}),Object.defineProperty(Function.prototype,"asProp",{get:function(){return this.has.asProp}}),Object.defineProperty(Function.prototype,"has",{get:function(){return this._has||t.type(this)},set:function(e){this._has=e}}),Object.defineProperties(Date,{microsoft:{value:e.MicrosoftDate},timestamp:{value:e.Timestamp}}),Number.integer=e.Integer,"undefined"!=typeof window&&(window.Integer=e.Integer)});
//# sourceMappingURL=index.js.map
