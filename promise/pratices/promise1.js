/**
 * 手写 Promise 2021-4-10
 */

const { isFunction } = require('../utils');
const { needAFunction, needNewPromise, forbidenNoNew } = require('../error');

const PENDING = 'PENDING'; //  进行中
const FULFILLED = 'FULFILLED'; // 成功
const REJECTED = 'REJECTED'; // 失败

/**
 *
 * @param {function} executor 一个会立刻执行的函数，函数接收两个函数参数
 */
function Promise(executor) {
  // 必须传入一个函数
  if (!isFunction(executor)) {
    needAFunction();
  }

  this.status = PENDING; // 初始状态
  this.value = void 0; // 成功值
  this.reason = void 0; // 失败的原因
  this.onFulfilledCallbacks = []; // 订阅成功回调
  this.onRejectedCallbacks = []; // 订阅失败回调

  // 成功态，注意 this 的指向
  const resolve = (value) => {
    if (value instanceof Promise) {
      return value.then(resolve, reject);
    }
    if (this.status === PENDING) {
      this.value = value; // 保留成功的值
      this.status = FULFILLED; // 成功状态改变
      this.onFulfilledCallbacks.forEach((fn) => fn());
    }
  };

  // 失败态
  const reject = (reason) => {
    if (this.status === PENDING) {
      this.reason = reason; // 保留成功的原因
      this.status = REJECTED; // 失败状态改变
      this.onRejectedCallbacks.forEach((fn) => fn());
    }
  };
  // 执行器立即执行，执行过程中如果出现异常需要捕获处理
  try {
    executor(resolve, reject);
  } catch (error) {
    reject(error);
  }
}

/**
 *
 * @param {*} onFulfilled 成功回调，可选的
 * @param {*} onRejected 失败回调，可选的
 *
 * @return 新 promise，状态为 pending
 */
Promise.prototype.then = function (onFulfilled, onRejected) {
  onFulfilled = isFunction(onFulfilled) ? onFulfilled : (v) => v; // 成功回调，可选的
  onRejected = isFunction(onRejected)
    ? onRejected
    : (error) => {
        throw error;
      }; // 失败回调，可选的

  // 注意这里的 this 指向，用箭头函数指向当前的实例，而不是回调函数里
  let promise2 = new Promise((resolve, reject) => {
    // 成功时--规范要求是异步的 当前时间循环的最后触发
    if (this.status === FULFILLED) {
      setTimeout(() => {
        try {
          let x = onFulfilled(this.value);
          promiseResolutionProcedure(promise2, x, resolve, reject);
        } catch (error) {
          reject(error);
        }
      }, 0);
    }

    // 失败时
    if (this.status === REJECTED) {
      setTimeout(() => {
        try {
          let x = onRejected(this.reason);
          promiseResolutionProcedure(promise2, x, resolve, reject);
        } catch (error) {
          reject(error);
        }
      }, 0);
    }

    // 进行中--订阅发布模式
    if (this.status === PENDING) {
      this.onFulfilledCallbacks.push(() => {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value);
            promiseResolutionProcedure(promise2, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      });

      this.onRejectedCallbacks.push(() => {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason);
            promiseResolutionProcedure(promise2, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      });
    }
  });

  return promise2;
};

/**
 * 不能是同一个 promise
 */
function promiseResolutionProcedure(promise2, resultX, resolve, reject) {
  if (promise2 === resultX) {
    return reject(needNewPromise());
  }

  // 判断 resultX 的类别
  if ((typeof resultX === 'object' && resultX != null) || isFunction(resultX)) {
    let called = false;
    try {
      let then = resultX.then;
      if (isFunction(then)) {
        then.call(
          resultX,
          (y) => {
            if (called) return;
            called = true;
            promiseResolutionProcedure(promise2, y, resolve, reject);
          },
          (r) => {
            if (called) return;
            called = true;
            reject(r);
          }
        );
      } else {
        resolve(resultX);
      }
    } catch (error) {
      if (called) return;
      called = true;
      reject(error);
    }
  } else {
    resolve(resultX);
  }
}

Promise.prototype.catch = function (params) {};

Promise.prototype.finally = function (params) {};

/**
 * A+ 标准检查工具需要的参数
 * @returns dfd {
 *  promise,
 *  resolve,
 *  reject
 * }
 */
Promise.deferred = function () {
  let dfd = {};
  dfd.promise = new Promise((resolve, reject) => {
    dfd.reject = reject;
    dfd.resolve = resolve;
  });
  return dfd;
};

module.exports = Promise;
