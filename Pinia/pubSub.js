// 发布订阅模式
export function addSubscriber(subscriptions, cb) {
  // 订阅
  subscriptions.push(cb);
  // 返回一个取消订阅的函数
  return function removeSubscription() {
    // 取消订阅,idx是回调函数在数组中的索引
    const idx = subscriptions.indexOf(cb);
    // 找到就删除
    if (idx > -1) {
      // splice方法删除数组元素
      subscriptions.splice(idx, 1);
    }
  };
}

// 触发订阅
export function triggerSubscription(subscriptions, ...args) {
  // 通知所有的订阅者
  subscriptions.forEach((cb) => cb(...args));
}
