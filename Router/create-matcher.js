// 导出创建路由匹配的函数，接收routes数组
export const createMatcher = (routes) => {
  // 生成路由映射表
  let { pathMap } = createRouteMap(routes); // {path:'/',record:{},path:'/about',record}

  // 根据路径匹配对应的路由记录
  function match(location) {
    // 从pathMap中获取路径对应的路由记录（如location为'/about'，则取pathMap['/about']
    let record = pathMap[location];
    return createRouteMap(record, {
      // 根据记录创建对应的路由 {path:/about/a,matched:[about,aboutA]}
      path: location,
    });
  }

  // 动态添加新路由
  function addRoutes(routes) {
    // 将新的routes 也增加到pathMap中
    return createRouteMap(routes, pathMap);
  }

  // 返回匹配方法，添加路由方法和路由映射表
  return {
    match,
    addRoutes,
    pathMap,
  };
};

// 参数：routes-新路由配置；oldMap-已有的映射表（可选，用于合并）
function createRouteMap(routes, oldMap) {
  // 初始化pathMap: 如果有旧的映射表就复用，否则创建空对象
  const pathMap = oldMap || Object.create(null);
  // 遍历路由配置
  routes.forEach((route) => {
    // 添加到路由记录 用户配置可能无限层级 稍后要递归调用此方法
    addRouteRecord(pathMap, route);
  });
  // 返回生成的映射表
  return {
    pathMap,
  };
}

// /about/a/b 三个组件 /about[record1] /about/a/[record2] /about/a/b[record3]
// /about/a/b -> 通过匹配到的记录向上查找parent属性将记录维护起来 [record1,record2]
function addRouteRecord(pathMap, route, parentRecord) {
  // /about/a 匹配几个组件?
  // 可以动态添加路由
  // 如果是子路由记录 需要增加前缀
  let path = parentRecord ? `${parentRecord.path}/${route.path}` : route.path;
  // 提取需要信息
  let record = {
    path, // 完整路径
    component: route.component, // 路由对应的组件
    parent: parentRecord, // 父路由记录
    // 可扩展
  };
  // 若pathMap中没有当前路径的记录，则添加（避免重复注册）
  if (!pathMap[path]) {
    pathMap[path] = record;
  }
  // 若当前路由有子路由（children），递归处理子路由
  if (route.children) {
    // 递归添加子路由
    route.children.forEach((childRoute) => {
      // 传入当前record作为子路由的parentRecord，实现嵌套关联
      addRouteRecord(pathMap, childRoute, record);
    });
  }
}
