import EntitySchema from './entity.js'

// 类比normalize中的flatten，由外向内递归
const getUnflatten = (entities) => {
  const cache = {}
  const getEntity = getEntities(entities)
  return function unflatten (data, schema) {
    if (typeof schema.getName === 'undefined') {
      return unflattenNoEntity(schema, data, unflatten)
    }
    return unflattenEntity(data, schema, unflatten, getEntity, cache)
  }
}

// 针对schema是一个EntitySchema实体的情况
const unflattenEntity = (id, schema, unflatten, getEntity, cache) => {
  const entity = getEntity(id, schema)// 取到的对应schema的某个id所对应的对象
  if (!cache[schema.getName()]) {
    cache[schema.getName()] = {}
  }
  if (!cache[schema.getName()][id]) {
    const entityCopy = { ...entity }
    // 在有嵌套的情况下递归,由外向内
    Object.keys(schema.schema).forEach((key) => {
      if (entityCopy.hasOwnProperty(key)) {
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
  const object = { ...input }
  const arr = []
  const flag = schema instanceof Array
  // 判别数组和非数组，不同处理方法
  Object.keys(schema).forEach((key) => {
    if (flag) {
      if (object[key]) {
        object[key] = unflatten(object[key], schema[key])
      }
      arr.push(unflatten(object[key], schema[key]))
    } else {
      if (object[key]) {
        object[key] = unflatten(object[key], schema[key])
      }
    }
  })
  return flag ? arr : object
}

// 传入entities,获取对应schema的某个id所对应的对象
const getEntities = (entities) => {
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

const denormalize = (result, schema, entities) => getUnflatten(entities)(result, schema)

export { schema, denormalize }

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

const normalizedData = {
  result: '123',
  entities: {
    articles: {
      123: {
        id: '123',
        author: '1',
        title: 'My awesome blog post',
        comments: {
          total: 100,
          result: ['324']
        }
      }
    },
    users: {
      1: { uid: '1', name: 'Paul' },
      2: { uid: '2', name: 'Nicole' }
    },
    comments: {
      324: { id: '324', commenter: '2' }
    }
  }
}

const { result, entities } = normalizedData

const denormalizedData = denormalize(result, article, entities)
console.log(JSON.stringify(denormalizedData))
