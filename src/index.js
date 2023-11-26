const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function getUserTodo(username, id) {
  const { todos } = findUser(username);
  return todos.find((t) => t.id === id);
}

function findUser(username) {
  return users.find((u) => u.username === username);
}

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  console.log(request.headers);
  if (!(users.some((u) => u.username === username)))
    return response.status(400).json({ error: 'User do not exist' });
  
  request.username = username;
  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;
  
  if (users.some((u) => u.username === username))
    return response.status(400).json({ error: 'User already exits' });

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  }
  users.push(newUser);
  return response.status(201).send(newUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request;
  const user = findUser(username);
  
  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request;
  const { title, deadline } = request.body;
  const { todos } = findUser(username);

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  }
  todos.push(todo);

  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { username } = request;
  const { title, deadline } = request.body;
  const { id } = request.params;
  const todo = getUserTodo(username, id);

  if (!todo)
    return response.status(404).json({ error: "Todo not found" });
  
  todo.title = title;
  todo.deadline = deadline;

  return response.json(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { username } = request;
  const { id } = request.params;
  const todo = getUserTodo(username, id);

  if (!todo)
    return response.status(404).json({ error: "User's todo not found" });

  todo.done = true;
  return response.json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { username } = request;
  const { id } = request.params;
  const todo = getUserTodo(username, id);
  if (!todo)
    return response.status(404).json({ error: "User's todo not found" });

  const user = findUser(username);
  user.todos.splice(todo, 1);

  return response.status(204).json(user.todos);
});

module.exports = app;