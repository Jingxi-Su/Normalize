import EntitySchema from './entity.js'

// 从最外层实体开始，不断向内递归当前schema
// 分两种情况：schema是EntitySchema实例 or 普通对象/数组(如result中的数据)
const flatten = (data, schema, addEntity) => {
  if (!schema || schema.length <= 0) {
    throw new Error("normalize: schema invalid!");
  }
  //判断是否存在getName方法从而推断是否是schema
  if (!schema.getName) {
    return noSchemaNormalize(data, schema, flatten, addEntity)
  }
  return schemaNormalize(data, schema, flatten, addEntity)
}

// 针对schema是一个EntitySchema实体的情况
const schemaNormalize = (data, schema, flatten, addEntity) => {
  const copyData = JSON.parse(JSON.stringify(data))
  // 遍历schema属性值的所有key，递归调用flatten
  Object.keys(schema.schema).forEach((key) => {
    const innerSchema = schema.schema[key]
    const innerData = copyData[key]
    //范式化数据替换原始数据
    copyData[key] = flatten(innerData, innerSchema, addEntity)
  })
  addEntity(copyData, schema)
  return schema.getId(data)
}

// 针对schema是一个非EntitySchema实体的情况，可能是对象或者数组
const noSchemaNormalize = (data, schema, flatten, addEntity) => {
  const object = JSON.parse(JSON.stringify(data))
  const arr = []
  // 拿到嵌套的schema，进入flatten递归
  if (Array.isArray(schema)) {
    //当length>1时，因为schema只有一个key，所以Object.keys(schema).forEach会导致后面的内容无法识别，所以需要依据object.length
    for (let i = 0; i < object.length; i++) {
      const innerSchema = schema[i] || schema[schema.length - 1]
      const innerData = object[i]
      const value = flatten(innerData, innerSchema, addEntity)
      arr.push(value)
    }
    return arr;
  } else {
    Object.keys(schema).forEach(key => {
      const innerSchema = schema[key]
      const innerData = object[key]
      object[key] = flatten(innerData, innerSchema, addEntity)
    })

    return object
  }
}

/**
 * 
 * @param {*} entities entity数据
 * @returns 
 */

// 从里向外 向entities对象里添加范式化数据
const addEntities = (entities) => {
  // 根据schema和对应源数据，创建entities对象，
  // 以schema的name为键，源数据对象data为值
  return function addData (data, schema) {
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

/**
 * 
 * @param {*} data 需要范式化的数据
 * @param {*} schema Entity实例，代表schema
 * @returns 
 */

const normalize = (data, schema) => {
  if (!data) {
    throw new Error("normalize: data invalid!");
  }
  if (!schema) {
    throw new Error("normalize: schema invalid!");
  }
  const entities = {}
  const addEntity = addEntities(entities)
  const result = flatten(data, schema, addEntity)
  return { entities, result }
}

const schema = {
  Entity: EntitySchema
}

export { schema, normalize }
