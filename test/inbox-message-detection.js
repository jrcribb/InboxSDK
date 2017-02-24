/* @flow */

import _ from 'lodash';
import fs from 'fs';
import assert from 'assert';
import sinon from 'sinon';
import Kefir from 'kefir';
import jsdomDoc from './lib/jsdom-doc';
import fakePageGlobals from './lib/fake-page-globals';
import querySelector from '../src/platform-implementation-js/lib/dom/querySelectorOrFail';

import makePageParserTree from '../src/platform-implementation-js/dom-driver/inbox/makePageParserTree';
import toItemWithLifetimePool from '../src/platform-implementation-js/lib/toItemWithLifetimePool';
import ItemWithLifetimePool from '../src/platform-implementation-js/lib/ItemWithLifetimePool';

import finder from '../src/platform-implementation-js/dom-driver/inbox/detection/message/finder';
import parser from '../src/platform-implementation-js/dom-driver/inbox/detection/message/parser';
import watcher from '../src/platform-implementation-js/dom-driver/inbox/detection/message/watcher';

import {
  page20160614,
  pageFullscreen20160620,
  page20160810,
  page20160810_2,
  page20160818_2,
  page20160819,
} from './lib/pages';

function makeThreadPool(root) {
  return toItemWithLifetimePool(
    makePageParserTree(null, root).tree.getAllByTag('thread')
  );
}

describe('Inbox Message Detection', function() {
  this.slow(5000);
  this.timeout(10000);

  fakePageGlobals();

  describe('finder', function() {
    it('2016-06-14', function() {
      const message = querySelector(page20160614(), '[data-test-id=message]');

      const results = finder(page20160614());
      assert.strictEqual(results.length, 1);
      assert(_.includes(results, message));
    });

    it('2016-06-20 fullscreen and bundled inline', function() {
      const message = querySelector(pageFullscreen20160620(), '[data-test-id=message]');

      const results = finder(pageFullscreen20160620());
      assert.strictEqual(results.length, 1);
      assert(_.includes(results, message));
    });

    it('2016-08-10 message', function() {
      const message = querySelector(page20160810(), '[data-test-id=message]');

      const results = finder(page20160810());
      assert.strictEqual(results.length, 1);
      assert(_.includes(results, message));
    });

    it('2016-08-10 message with attachments', function() {
      const message = querySelector(page20160810_2(), '[data-test-id=message]');

      const results = finder(page20160810_2());
      assert.strictEqual(results.length, 1);
      assert(_.includes(results, message));
    });

    it('2016-08-18', function() {
      const message = querySelector(page20160818_2(), '[data-test-id=message]');

      const results = finder(page20160818_2());
      assert.strictEqual(results.length, 1);
      assert(_.includes(results, message));
    });

    it('2016-08-19 draft in thread', function() {
      const message = querySelector(page20160819(), '[data-test-id=message]');

      const results = finder(page20160819());
      assert.strictEqual(results.length, 1);
      assert(_.includes(results, message));
    });
  });

  describe('parser', function() {
    it('2016-06-14 inline', function() {
      const message = querySelector(page20160614(), '[data-test-id=message]');
      const results = parser(message);
      assert.deepEqual(results.errors, []);
      assert.strictEqual(results.score, 1);
      assert(results.attributes.loaded);
      assert.strictEqual(results.attributes.isDraft, false);
      assert.strictEqual(results.attributes.viewState, 'EXPANDED');
      assert.strictEqual(results.attributes.messageId, '14ff3f449377ba4e');
    });

    it('2016-06-20 bundled inline', function() {
      const message = querySelector(pageFullscreen20160620(), '[data-test-id=message]');
      const results = parser(message);
      assert.deepEqual(results.errors, []);
      assert.strictEqual(results.score, 1);
      assert(results.attributes.loaded);
      assert.strictEqual(results.attributes.isDraft, false);
      assert.strictEqual(results.attributes.viewState, 'EXPANDED');
      assert.strictEqual(results.attributes.messageId, '150058a7ecc2fea4');
    });

    it('2016-08-10 message', function() {
      const message = querySelector(page20160810(), '[data-test-id=message]');
      const results = parser(message);
      assert.deepEqual(results.errors, []);
      assert.strictEqual(results.score, 1);
      assert(results.attributes.loaded);
      assert.strictEqual(results.attributes.isDraft, false);
      assert.strictEqual(results.attributes.viewState, 'EXPANDED');
      assert.strictEqual(results.attributes.messageId, '156755c188c4f67c');
    });

    it('2016-08-10 message with attachments', function() {
      const message = querySelector(page20160810_2(), '[data-test-id=message]');
      const results = parser(message);
      assert.deepEqual(results.errors, []);
      assert.strictEqual(results.score, 1);
      assert(results.attributes.loaded);
      assert.strictEqual(results.attributes.isDraft, false);
      assert.strictEqual(results.attributes.viewState, 'EXPANDED');
      assert.strictEqual(results.attributes.messageId, '6c908830f9c147cf');
    });

    it('2016-08-18', function() {
      const message = querySelector(page20160818_2(), '[data-test-id=message]');
      const results = parser(message);
      assert.deepEqual(results.errors, []);
      assert.strictEqual(results.score, 1);
      assert(results.attributes.loaded);
      assert.strictEqual(results.attributes.isDraft, false);
      assert.strictEqual(results.attributes.viewState, 'EXPANDED');
      assert.strictEqual(results.attributes.messageId, '1569ae485ebba663');
    });

    it('2016-08-19 draft in thread', function() {
      const message = querySelector(page20160819(), '[data-test-id=message]');
      const results = parser(message);
      assert.deepEqual(results.errors, []);
      assert.strictEqual(results.score, 1);
      assert.strictEqual(results.attributes.isDraft, true);
      assert.strictEqual(results.attributes.messageId, '9338c46c4d05b3f');
    });
  });

  describe('watcher', function() {
    it('2016-06-14', function(cb) {
      const message = querySelector(page20160614(), '[data-test-id=message]');

      const spy = sinon.spy();
      watcher(page20160614(), makeThreadPool(page20160614()))
        .takeUntilBy(Kefir.later(50))
        .onValue(spy)
        .onEnd(() => {
          const results = spy.args.map(callArgs => callArgs[0].el);
          assert.strictEqual(results.length, 1);
          assert(_.includes(results, message));
          cb();
        });
    });

    it('2016-06-20 fullscreen and bundled inline', function(cb) {
      const message = querySelector(pageFullscreen20160620(), '[data-test-id=message]');

      const spy = sinon.spy();
      watcher(pageFullscreen20160620(), makeThreadPool(pageFullscreen20160620()))
        .takeUntilBy(Kefir.later(50))
        .onValue(spy)
        .onEnd(() => {
          const results = spy.args.map(callArgs => callArgs[0].el);
          assert.strictEqual(results.length, 1);
          assert(_.includes(results, message));
          cb();
        });
    });

    it('2016-08-10 message', function(cb) {
      const message = querySelector(page20160810(), '[data-test-id=message]');

      const spy = sinon.spy();
      watcher(page20160810(), makeThreadPool(page20160810()))
        .takeUntilBy(Kefir.later(50))
        .onValue(spy)
        .onEnd(() => {
          const results = spy.args.map(callArgs => callArgs[0].el);
          assert.strictEqual(results.length, 1);
          assert(_.includes(results, message));
          cb();
        });
    });

    it('2016-08-10 message with attachments', function(cb) {
      const message = querySelector(page20160810_2(), '[data-test-id=message]');

      const spy = sinon.spy();
      watcher(page20160810_2(), makeThreadPool(page20160810_2()))
      .takeUntilBy(Kefir.later(50))
      .onValue(spy)
      .onEnd(() => {
        const results = spy.args.map(callArgs => callArgs[0].el);
        assert.strictEqual(results.length, 1);
        assert(_.includes(results, message));
        cb();
      });
    });

    it('2016-08-18', function(cb) {
      const message = querySelector(page20160818_2(), '[data-test-id=message]');

      const spy = sinon.spy();
      watcher(page20160818_2(), makeThreadPool(page20160818_2()))
        .takeUntilBy(Kefir.later(50))
        .onValue(spy)
        .onEnd(() => {
          const results = spy.args.map(callArgs => callArgs[0].el);
          assert.strictEqual(results.length, 1);
          assert(_.includes(results, message));
          cb();
        });
    });

    it('2016-08-19 draft in thread', function(cb) {
      const message = querySelector(page20160819(), '[data-test-id=message]');

      const spy = sinon.spy();
      watcher(page20160819(), makeThreadPool(page20160819()))
        .takeUntilBy(Kefir.later(50))
        .onValue(spy)
        .onEnd(() => {
          const results = spy.args.map(callArgs => callArgs[0].el);
          assert.strictEqual(results.length, 1);
          assert(_.includes(results, message));
          cb();
        });
    });
  });
});
