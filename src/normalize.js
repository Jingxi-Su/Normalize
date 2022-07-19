import EntitySchema from './entity.js'

// 从最外层实体开始，不断向内递归当前schema
// 分两种情况：schema是EntitySchema实例 or 普通对象/数组(如result中的数据)
const flatten = (value, schema, addEntity) => {
  if (typeof schema.getName === 'undefined') {
    return noSchemaNormalize(schema, value, flatten, addEntity)
  }
  return SchemaNormalize(schema, value, flatten, addEntity)
}

// 针对schema是一个EntitySchema实体的情况
const SchemaNormalize = (schema, data, flatten, addEntity) => {
  const copyData = { ...data }
  const currentSchema = schema
  // 遍历schema属性值的所有key，递归调用flatten
  Object.keys(currentSchema.schema).forEach((key) => {
    const innerSchema = currentSchema.schema[key]
    const tmp = flatten(copyData[key], innerSchema, addEntity)
    copyData[key] = tmp
  })
  addEntity(currentSchema, copyData)
  return currentSchema.getId(data)
}

// 针对schema是一个非EntitySchema实体的情况
const noSchemaNormalize = (schema, data, flatten, addEntity) => {
  // schema可能是对象或者数组
  const arr = []
  const obj = { ...data }
  const flag = schema instanceof Array
  Object.keys(schema).forEach(key => {
    // 拿到嵌套的schema，进入flatten递归
    const innerSchema = schema[key]
    const value = flatten(data[key], innerSchema, addEntity)
    if (flag) { // 数组
      arr.push(value)
    } else { // 对象
      obj[key] = value
    }
  })
  return flag ? arr : obj
}

// 从里向外 向entities对象里添加范式化数据
const addEntities = (entities) => {
  // 根据schema和对应源数据，创建entities对象，
  // 以schema的name为键，源数据对象data为值
  return function (schema, data) {
    const nameKey = schema.getName()
    const id = schema.getId(data)
    if (!(nameKey in entities)) {
      entities[nameKey] = {}
    }
    const existEntity = entities[nameKey][id]
    if (existEntity) {
      // id为索引的键
      // 防止有需要合并数据的情况
      entities[nameKey][id] = Object.assign(existEntity, data)
    } else {
      entities[nameKey][id] = data
    }
  }
}

const normalize = (data, schema) => {
  const entities = {}
  const addEntity = addEntities(entities)
  const result = flatten(data, schema, addEntity)
  return { entities, result }
}

const schema = {
  Entity: EntitySchema
}

const originalData = {
  id: '123',
  author: {
    uid: '1',
    name: 'Paul'
  },
  title: 'My awesome blog post',
  comments: {
    total: 100,
    result: [{
      id: '324',
      commenter: {
        uid: '2',
        name: 'Nicole'
      }
    }]
  }
}
// Define user
const user = new schema.Entity('users', {}, {
  idAttribute: 'uid'
})
// Define comments schema
const comment = new schema.Entity('comments', {
  commenter: user
})
// Define article
const article = new schema.Entity('articles', {
  author: user,
  comments: {
    result: [comment]
  }
})

const normalizedData = normalize(originalData, article)
console.log(JSON.stringify(normalizedData))
