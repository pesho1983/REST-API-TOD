const express = require('express');
const app = express();
const connection = require('express-myconnection');
const mysql = require('mysql');
var bodyParser = require('body-parser');
var users = require('./routes/users');
var lists = require('./routes/lists');
var tasks = require('./routes/tasks');
var listAll = require('./routes/list-all');
var deleteList = require('./routes/deleteList');
var taskInList = require('./routes/listTasksInList');
var deleteTask = require('./routes/deleteTask');
var deleteUser = require('./routes/deleteUser');

// app.use((req, res, next) => {
//     res.status(200).json({
//         message: 'It WORKS!!!!'
//     });
// });

module.exports =  app;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(

    connection(mysql,{

        host: '192.168.10.254', //'localhost',
        user: 'dbuser',
        password : 'password01',
        port : 3306, //port mysql
        database:'mydb'
    },'request')
);


app.get('/users', users.list);
app.post('/users', users.save);
app.put('/users', users.update);
app.get('/lists', lists.list);
app.post('/lists', lists.save);
app.put('/lists/:list_id', lists.update);
// app.get('/tasks', tasks.list);
app.post('/tasks', tasks.save);
app.get('/list-all-lists', listAll.listAll);
app.delete('/lists', deleteList.delete);
app.get('/tasks', taskInList.listTask);
app.put('/tasks', tasks.update);
app.delete('/tasks', deleteTask.softDelete);
app.delete('/users', deleteUser.softDelete);
