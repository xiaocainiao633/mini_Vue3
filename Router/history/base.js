import { createRoute } from "../create-matcher";

// 定义队列执行函数，按顺序异步执行钩子函数队列
function runQueue(queue, from, to, callback) {
  // 异步迭代队列需要采用递归的方式来实现，递归函数如下：
  function next(index) {
    // koa express原理一致
    // 如果索引超过队列长度，说明所有钩子执行完毕
    if (index >= queue.length) {
      // 执行回调函数
      return callback();
    }
    // 获取当前对应的钩子函数
    let hook = queue[index];
    // 执行当前钩子，传入next作为回调
    hook(from, to, () => next(index + 1));
  }
  next(0);
}

// 路由的核心基础类，管理路由状态和跳转逻辑
class Base {
  // 初始化路由状态
  constructor(router) {
    this.router = router; // 保存传入的路由器实例
    // 初始化当前路由状态
    this.current = createRoute(null, {
      path: "/",
    });
  }

  // 核心逻辑，处理路由跳转
  transitionTo(location, listener) {
    // 根据路径匹配到记录
    let route = this.router.match(location);
    // 让数组中的钩子组合起来依次调用 都调用完毕执行自己的逻辑
    runQueue(this.router.beforeEachHooks, this.current, route, () => {
      // 让数组中的钩子组合起来依次调用 都调用完毕执行自己的逻辑
      this.updateRoute(route); // 用最新的route更新current和_route
      // window.location.hash window.addEventListener
      listener && listener(); // 完成后调用用户回调
    });
  }

  updateRoute(route) {
    // 更新路由即可
    this.current = route;
    this.cb && this.cb(route); // hack 钩子
  }

  listen(cb) {
    this.cb = cb;
  }
}
export default Base;
