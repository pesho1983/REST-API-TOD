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
  var userListExists = false;

  if (req.headers.authorization) {
    var auth = req.headers.authorization.split(" ")[1];
    var creds = Buffer.from(auth, 'base64').toString("utf-8");
    var user = creds.split(":")[0];
    var pass = creds.split(":")[1];
    userAuth = true;
    console.log(`\nAuth header data: ${user} ${pass}\n`);
  }

  var input = JSON.parse(JSON.stringify(req.body));

  var data_input = {
    task_title: input.task_title,
    task_desc: input.task_desc,
    task_status: input.task_status,
    task_in_list: input.task_in_list
  };
  // console.log(data_input)
  var dict = {};
  // console.log(input);

  for (var key in input) {
    console.log(key);
    if (key === "task_title" || key === "task_desc" || key === "task_status" || key === "task_in_list") {
      // console.log(input[key]);
      dict.key = input[key];
    }
  }

  console.log(dict)


  var validationError = false;
  if (input.task_title.length < 1 || input.task_in_list.length < 1) {
    validationError = true;
  }

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
            console.log(data[0].user_id);
            var qstr = "SELECT * FROM lists WHERE list_owner_user_id = ? AND list_id = ?;";
            var query = connection.query(qstr, [data[0].user_id, input.task_in_list], function(err, rows) {
              if (rows[0].list_is_active) {
                userListExists = true;
                console.log(`INSERT INTO task......`);
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
                  message: "List does not exist."
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
