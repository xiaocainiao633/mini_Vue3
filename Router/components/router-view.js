export default {
  functional: true, // 函数式组件 它没有自己的状态 所以性能更好 正常组件是一个类组件 每次使用这个组件都要new 函数式组件可以直接拿到返回的虚拟节点来渲染
  render(h, { parent, data }) {
    let route = parent.$route; // 拿到的就是我们刚才定义的那个响应式数据
    // 级联组件
    let depth = 0;
    data.routerView = true; // 先默认肯定是渲染根组件
    while (parent) {
      // 根据当前组件向上查找
      // $vnode表示这个组件的虚拟节点 _vnode表示组件渲染vnode
      // 根据matched 渲染对应的router-view
      if (parent.$vnode && parent.$vnode.data.routerView) {
        depth++;
      }
      parent = parent.$parent; // 不停地找爸爸 找到最顶层
    }
    let record = route.matched[depth];
    if (!record) {
      return h();
    }
    // 组件渲染时先父后子 App.vue(router-view) About(router-view)
    return h(record.component, data);
  },
};
// 根据路由嵌套层级渲染对应的组件
