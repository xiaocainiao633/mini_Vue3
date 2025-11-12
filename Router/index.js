// index.js
import { createMatcher } from "./create-matcher";
import install from "./install";
import HashHistory from "./history/hash";
import BrowserHistory from "./history/history";

// 路由的核心管理
export class VueRouter {
  constructor(options = {}) {
    // 根据路由的配置参数进行格式化操作 {}
    // 创建一个匹配器 用于匹配记录
    // 根据用户传递的routes创建匹配关系 this.matcher需要提供两个方法
    // match 方法用来匹配规则
    // addRouters用来动态添加路由
    this.matcher = createMatcher(options.routes || []); // 两个方法 match addRouters

    switch (options.mode) {
      case "hash": // 哈希模式：使用URL中的#后面部分作为路由（如http://xxx/#/home）
        this.history = new HashHistory(this);
        break;
      case "history": // HTML5历史模式：使用history API（如http://xxx/home）
        this.history = new BrowserHistory(this);
        break;
    }
    // 3. 初始化全局前置守卫队列（beforeEach钩子）
    this.beforeEachHooks = [];
  }

  // 初始化方法：在根Vue实例挂载时调用，启动路由系统
  init(app) {
    const history = this.history;
    // 1. 注册路由变化的监听：当路由更新时，同步更新根实例的_route（响应式）
    history.listen((route) => {
      // 这个回调的目的是更新app._route 这个_route是一个响应式的变量
      app._route = route;
    });
    // 让路由系统过度到某个路径
    const setupHashListener = () => {
      history.setupListener(); // 监听路径变化
    };

    history.transitionTo(
      // 父类提供方法负责跳转
      history.getCurrentLocation(), // 子类获取对应的路径
      // 跳转成功后注册路径监听，为视图更新做准备
      setupHashListener
    );
  }

  match(location) {
    return this.matcher.match(location); // {path:'/about/a',matched:[]}
  }

  // 全局前置守卫注册方法：收集beforeEach钩子函数
  beforeEach(hooks) {
    this.beforeEachHooks.push(hooks); // 钩子会在transitionTo中由runQueue执行
  }
}

VueRouter.install = install; // 提供的install方法
