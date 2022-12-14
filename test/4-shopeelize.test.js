import { schema, normalize } from "../src/schema/normalize.js";
import { denormalize } from "../src/schema/denormalize.js";

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
          result: ['324', '325']
        }
      }
    },
    users: {
      1: { uid: '1', name: 'Paul' },
      2: { uid: '2', name: 'Nicole' },
      3: { uid: '3', name: 'Cici' }
    },
    comments: {
      324: { id: '324', commenter: '2' },
      325: { id: '325', commenter: '3' }
    }
  }
}

test('The output of normalize is equal to normalizedData', () => {
  const user = new schema.Entity('users', {}, {
    idAttribute: 'uid'
  })
  const comment = new schema.Entity('comments', {
    commenter: user
  })
  const article = new schema.Entity('articles', {
    author: user,
    comments: {
      result: [comment]
    }
  })
  const data = normalize(originalData, article)
  expect(data).toEqual(normalizedData)
})

test('The output of denormalize is equal to originalData', () => {
  const user = new schema.Entity('users', {}, {
    idAttribute: 'uid'
  })
  const comment = null
  const article = new schema.Entity('articles', {
    author: user,
    comments: {
      result: [comment]
    }
  })
  const { result, entities } = normalizedData
  expect(() => denormalize(result, article, entities)).toThrow(Error)
})