/**
 * Event utility that is not use locks on triggered.
 */
var Events = createConstructor({
  _handlers: null,
  init: function() {
    this._handlers = {};
  },
  on: function(when, handler) {
    return (this._handlers[when] || (this._handlers[when] = [])).push(handler), this;
  },
  off: function(when, handler) {
    var handlers = this._handlers[when];
    if (!handlers) {
      return this;
    }

    if (!handler) {
      handlers.length = 0;
    } else {
      for (var i = 0; i < handlers.length; i++) {
        if (handlers[i] === handler) {
          handlers.splice(i, 1);
        }
      }
    }

    if (!handlers.length) {
      delete this._handlers[when];
    }
    return this;
  },
  once: function(when, handler) {
    var once = function() {
      try {
        handler.apply(this, arguments);
      } finally {
        this.off(when, once);
      }
    };
    return this.on(when, once);
  },
  trigger: function(when) {
    var args = slice(arguments, 1);
    var handlers = this._handlers[when];

    if (handlers) {
      for (var i = 0; i < handlers.length; i++) {
        handlers[i].apply(this, args);
      }
    }
    return this;
  },
  clear: function() {
    for (var when in this._handlers) {
      this.off(when);
    }
    return this;
  }
});

exports.events = Events;

