import EntitySchema from './entity.js'

// 类比normalize中的flatten，由外向内递归
const getUnflatten = (entities) => {
  const cache = {}
  const getEntity = getEntities(entities)
  //FIXME: unflatten 统一格式
  return function unflatten (data, schema) {
    //FIXME: 简化判断
    if (typeof schema.getName === 'undefined') {
      return unflattenNoEntity(schema, data, unflatten)
    }
    return unflattenEntity(data, schema, unflatten, getEntity, cache)
  }
}

// 针对schema是一个EntitySchema实体的情况
const unflattenEntity = (id, schema, unflatten, getEntity, cache) => {
  //FIXME: 统一 schema 临时变量
  const entity = getEntity(id, schema)// 取到的对应schema的某个id所对应的对象
  if (!cache[schema.getName()]) {
    cache[schema.getName()] = {}
  }
  if (!cache[schema.getName()][id]) {
    //FIXME: 用深拷贝 JSON.parse(JSON.stringify(data));
    const entityCopy = { ...entity }
    // 在有嵌套的情况下递归,由外向内
    Object.keys(schema.schema).forEach((key) => {
      if (entityCopy.hasOwnProperty(key)) {
        //FIXME：统一命名 entityCopy[key] -> innerEntity
        const innerschema = schema.schema[key]
        // 范式化数据替换回原本数据
        entityCopy[key] = unflatten(entityCopy[key], innerschema)
      }
    })
    // 依次存入
    cache[schema.getName()][id] = entityCopy
  }
  return cache[schema.getName()][id]
}

// 针对schema是一个非EntitySchema实体的情况
const unflattenNoEntity = (schema, input, unflatten) => {
    //FIXME: 用深拷贝 JSON.parse(JSON.stringify(data));
  const object = { ...input }
  const arr = []
  //FIXME: Prefer using Array.isArray https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
  const flag = schema instanceof Array
  // 判别数组和非数组，不同处理方法
  Object.keys(schema).forEach((key) => {
    if (flag) {
      //FIXME：统一命名 schema[key] -> innerSchema
      //FIXME：统一命名 object[key] -> innerObject
      if (object[key]) {
        object[key] = unflatten(object[key], schema[key])
      }
      arr.push(unflatten(object[key], schema[key]))
    } else {
      //FIXME: 减少重复代码
      if (object[key]) {
        object[key] = unflatten(object[key], schema[key])
      }
    }
  })
  return flag ? arr : object
}

// 传入entities,获取对应schema的某个id所对应的对象
const getEntities = (entities) => {
  //FIXME：统一命名 entityOrId -> data
  return (entityOrId, schema) => {
    const schemaKey = schema.getName()
    if (typeof entityOrId === 'object') {
      return entityOrId
    }
    // 如果是id就返回entities中对应的范式化数据
    return entities[schemaKey][entityOrId]
  }
}

const schema = {
  Entity: EntitySchema
}

  //FIXME: 边界判断 例如 result, schema, entities为空的情况
const denormalize = (result, schema, entities) => getUnflatten(entities)(result, schema)

export { schema, denormalize }
