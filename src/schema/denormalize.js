import EntitySchema from './entity.js'

// 类比normalize中的flatten，由外向内递归
const getUnflatten = (entities) => {
  const cache = {}
  const getEntity = getEntities(entities)
  return function unflatten (data, schema) {
    if (!schema.getName) {
      return unflattenNoEntity(data, schema, unflatten)
    }
    return unflattenEntity(data, schema, unflatten, getEntity, cache)
  }
}

/**
 * 
 * @param {*} data id with/without data 
 * @param {*} schema schema corresponding to the data
 * @param {*} cache 
 * @returns 
 */

// 针对schema是一个EntitySchema实体的情况
const unflattenEntity = (data, schema, unflatten, getEntity, cache) => {
  const entity = getEntity(data, schema)// 取到对应schema的某个id所对应的对象
  if (!cache[schema.getName()]) {
    cache[schema.getName()] = {}
  }
  if (!cache[schema.getName()][data]) {
    const entityCopy = JSON.parse(JSON.stringify(entity))
    // 在有嵌套的情况下递归,由外向内
    Object.keys(schema.schema).forEach((key) => {
      if (entityCopy.hasOwnProperty(key)) {
        const innerSchema = schema.schema[key]
        const innerData = entityCopy[key]
        // 范式化数据替换回原本数据
        entityCopy[key] = unflatten(innerData, innerSchema)
      }
    })
    // 依次存入
    cache[schema.getName()][data] = entityCopy
  }
  return cache[schema.getName()][data]
}

// 针对schema是一个非EntitySchema实体的情况
const unflattenNoEntity = (data, schema, unflatten) => {
  const object = JSON.parse(JSON.stringify(data))
  const arr = []
  const flag = Array.isArray(schema)
  // 判别数组和非数组，不同处理方法
  Object.keys(schema).forEach((key) => {
    let innerData = object[key]
    const innerSchema = schema[key]
    if (innerData) {
      innerData = object[key] = unflatten(innerData, innerSchema)
    }
    if (flag) {
      arr.push(unflatten(innerData, innerSchema))
    }
  })
  return flag ? arr : object
}

/**
 * 
 * @param {*} data  EntityOrId
 * @returns 
 */

// 传入entities,获取对应schema的某个id所对应的对象
const getEntities = (entities) => {
  return (data, schema) => {
    const schemaKey = schema.getName()
    if (typeof data === 'object') {
      return data
    }
    // 如果是id就返回entities中对应的范式化数据
    return entities[schemaKey][data]
  }
}

const schema = {
  Entity: EntitySchema
}

const denormalize = (result, schema, entities) => {
  if (!result) {
    throw new Error("denormalize: result invalid!");
  }
  if (!schema) {
    throw new Error("denormalize: schema invalid!");
  }
  if (!entities) {
    throw new Error("denormalize: entities invalid!");
  }
  return getUnflatten(entities)(result, schema)
}

export { schema, denormalize }
