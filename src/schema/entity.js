export default class EntitySchema {// 创建一个类
  constructor (name, entityParams = {}, entityConfig = {}) {
    this.name = name
    this.idAttribute = entityConfig.idAttribute || 'id'
    this.init(entityParams)// 有可能存在嵌套，所以需要在init方法中遍历，不能直接使用
  }

  // 获取name
  getName () {
    return this.name
  }

  // 获取id
  getId (input) {
    return input[this.idAttribute]// 取对应id值
  }

  // entityParams存在嵌套的情况，因此需要在init方法中遍历entityParams中的schema属性，向this.schema添加对应的嵌套schema实例
  init (entityParams) {
    this.schema = {}
    for (const key in entityParams) {
      if (entityParams.hasOwnProperty(key)) {
        this.schema[key] = entityParams[key]
      }
    }
  }
}
