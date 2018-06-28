const express = require('express');
const app = express();
const connection = require('express-myconnection');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var users = require('./routes/users');

// app.use((req, res, next) => {
//     res.status(200).json({
//         message: 'It WORKS!!!!'
//     });
// });

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


module.exports = app;
