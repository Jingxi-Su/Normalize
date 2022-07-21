(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
})((function () { 'use strict';

  /**
   * 
   * @param {*} name 该schema的名称
   * @param {*} entityParams 可选参数，定义该schema的外键，定义的外键可以不存在
   * @param {*} entityConfig 可选参数，目前仅支持一个参数idAttribute，定义该entity的主键，默认值为字符串'id'
   */
  class EntitySchema {// 创建一个类
    constructor (name, entityParams = {}, entityConfig = {}) {
      this.name = name;
      this.idAttribute = entityConfig.idAttribute || 'id';
      this.init(entityParams);// 有可能存在嵌套，所以需要在init方法中遍历，不能直接使用
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
      this.schema = {};
      for (const key in entityParams) {
        if (entityParams.hasOwnProperty(key)) {
          this.schema[key] = entityParams[key];
        }
      }
    }
  }

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
  };

  // 针对schema是一个EntitySchema实体的情况
  const schemaNormalize = (data, schema, flatten, addEntity) => {
    const copyData = JSON.parse(JSON.stringify(data));
    // 遍历schema属性值的所有key，递归调用flatten
    Object.keys(schema.schema).forEach((key) => {
      const innerSchema = schema.schema[key];
      const innerData = copyData[key];
      //范式化数据替换原始数据
      copyData[key] = flatten(innerData, innerSchema, addEntity);
    });
    addEntity(copyData, schema);
    return schema.getId(data)
  };

  // 针对schema是一个非EntitySchema实体的情况，可能是对象或者数组
  const noSchemaNormalize = (data, schema, flatten, addEntity) => {
    const object = JSON.parse(JSON.stringify(data));
    const arr = [];
    // 拿到嵌套的schema，进入flatten递归
    if (Array.isArray(schema)) {
      //当length>1时，因为schema只有一个key，所以Object.keys(schema).forEach会导致后面的内容无法识别，所以需要依据object.length
      for (let i = 0; i < object.length; i++) {
        const innerSchema = schema[i] || schema[schema.length - 1];
        const innerData = object[i];
        const value = flatten(innerData, innerSchema, addEntity);
        arr.push(value);
      }
      return arr;
    } else {
      Object.keys(schema).forEach(key => {
        const innerSchema = schema[key];
        const innerData = object[key];
        object[key] = flatten(innerData, innerSchema, addEntity);
      });

      return object
    }
  };

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
      const nameKey = schema.getName();
      const id = schema.getId(data);
      if (!(nameKey in entities)) {
        entities[nameKey] = {};
      }
      const existEntity = entities[nameKey][id];
      if (existEntity) {
        // id为索引的键
        // 防止有需要合并数据的情况
        entities[nameKey][id] = Object.assign(existEntity, data);
      } else {
        entities[nameKey][id] = data;
      }
    }
  };

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
    const entities = {};
    const addEntity = addEntities(entities);
    const result = flatten(data, schema, addEntity);
    return { entities, result }
  };

  const schema = {
    Entity: EntitySchema
  };

  // 类比normalize中的flatten，由外向内递归
  const getUnflatten = (entities) => {
    const cache = {};
    const getEntity = getEntities(entities);
    return function unflatten (data, schema) {
      if (!schema || schema.length <= 0) {
        throw new Error("normalize: schema invalid!");
      }
      if (!schema.getName) {
        return unflattenNoEntity(data, schema, unflatten)
      }
      return unflattenEntity(data, schema, unflatten, getEntity, cache)
    }
  };

  /**
   * 
   * @param {*} data id with/without data 
   * @param {*} schema schema corresponding to the data
   * @param {*} cache 
   * @returns 
   */

  // 针对schema是一个EntitySchema实体的情况
  const unflattenEntity = (data, schema, unflatten, getEntity, cache) => {
    const entity = getEntity(data, schema);// 取到对应schema的某个id所对应的对象
    if (!cache[schema.getName()]) {
      cache[schema.getName()] = {};
    }
    if (!cache[schema.getName()][data]) {
      const entityCopy = JSON.parse(JSON.stringify(entity));
      // 在有嵌套的情况下递归,由外向内
      Object.keys(schema.schema).forEach((key) => {
        if (entityCopy.hasOwnProperty(key)) {
          const innerSchema = schema.schema[key];
          const innerData = entityCopy[key];
          // 范式化数据替换回原本数据
          entityCopy[key] = unflatten(innerData, innerSchema);
        }
      });
      // 依次存入
      cache[schema.getName()][data] = entityCopy;
    }
    return cache[schema.getName()][data]
  };

  // 针对schema是一个非EntitySchema实体的情况
  const unflattenNoEntity = (data, schema, unflatten) => {
    const object = JSON.parse(JSON.stringify(data));
    const arr = [];
    // 判别数组和非数组，不同处理方法
    if (Array.isArray(schema)) {
      //防止多内容出现
      for (let i = 0; i < object.length; i++) {
        let innerData = object[i];
        const innerSchema = schema[i] || schema[schema.length - 1];
        if (innerData) {
          innerData = object[i] = unflatten(innerData, innerSchema);
        }
        arr.push(innerData);
      }
      return arr
    } else {
      Object.keys(schema).forEach((key) => {
        let innerData = object[key];
        const innerSchema = schema[key];
        if (innerData) {
          innerData = object[key] = unflatten(innerData, innerSchema);
        }
      });
      return object
    }
  };

  /**
   * 
   * @param {*} data  EntityOrId
   * @returns 
   */

  // 传入entities,获取对应schema的某个id所对应的对象
  const getEntities = (entities) => {
    return (data, schema) => {
      const schemaKey = schema.getName();
      if (typeof data === 'object') {
        return data
      }
      // 如果是id就返回entities中对应的范式化数据
      return entities[schemaKey][data]
    }
  };
  /**
   * 
   * @param {*} result 需要反范式化的数据，id的数组
   * @param {*} schema 外部实体
   * @param {*} entities 实体数据
   * @returns 
   */

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
  };

  const originalData = {
    id: '123',
    author: {
      uid: '1',
      name: 'Paul'
    },
    title: 'My awesome blog post',
    comments: {
      total: 100,
      result: [
        {
          id: '324',
          commenter: {
            uid: '2',
            name: 'Nicole'
          }
        },
        {
          id: '325',
          commenter: {
            uid: '3',
            name: 'Cici'
          }
        }]
    }
  };
  // Define user
  const user = new schema.Entity('users', {}, {
    idAttribute: 'uid'
  });
  // Define comments schema
  const comment = new schema.Entity('comments', {
    commenter: user
  });
  // Define article
  const article = new schema.Entity('articles', {
    author: user,
    comments: {
      result: [comment]
    }
  });

  const normalizedData = normalize(originalData, article);
  console.log(JSON.stringify(normalizedData));

  const { result, entities } = normalizedData;

  const denormalizedData = denormalize(result, article, entities);
  console.log(JSON.stringify(denormalizedData));

}));
