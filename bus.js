var async = require('async');

function getHandlers(namespace, handlers) {
  var targetFragments = namespace.split('.');

  var matching = [];

  for (var candidate in handlers) {
    if (namespace === candidate) {
      matching.push(candidate);
    } else {
      var candidateFragments = candidate.split('.');

      var matches = true;

      for (var i = 0; i < candidateFragments.length; i++) {
        if (targetFragments[i] !== candidateFragments[i]) {
          matches = false;
          break;
        }
      }

      if (matches) matching.push(candidate);
    }
  }

  var sorted = matching.sort();

  var final = [].concat(handlers[''] || []);

  for (var i = 0; i < sorted.length; i++) {
    final.push.apply(final, handlers[sorted[i]]);
  }

  return final;
}

function KarigamiServerBus() {
  this.handlers = {
    '': []
  };
  this.decorators = {
    '': []
  };
}

KarigamiServerBus.prototype.addHandler = function (namespace, handler) {
  if (handler === undefined) {
    handler = namespace;
    namespace = '';
  }

  namespace = namespace || '';

  if (typeof(handler) !== 'function') {
    throw new Error('handler must be a function');
  }

  this.handlers[namespace] = this.handlers[namespace] || [];
  this.handlers[namespace].push(handler);
};

KarigamiServerBus.prototype.process = function (namespace, message) {
  var chain = getHandlers(namespace, this.handlers);
  var decorators = getHandlers(namespace, this.decorators);



  return new Promise(function (resolve, reject) {
    var result;
    var error;
    var done;

    async
    .eachSeries(
      decorators,
      function (
        decorator,
        callback
      ) {
        decorator(namespace, message, callback);
      },
      function (err) {
        if (err) return reject(err);

        async
        .eachSeries(
          chain,
          function (
            handler,
            callback
          ) {
            if (done) return callback();

            handler(
              namespace,
              message,
              function (res) {
                if (!done) {
                  done = 'resolve';
                  result = res;
                }

                callback();
              },
              function (err) {
                if (!done) {
                  done = 'reject';
                  error = err;
                }

                callback();
              },
              function () {
                callback();
              }
            );
          },
          function () {
            if (done === 'reject') {
              reject(error);
            } else if (done === 'resolve') {
              resolve(result);
            } else {
              reject('no handlers')
            }
          }
        );  
      }
    );
  });
};

KarigamiServerBus.prototype.addDecorator = function (namespace, decorator) {
  if (decorator === undefined) {
    decorator = namespace;
    namespace = '';
  }

  namespace = namespace || '';

  if (typeof(decorator) !== 'function') {
    throw new Error('decorator must be a function');
  }

  this.decorators[namespace] = this.decorators[namespace] || [];
  this.decorators[namespace].push(decorator);
};

module.exports = KarigamiServerBus;
