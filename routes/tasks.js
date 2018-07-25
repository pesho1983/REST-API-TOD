exports.list = function(req, res) {

  req.getConnection(function(err, connection) {
    var query = connection.query('SELECT * FROM tasks', function(err, rows) {
      if (err)
        console.log("Error Selecting : %s ", err);

      res.send(rows);
    });
  });
};

// exports.save = function(req, res) {
//
//   var input = JSON.parse(JSON.stringify(req.body));
//
//   req.getConnection(function(err, connection) {
//     var data = {
//       title: input.title,
//       text: input.description,
//       owner_user_id: input.owner_user_id
//     };
//
//     var query = connection.query("INSERT INTO tasks set ? ", data, function(err, rows) {
//       if (err) {
//         console.log(err.code + '\n' + err.sqlMessage);
//         res.status(400).json({
//           message: err.sqlMessage
//         });
//       } else {
//         var query = connection.query('SELECT task_id FROM tasks WHERE title = ?', input.title, function(err, title_id) {
//           res.status(200).json(list_id[0]);
//         });
//       };
//     });
//   });
// };

exports.save = function(req, res) {
  var userAuth = false;

  if (req.headers.authorization) {
    var auth = req.headers.authorization.split(" ")[1];
    var creds = Buffer.from(auth, 'base64').toString("utf-8");
    var user = creds.split(":")[0];
    var pass = creds.split(":")[1];
    userAuth = true;
    console.log(`\nAuth header data: ${user} ${pass}\n`);
  }

  var input = JSON.parse(JSON.stringify(req.body));

  if (input.task_status == 'null' || typeof input.task_status === `undefined`) {
    input.task_status = 'Not Started';
  }
  console.log(input.task_status)
  var data_input = {
    task_title: input.task_title,
    task_desc: input.task_desc,
    task_status: input.task_status,
    task_in_list: input.task_in_list
  };

  var validationError = false;

  if (typeof data_input.task_title !== `undefined`) {
    if (data_input.task_title.length < 1) {
      validationError = true;
      console.log(`111111111111111`);
    }
  }

  if (typeof data_input.task_in_list !== `undefined`) {
    if (data_input.task_in_list.length < 1) {
      validationError = true;
      console.log(`222222222222222`);
    }
  }
  for (var key in data_input) {
    if (typeof data_input[key] === `undefined`) {
      delete data_input[key];
    }
  }

  if (data_input.task_status !== 'Not Started' &&
    data_input.task_status !== 'In Progress' &&
    data_input.task_status !== 'Finished') {
    validationError = true;
    console.log(`3333333333333`);
  }

  console.log(data_input)

  if (validationError) {
    res.status(409).json({
      message: "Invalid data."
    })
  } else {
    if (userAuth) {
      req.getConnection(function(err, connection) {
        //We have a user and pass from authorization header
        var qstr = "SELECT is_active, user_id FROM users WHERE username = ? AND password = ?;"
        var query = connection.query(qstr, [user, pass], function(err, data) {
          if (err) {
            res.status(400).json({
              message: "Bad request."
            })
          } else if (data < 1) {
            res.status(404).json({
              message: "Wrong username or password."
            })
          } else if (!data[0].is_active) {
            res.status(401).json({
              message: "Account disabled."
            })
          } else {
            var qstr = "SELECT 1 FROM lists WHERE list_owner_user_id = ? AND list_id = ?;";
            var query = connection.query(qstr, [data[0].user_id, input.task_in_list], function(err, rows) {
              if (rows.length === 1) {
                var qstr = "INSERT INTO tasks SET ?;"
                var query2 = connection.query(qstr, data_input, function(err, rows) {
                  if (err) {
                    res.status(400).json({
                      message: err.sqlMessage
                    });
                  } else {
                    res.status(200).json({
                      id: rows.insertId
                    });
                  }
                });
              } else {
                res.status(404).json({
                  message: `You don not own list with id ${data_input.task_in_list}`
                })
              }
            })
          }
        });
      })
    } else {
      res.status(401).json({
        message: "Authorization required."
      })
    };
  };
};

exports.update = function(req, res) {
  var userAuth = false;

  if (req.headers.authorization) {
    var auth = req.headers.authorization.split(" ")[1];
    var creds = Buffer.from(auth, "base64").toString("utf-8");
    var user = creds.split(":")[0];
    var pass = creds.split(":")[1];
    userAuth = true;
    console.log(`\nAuth header data: ${user} ${pass}\n`);
  }

  var input = JSON.parse(JSON.stringify(req.body));

  var data_input = {
    task_title: input.task_title,
    task_desc: input.task_desc,
    task_status: input.task_status
  };

  console.log(data_input)
  for (var key in data_input) {
    if (typeof data_input[key] === `undefined`) {
      delete data_input[key];
    }
    if (input.task_title !== undefined){
    if (input.task_title.length < 1) {
      res.status(409).json({
        message:
          "Invalid data. Check input data for task title. It must be at least 1 symbol"
      });
    }
  }
  if (data_input.task_status !== 'Not Started' && data_input.task_status !== 'In Progress' &&
    data_input.task_status !== 'Finished' && data_input.task_status !== undefined) {
      res.status(400).json({
        message:"Wrong input data. Task status must be Not Started, In Progress or Finished"
        });
    }  
  }

  if (userAuth) {
    req.getConnection(function(err, connection) {
      //We have a user and pass from authorization header
      var qstr = "SELECT * FROM users WHERE username = ? AND password = ?;";
      var query = connection.query(qstr, [user, pass], function(err, data) {
       if (err) {
          res.status(400).json({
            message: "Bad request."
          });
        } else if (data[0].is_active == 0 && data[0].is_admin == 1){
          res.status(400).json({
            message: "You are inactive admin and you can't update anything."
          });
        } else if (data[0].is_active == 0 && data[0].is_admin == 0){
          res.status(400).json({
            message: "You are inactive user and you can't update anything."
          });
        } 
        else if (data < 1) {
          res.status(404).json({
            message: "Wrong username or password."
          });
        } else if (data[0].is_admin) {
          console.log(data_input);
          var target_task_id = req.query.task_id;
          var qstr = `SELECT t.task_id, t.task_in_list, t.task_title, t.task_desc, t.task_status, l.list_id, l.list_owner_user_id ` +
          `FROM tasks t ` +
          `INNER JOIN lists l ON t.task_in_list = l.list_id ` +
          `WHERE t.task_id = ${target_task_id};`;
          var query = connection.query(qstr, function(err, updTask) {
            if (err) {
              res.status(400).json({
                message: "Bad request. Endpoint must contain parameter for task_id"
              });
            }
            else {
            console.log("asdasdasdasdasdas");
            var qstr = "UPDATE tasks SET ? WHERE task_id = ?;";
              var query = connection.query(qstr, [data_input, target_task_id], function(err, rows) {
                console.log("sadpaskdpoasdkpos");
                if (err) {
                  console.log("NAAAAAAAAAAAAAAAAAAAAAAAAA!!!!! ERROR!!!!!!");
                  console.log(err.code + "\n" + err.sqlMessage);
                  res.status(400).json({
                    message: err.sqlMessage
                  });
                } else {
                  var qstr = `SELECT t.task_id, t.task_in_list, t.task_title, t.task_desc, t.task_status, l.list_id, l.list_owner_user_id ` +
                      `FROM tasks t ` +
                      `INNER JOIN lists l ON t.task_in_list = l.list_id ` +
                      `WHERE t.task_id = ${target_task_id};`;
                  var query = connection.query(qstr, target_task_id, function(err, updTask) {

                    console.log(updTask[0]);
                    if (err) {
                      res.status(400).json({
                        message: "Bad request."
                      });
                    } 
                    else {
                      if (updTask[0] === undefined){
                        console.log("Task with ID:" + target_task_id + " is eighter not in a list or there is no such task in the Database");
                        res.status(400).json({
                          message: "Task with ID:" + target_task_id + " is eighter not in a list or there is no such task in the Database"
                        });
                     } else if (input.task_status === "Finished" || input.task_status === "Not Started" || input.task_status === "In Progress" || input.task_status === undefined) {
                        console.log("ALL DONE!!!! ^_^   ^_^   ^_^");
                        res.status(200).json({
                          message: "Task with task_title: " + updTask[0].task_title + " ,task_description: " +  updTask[0].task_desc + " and task_status: " + updTask[0].task_status + " of list " + updTask[0].list_id + " is sucessfully updated."
                        });
                     }
                    else {
                        console.log("There is no task with such ID");
                        res.status(200).json({
                        message:"There is no task with such ID"
                        });
                      }
                    }
                  });
                }
              });
             }
          });
        } else if (!data[0].is_admin) {
          console.log(data_input);
          var target_task_id = req.query.task_id;
          var qstr = `SELECT t.task_id, t.task_in_list, t.task_title, t.task_desc, t.task_status, l.list_id, l.list_owner_user_id ` +
          `FROM tasks t ` +
          `INNER JOIN lists l ON t.task_in_list = l.list_id ` +
          `WHERE l.list_owner_user_id = ${data[0].user_id} ` +
          `AND t.task_id = ${target_task_id};`;
          var query = connection.query(qstr, function(err, updTask) {
            if (err) {
              res.status(400).json({
                message: "Bad request. Endpoint must contain parameter for task_id"
              });
            }
            else {
            var qstr = "UPDATE tasks SET ? WHERE task_id = ?;";
              var query = connection.query(qstr, [data_input, target_task_id], function(err, rows) {
                if (err) {
                  console.log("NAAAAAAAAAAAAAAAAAAAAAAAAA!!!!! ERROR!!!!!!");
                  console.log(err.code + "\n" + err.sqlMessage);
                  res.status(400).json({
                    message: err.sqlMessage
                  });
                } else {
                  var qstr = `SELECT t.task_id, t.task_in_list, t.task_title, t.task_desc, t.task_status, l.list_id, l.list_owner_user_id ` +
                      `FROM tasks t ` +
                      `INNER JOIN lists l ON t.task_in_list = l.list_id ` +
                      `WHERE l.list_owner_user_id = ${data[0].user_id} ` +
                      `AND t.task_id = ${target_task_id};`;
                  var query = connection.query(qstr, target_task_id, function(err, updTask) {

                    console.log(updTask[0]);
                    if (err) {
                      res.status(400).json({
                        message: "Bad request."
                      });
                    } 
                    else {
                      if (updTask[0] === undefined){
                        console.log("Task with ID:" + target_task_id + " doesn't belong to this user");
                        res.status(400).json({
                          message: "Task with ID:" + target_task_id + " doesn't belong to this user"
                        });
                      } else if (input.task_status === 'Finished' || input.task_status === 'Not Started' || input.task_status === 'In Progress' || input.task_status === undefined) {
                        console.log("ALL DONE!!!! ^_^   ^_^   ^_^");
                        res.status(200).json({
                          message: "Task with task_title: " + updTask[0].task_title + " ,task_description: " +  updTask[0].task_desc + " and task_status: " + updTask[0].task_status + " of list " + updTask[0].list_id + " is sucessfully updated."
                        });
                        } else {
                        console.log("There is no task with such ID");
                        res.status(200).json({
                        message:"There is no task with such ID"
                        });
                      }
                    }
                  });
                }
              }
            );
          }
          });
        }      
      });
    });
  }
   else {
    console.log("Unauthorized users can't update user information");
    res.status(401).json({
      message: "Unauthorized users can't update user information"
    });
  }
}
