import RouterView from "./components/router-view";
import RouterLink from "./components/router-link";

// 声明全局变量，用于存储Vue的构造函数
export let Vue;

// 定义install函数，会被Vue.use()调用
export const install = (_Vue) => {
  // 保存Vue的构造函数
  Vue = _Vue;
  // 使用mixin混入全局生命周期，给所有组件添加veforeCreate钩子
  Vue.mixin({
    beforeCreate() {
      // 给所有组件的生命周期都增加beforeCreate方法
      // 判断当前组件是否是根组件（只有根组件会在options中传入router实例）
      if (this.$options.router) {
        // 1. 根组件逻辑：将自身标记为_routerRoot（路由根实例）
        this._routerRoot = this;
        // 2. 保存路由实例到根组件的_router属性（供子组件访问）
        this._router = this.$options.router;
        // 3. 初始化路由：调用路由实例的init方法（内部会启动监听、触发初始跳转等）
        this._router.init(this);
        // 4. 将当前路由状态（history.current）定义为响应式数据（_route）
        // 这样路由变化时，依赖_route的组件会自动重新渲染
        Vue.util.defineReactive(this, "_route", this._router.history.current);
      } else {
        // 子组件逻辑：通过父组件找到_routerRoot（实现路由实例的层级共享）
        this._routerRoot = this.$parent?._routerRoot;
      }
      // 通过_routerRoot，所有组件都能访问到根组件上的_router（路由实例）和_route（当前路由状态）
    },
  });

  // 给Vue原型添加$route属性（只读），方便组件中访问当前路由状态
  Object.defineProperty(Vue.prototype, "$route", {
    get() {
      // 从_routerRoot上获取响应式的_route（即当前路由信息，如path、params等）
      return this._routerRoot._route;
    },
  });

  // 给Vue原型添加$router属性（只读），方便组件中调用路由方法
  Object.defineProperty(Vue.prototype, "$router", {
    get() {
      // 从_routerRoot上获取路由实例（包含push、go、addRoutes等方法）
      return this._routerRoot._router; // 存的都是方法 this.$router.addRoutes this.$router.push
    },
  });

  // 全局注册RouterLink组件（<router-link>），用于声明式路由跳转
  Vue.component("RouterLink", RouterLink);
  // 全局注册RouterView组件（<router-view>），用于渲染匹配的路由组件
  Vue.component("RouterView", RouterView);
};
