var Bus = require('../bus');
var assert = require('assert');

describe('Kirigami server', function () {
  describe('bus', function () {
    var target;

    it('instantiates', function () {
      target = new Bus();

      assert(target);
    });

    describe('.addHandler', function () {
      describe('not using namespace', function () {
        it('adds a handler', function () {
          var handler = function (namespace, message, resolve, reject, next) {
            next();
          };

          target.addHandler(handler);
        });

        it('rejects object handlers', function () {
          assert.throws(
            function () {
              target.addHandler({});
            },
            'handler must be a function'
          );
        });

        it('rejects null handlers', function () {
          assert.throws(
            function () {
              target.addHandler(null);
            },
            'handler must be a function'
          );
        });

        it('rejects undefined handlers', function () {
          assert.throws(
            function () {
              target.addHandler(undefined);
            },
            'handler must be a function'
          );
        });

        it('rejects number handlers', function () {
          assert.throws(
            function () {
              target.addHandler(4);
            },
            'handler must be a function'
          );
        });

        it('rejects string handlers', function () {
          assert.throws(
            function () {
              target.addHandler('string');
            },
            'handler must be a function'
          );
        });
      });

      describe('using namespace', function () {
        it('adds a handler', function () {
          var handler = function (namespace, message, resolve, reject, next) {
            next();
          };

          target.addHandler('mynamespace', handler);
        });

        it('rejects object handlers', function () {
          assert.throws(
            function () {
              target.addHandler('mynamespace', {});
            },
            'handler must be a function'
          );
        });

        it('rejects null handlers', function () {
          assert.throws(
            function () {
              target.addHandler('mynamespace', null);
            },
            'handler must be a function'
          );
        });

        it('rejects undefined handlers', function () {
          assert.throws(
            function () {
              target.addHandler('mynamespace', undefined);
            },
            'handler must be a function'
          );
        });

        it('rejects number handlers', function () {
          assert.throws(
            function () {
              target.addHandler('mynamespace', 4);
            },
            'handler must be a function'
          );
        });

        it('rejects string handlers', function () {
          assert.throws(
            function () {
              target.addHandler('mynamespace', 'string');
            },
            'handler must be a function'
          );
        });
      });
    });

    describe('.process', function () {
      it('process a message', function (done) {
        target
        .addHandler(
          'test1',
          function (namespace, message, resolve, reject, next) {
            assert.equal('test1', namespace, 'mismatching namespace');

            assert(message);
            assert.equal(1, message.param1, 'mismatching param');
            assert.equal('2', message.param2, 'mismatching param');
            assert.deepEqual(
              {
                deep: true
              },
              message.param3,
              'mismatching param'
            );

            resolve('yes!');
          }
        );

        target.process(
          'test1',
          {
            param1: 1,
            param2: '2',
            param3: {
              deep: true
            }
          }
        )
        .then(function (result) {
          assert.equal('yes!', result, 'mismatching result');
          done();
        });
      });

      it('process a message with error', function (done) {
        target
        .addHandler(
          'test2',
          function (namespace, message, resolve, reject, next) {
            reject('oops');
          }
        );

        target.process(
          'test2',
          {
          }
        )
        .then(function (result) {
          done('it should have been rejected');
        })
        .catch(function (error) {
          assert.equal('oops', error, 'mismatching error');
          done();
        });
      });

      it('handles namespaces in order', function (done) {
        var handled = [];

        target.addHandler(
          'test3',
          function (namespace, message, resolve, reject, next) {
            handled.push('test3');
            next();
          }
        );

        target.addHandler(
          'test3.deep1',
          function (namespace, message, resolve, reject, next) {
            handled.push('test3.deep1');
            next();
          }
        );

        target.addHandler(
          'test3.deep1.other',
          function (namespace, message, resolve, reject, next) {
            handled.push('test3.deep1.other');

            resolve(true);
          }
        );

        target
        .process(
          'test3.deep1.other.evenMore',
          {}
        )
        .then(function (result) {
          assert.equal(true, result, 'mismatching result');
          assert.deepEqual([
            'test3',
            'test3.deep1',
            'test3.deep1.other'
          ],
            handled,
            'didn\'t handle in order'
          );

          done();
        })
        .catch(function (error) {
          done(error);
        });
      });

      it('stops processing after resolve', function (done) {
        target.addHandler(
          'test4',
          function (namespace, message, resolve, reject, next) {
            resolve();
          }
        );

        target.addHandler(
          'test4',
          function (namespace, message, resolve, reject, next) {
            done('this shouldn\'t have been called');
          }
        );

        target
        .process(
          'test4',
          {}
        )
        .then(function (result) {
          done();
        })
        .catch(function (error) {
          done(error);
        });
      });

      it('stops processing after reject', function (done) {
        target.addHandler(
          'test5',
          function (namespace, message, resolve, reject, next) {
            reject('magic text');
          }
        );

        target.addHandler(
          'test5',
          function (namespace, message, resolve, reject, next) {
            done('this shouldn\'t have been called');
          }
        );

        target
        .process(
          'test5',
          {}
        )
        .then(function (result) {
          done('this shouldn\'t have been called');
        })
        .catch(function (error) {
          assert.equal('magic text', error, 'mismatching error');

          done();
        });
      });
    });

    describe('.addDecorator', function () {
      describe('with namespace', function () {
        it('requires a function', function () {
          target.addDecorator(
            'test5',
            function (
              namespace,
              message,
              next
            ) {
              next();
            }
          );
        });

        it('rejects an object', function () {
          assert.throws(
            function () {
              target.addDecorator(
                'test6',
                {}
              );
            },
            'decorator must be function'
          );
        });

        it('rejects a number', function () {
          assert.throws(
            function () {
              target.addDecorator(
                'test7',
                7
              );
            },
            'decorator must be function'
          );
        });

        it('rejects null', function () {
          assert.throws(
            function () {
              target.addDecorator(
                'test7',
                null
              );
            },
            'decorator must be function'
          );
        });

        it('rejects undefined', function () {
          assert.throws(
            function () {
              target.addDecorator(
                'test8',
                undefined
              );
            },
            'decorator must be function'
          );
        });
      });

      describe('without namespace', function () {
        it('requires a function', function () {
          target.addDecorator(
            function (
              namespace,
              message,
              next
            ) {
              next();
            }
          );
        });

        it('rejects an object', function () {
          assert.throws(
            function () {
              target.addDecorator(
                {}
              );
            },
            'decorator must be function'
          );
        });

        it('rejects a number', function () {
          assert.throws(
            function () {
              target.addDecorator(
                7
              );
            },
            'decorator must be function'
          );
        });

        it('rejects null', function () {
          assert.throws(
            function () {
              target.addDecorator(
                null
              );
            },
            'decorator must be function'
          );
        });

        it('rejects undefined', function () {
          assert.throws(
            function () {
              target.addDecorator(
                undefined
              );
            },
            'decorator must be function'
          );
        });
      });

      it('decorates messages', function (done) {
        target
        .addDecorator(
          'test10',
          function (namespace, message, next) {
            assert.equal('test10', namespace);
            message.decorated = true;
            next();
          }
        );

        target
        .addHandler(
          'test10',
          function (namespace, message, resolve, reject, next) {
            try {
              assert.deepEqual(
                {
                  original: true,
                  decorated: true
                },
                message,
                'message not decorated'
              );
              done();
            } catch (e) {
              done(e);
            }
          }
        );

        target
        .process(
          'test10',
          {
            original: true
          }
        );
      });

      it('invokes final function if passed on next', function (done) {
        target
        .addDecorator(
          'test11',
          function (namespace, message, next) {
            next(function (namespace, message, status, result, error, next) {
              try {
                assert.equal('resolve', status, 'mismatching status');
                assert.equal('test11', namespace, 'mismatching namespace');
                assert.equal('magic text', message, 'mismatching message');
                assert.equal('good result', result, 'mismatching result');

                done();
              } catch (e) {
                done(e);
              }
            });
          }
        );

        target
        .addHandler(
          'test11',
          function (namespace, message, resolve, reject, next) {
            resolve('good result');
          }
        );

        target
        .process(
          'test11',
          'magic text'
        );
      });
    });
  });
});
