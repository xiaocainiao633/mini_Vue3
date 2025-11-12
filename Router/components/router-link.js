export default {
  // props接收外部参数
  props: {
    // 添加to属性，用于指定路由目标路径
    to: {
      type: String, // 字符串类型
      required: true, // 必填属性
    },
    // 定义tag属性，用于指定组件渲染的HTML属性
    tag: {
      type: String,
      default: "a", // 默认为a标签
    },
  },
  // 定义组件的方法
  methods: {
    handleClick() {
      // 可能是hash模式 还有可能是history模式
      // window.location.hash = this.to;
      this.$router.push(this.to); // 调用路由实例的push方法，跳转到指定路径
    },
  },
  // 用于定义组件的渲染输出
  render(h) {
    // 复杂的组件全部可以采用render函数的写法
    const tagName = this.tag;
    // 内容为组件的默认插槽
    return <tagName onClick={this.handleClick}>{this.$slots.default}</tagName>;
  },
};
