// 获取当前哈希值
export function getHash() {
  // window.location.hash 返回 URL 中 # 及其后面的部分（如 "#/about"）
  // slice(1) 截取 # 后面的内容（如 "/about"），作为实际路由路径
  return window.location.hash.slice(1);
}
