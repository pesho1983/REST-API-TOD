const express = require('express');
const app = express();
const connection = require('express-myconnection');
const mysql = require('mysql');
var bodyParser = require('body-parser');
var users = require('./routes/users');
var lists = require('./routes/lists');
var tasks = require('./routes/tasks');

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

    },'single') //or single
);



app.get('/users', users.list);
app.post('/users', users.save);
app.get('/lists', lists.list);
app.post('/lists', lists.save);
app.get('/tasks', tasks.list);
app.post('/tasks', tasks.save);

<<<<<<< HEAD

module.exports = app;
=======
>>>>>>> origin/master
