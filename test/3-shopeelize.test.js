import { schema, normalize } from "../src/schema/normalize.js";

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
}

test('Normalization throw error when schema is null', () => {
  const user = new schema.Entity('users', {}, {
    idAttribute: 'uid'
  })
  const comment = new schema.Entity('comments', {
    commenter: user
  })
  const article = null
  expect(() => normalize(originalData, article)).toThrow(Error)
})