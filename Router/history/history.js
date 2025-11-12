import Base from "./base";
import { getHash } from "./hash";

class HashHistory extends Base {
  constructor(route) {
    super(route);
  }

  // 获取当前的哈希路径
  getCurrentLocation() {
    return getHash();
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

  // 设置哈希变化的监听器
  setupListener() {
    // 当URL中的哈希值变化时触发
    window.addEventListener("hashchange", () => {
      // 监听hash值的变化 hash变化后再调用transitionTo方法
      this.transitionTo(getHash());
    });
  }
}
export default HashHistory;
