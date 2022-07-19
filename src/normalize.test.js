import { schema, normalize } from './normalize.js'

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
