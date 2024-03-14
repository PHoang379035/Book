const express = require('express');
const axios = require('axios');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mysql = require('mysql');

//  tạo ứng dung Express
const app = express();

// Kết nối C-SDL MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'book',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database');
});

// Dữ lieu - books
const books = [
    { id: 1, title: 'Harry Potter and the Chamber of Secrets', author: 'J.K. Rowling' },
    { id: 2, title: 'Jurassic Park', author: 'Michael Crichton' },
  ];

// schema GraphQL
const schema = buildSchema(`
  type Book {
    id: Int
    title: String
    author: String
  }

  type Query {
    books: [Book]
    book(id: Int!): Book
  }

  type Mutation {
    createBook(title: String!, author: String!): Book
    updateBook(id: Int!, title: String, author: String): Book
    deleteBook(id: Int!): Boolean
  }
`);

// resolver GraphQL
const root = {
  books: () => {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM books', (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  },
  book: (args) => {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM books WHERE id = ?', [args.id], (error, results) => {
        if (error) {
          reject(error);
        } else {
          if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0]);
          }
        }
      });
    });
  },
  createBook: (args) => {
    return new Promise((resolve, reject) => {
      const { title, author } = args;
      db.query('INSERT INTO books (title, author) VALUES (?, ?)', [title, author], (error, result) => {
        if (error) {
          reject(error);
        } else {
          const newBook = {
            id: result.insertId,
            title: title,
            author: author,
          };
          resolve(newBook);
        }
      });
    });
  },
  updateBook: (args) => {
    return new Promise((resolve, reject) => {
      const { id, title, author } = args;
      db.query('UPDATE books SET title = ?, author = ? WHERE id = ?', [title, author, id], (error, result) => {
        if (error) {
          reject(error);
        } else {
          if (result.affectedRows === 0) {
            resolve(null);
          } else {
            const updatedBook = {
              id: id,
              title: title,
              author: author,
            };
            resolve(updatedBook);
          }
        }
      });
    });
  },
  deleteBook: (args) => {
    return new Promise((resolve, reject) => {
      const { id } = args;
      db.query('DELETE FROM books WHERE id = ?', [id], (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.affectedRows > 0);
        }
      });
    });
  },
};

// Middleware GraphQL
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphql: true, // Để bật GraphQL tool để check GraphQL API
}));

// run server
app.listen(5500, () => {
  console.log('GraphQL server running on http://localhost:5500/graphql');
});