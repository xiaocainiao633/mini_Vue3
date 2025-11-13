export class Promise {
  // 记录三种状态
  private status: 'pending' | 'resolved' | 'rejected' = 'pending'
  // 存储异步结果，成功值或者失败原因
  private value: any
  // 成功状态回调函数，暂存
  private onResolvedCallbacks: Array<(value: any) => void> = []
  // 失败状态回调函数，暂存
  private onRejectedCallbacks: Array<(reason: any) => void> = []

  // 接收resolve和reject
  constructor(
    executor: (
      resolve: (value: any) => void,
      reject: (reason: any) => void
    ) => void
  ) {
    try {
      // 防止this指向丢失
      executor(this.resolve.bind(this), this.reject.bind(this))
    } catch(error) {
      // 若抛出错误则被捕获
      this.reject(error)
    }
  }

  // 处理成功状态
  private resolve(value: any) {
    // 若value是另一个实例，则等待其完成后再处理
    if(value instanceof Promise) {
      return value.then(this.resolve.bind(this), this.reject.bind(this))
    }
    // 确保异步执行
    setTimeout(() => {
      // 状态变更
      if(this.status === 'pending') {
        this.status = 'resolved'
        this.value = value
        // 执行所有回调函数
        this.onResolvedCallbacks.forEach((callback) => callback(value))
      }
    })
  }

  // 处理成功状态
  private reject(reason: any) {
    // 确保异步执行
    setTimeout(() => {
      if(this.status === 'pending') {
        this.status = 'rejected'
        this.value = reason
        // 执行所有回调函数
        this.onRejectedCallbacks.forEach((callback) => callback(reason))
      }
    })
  }

  // 链式调用核心，接收回调函数，返回新的promise
  then(onFulfilled?: (value: any) => any, onRejected?: (reason: any) => any) {
    return new Promise((resolve, reject) => {
      // 定义resolve状态的回调处理逻辑
      const fulfilledCallback = () => {
        try {
          // 若没有传入 onFulfilled，直接将当前 value 传递给下一个 Promise
          // 否则执行 onFulfilled，获取返回值
          const result = onFulfilled ? onFulfilled(this.value) : this.value
          // 处理回调返回值，决定新 Promise 的状态（核心逻辑）
          resolvePromise(result, resolve, reject)
        } catch(error) {
          // 若回调执行出错，直接 reject 新 Promise
          reject(error)
        }
      }

      // 同理
      const rejectedCallback = () => {
        try {
          const result = onRejected ? onRejected(this.value) : this.value
          resolvePromise(result, resolve, reject)
        } catch (error) {
          reject(error)
        }
      }

      // 根据当前状态执行回调函数
      if(this.status === 'resolved' ) {
        setTimeout(fulfilledCallback)
      } else if(this.status === 'rejected') {
        setTimeout(rejectedCallback)
      } else {
        // pending则存入队列
        this.onResolvedCallbacks.push(fulfilledCallback)
        this.onRejectedCallbacks.push(rejectedCallback)
      }
    })
  }

  // catch 方法：专门捕获错误，等价于 then(undefined, onRejected)
  catch(onRejected: (reason: any) => any) {
    return this.then(undefined, onRejected)
  }

  // 静态方法 all：接收 Promise 数组，返回新 Promise
  // 所有成功则返回结果数组；任一失败则返回该错误
  static all(promises: Promise[]) {
    return new Promise((resolve, reject) => {
      // 存储所有成功结果（按原数组顺序）
      const results: any[] = []
      // 已完成的 Promise 计数器
      let completed = 0

      promises.forEach((promise, index) => {
        promise
          .then((data) => {
            // 按索引存储结果（保证顺序）
            results[index] = data
            // 计数器+1
            completed++
            // 若所有 Promise 都完成，resolve 结果数组
            if(completed === promises.length) {
              resolve(results)
            }
          })
          // 任一 Promise 失败，直接 reject 新 Promise
          .catch(reject)
      })
    })
  }

  // 静态方法 race：接收 Promise 数组，返回新 Promise
  // 第一个完成（成功/失败）的结果即为最终结果
  static race(promises: Promise[]) {
    return new Promise((resolve, reject) => {
      promises.forEach((promise) => {
        // 第一个触发 resolve 或 reject 的结果会被返回
        promise.then(resolve).catch(reject)
      })
    })
  }

  // 静态方法 resolve：快速创建一个已 resolved 的 Promise
  static resolve(value: any) {
    return new Promise((resolve) => resolve(value))
  }

  // 静态方法 reject：快速创建一个已 rejected 的 Promise
  static reject(reason: any) {
    return new Promise((_, reject) => reject(reason))
  }

}

// 处理回调返回值与新 Promise 关系的核心函数
function resolvePromise(
  x: any, // x：前一个回调的返回值
  resolve: (value: any) => void, // resolve/reject：新 Promise 的状态控制器
  reject: (reason: any) => void,
  visited = new Set<any>()  // visited：用于检测循环引用的 Set
) {
  // 若 x 已被处理过（循环引用），直接 reject
  if(visited.has(x)) {
    return reject(new TypeError('循环引用'))
  }
  
  // 若 x 是 Promise 实例：等待其完成后递归处理结果
  if(x instanceof Promise) {
    visited.add(x)
    x.then(
      (value) => resolvePromise(value, resolve, reject, visited),
      (reason) => reject(reason)
    )
    // 若 x 是对象或函数（可能是 thenable 对象，如其他库的 Promise）
  } else if( x !== null && (typeof x === 'object' || typeof x === 'function')) {
    let then
    try {
      // 尝试获取 x.then 方法（可能抛出错误，如 x.then 是 getter 且报错）
      then = x.then
    } catch (error) {
      // 获取 then 失败，直接 reject 新 Promise
      return reject(error)
    }

    // 若 then 是函数（确认是 thenable 对象）
    if(typeof then === 'function') {
      let called = false  // 标记 then 回调是否已执行（防止多次调用）
      try {
        visited.add(x)
        // 调用 then 方法，传入新的 resolve 和 reject（模拟 Promise 行为）
        then.call(
          x,
          (y: any) => {
            if(called) return 
            called = true
             // y 可能仍是 Promise/thenable，递归处理
            resolvePromise(y, resolve, reject, visited)
          },
          (r: any) => {
            if(called) return 
            called = true
            // 失败则直接 reject 新 Promise
            reject(r)
          }
        )
      } catch (error) {
        // 若 then 执行出错，且未调用过回调，则 reject
        if(!called) {
          reject(error)
        }
      }
    } else { // then 不是函数（普通对象），直接 resolve x
      resolve(x)
    }
  } else{ // 普通值（非对象/函数）：直接 resolve x
    resolve(x)
  }
}