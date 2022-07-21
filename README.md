# Shopeelize
Shopeelize is a codebase for JSON that can be used to normalize nested objects, or denormalize normalized data to nested objects.

- **Normalize：** A set of principles and techniques in database design to reduce data redundancy and improve data consistency in databases.

- **Denormalize：** A database without redundancy may not be the best database, and sometimes it is necessary to lower the paradigm standard and keep redundant data appropriately in order to improve operational efficiency. Denormalize is to allow redundancy to achieve the purpose of trading space for time.

## Installation
All packages have been added to package.json, so you only need to

```bash
npm install
```
## Functions

### Creation of Entity Structures

```javascript
/**
 * 
 * @param {*} name 该schema的名称
 * @param {*} entityParams 可选参数，定义该schema的外键，定义的外键可以不存在
 * @param {*} entityConfig 可选参数，目前仅支持一个参数idAttribute，定义该entity的主键，默认值为字符串'id'
 */
export default class EntitySchema {// 创建一个类
  constructor (name, entityParams = {}, entityConfig = {}) {
    this.name = name
    this.idAttribute = entityConfig.idAttribute || 'id'
    this.init(entityParams)// 有可能存在嵌套，所以需要在init方法中遍历，不能直接使用
  }
}
```

### Normalization
```javascript
/**
 * 
 * @param {*} data 需要范式化的数据
 * @param {*} schema Entity实例，代表schema
 * @returns 
 */

const normalize = (data, schema) 
```

### Denormalization
```javascript
/**
 * 
 * @param {*} result 需要反范式化的数据，id的数组
 * @param {*} schema 外部实体
 * @param {*} entities 实体数据
 * @returns 
 */

const denormalize = (result, schema, entities)
```

## Examples
### Normalization

- OriginalData
```javascript
const originalData = {
  "id": "123",
  "author":  {
    "uid": "1",
    "name": "Paul"
  },
  "title": "My awesome blog post",
  "comments": {
    total: 100,
    result: [{
        "id": "324",
        "commenter": {
        "uid": 2",
          "name": "Nicole"
        }
      }]
  }
}
```

- Entity
```javascript
// Define a users schema
const user = new schema.Entity('users', {}, {
  idAttribute: 'uid'
})

// Define your comments schema
const comment = new schema.Entity('comments', {
  commenter: user
})

// Define your article
const article = new schema.Entity('articles', {
  author: user,
  comments: {
    result: [ comment ]

  }
})
```
- Output
```javascript
const normalizedData = normalize(originalData, article)

{
  result: "123",
  entities: {
    "articles": {
      "123": {
        id: "123",
        author: "1",
        title: "My awesome blog post",
        comments: {
    	total: 100,
    	result: [ "324" ]
        }
      }
    },
    "users": {
      "1": { "uid": "1", "name": "Paul" },
      "2": { "uid": "2", "name": "Nicole" }
    },
    "comments": {
      "324": { id: "324", "commenter": "2" }
    }
  }
}
```

### Denormalization

- Normalized Data
```javascript
{
  result: "123",
  entities: {
    "articles": {
      "123": {
        id: "123",
        author: "1",
        title: "My awesome blog post",
        comments: {
    	total: 100,
    	result: [ "324" ]
        }
      }
    },
    "users": {
      "1": { "uid": "1", "name": "Paul" },
      "2": { "uid": "2", "name": "Nicole" }
    },
    "comments": {
      "324": { id: "324", "commenter": "2" }
    }
  }
}
```
- Output
```javascript
const { result, entities } = normalizedData

const denormalizedData = denormalize(result, article, entities)


{
  "id": "123",
  "author":  {
    "uid": "1",
    "name": "Paul"
  },
  "title": "My awesome blog post",
  "comments": {
    total: 100,
    result: [{
        "id": "324",
        "commenter": {
        "uid": 2",
          "name": "Nicole"
        }
      }]
  }
}
```
