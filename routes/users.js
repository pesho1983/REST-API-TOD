exports.list = function(req, res) {

  req.getConnection(function(err, connection) {
    var query = connection.query('SELECT * FROM users', function(err, rows) {
      if (err)
        console.log("Error Selecting : %s ", err);
        res.send(err);
      res.send(rows);
    });
  });
};

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
  // console.log(req.headers);

  var input = JSON.parse(JSON.stringify(req.body));

  var data_input = {
    first_name: input.first_name,
    surname: input.surname,
    username: input.username,
    mail: input.mail,
    password: input.password,
    is_admin: 0
  };
  console.log(req.body);

  var validationError = false;
  if (input.username.length < 3 || input.username.length > 12) {
    validationError = true;
  }
  if (input.password.length < 8 || input.password.length > 24) {
    validationError = true;
  }
  // console.log(`Validation error: ${validationError}`);

  if (validationError) {
    res.status(409).json({
      message: "Invalid data."
    })
  } else {
    if (userAuth) {
      req.getConnection(function(err, connection) {
        //We have a user and pass from authorization header
        var qstr = "SELECT is_active, is_admin FROM users WHERE username = ? AND password = ?;"
        var query = connection.query(qstr, [user, pass], function(err, data) {
          if (err) {
            res.status(400).json({
              message: "Bad request."
            })
          } else if (data < 1) {
            res.status(404).json({
              message: "Wrong username or password."
            })
          } else if (!data[0].is_admin || !data[0].is_active) {
            res.status(401).json({
              message: "No permissions!"
            })
          }
          if (data[0].is_admin && data[0].is_active) {
            data_input.is_admin = input.is_admin;
            var qstr = "INSERT INTO users set ?;"
            var query = connection.query(qstr, data_input, function(err, rows) {
              if (err) {
                res.status(400).json({
                  message: err.sqlMessage
                });
              } else {
                res.status(200).json({
                  id: rows.insertId
                });
              }
            })
          }
        })
      });
    } else {
      req.getConnection(function(err, connection) {
        var qstr = "INSERT INTO users set ?;"
        var query = connection.query(qstr, data_input, function(err, rows) {
          if (err) {
            res.status(400).json({
              message: err.sqlMessage
            });
          } else {
            res.status(200).json({
              id: rows.insertId
            });
          }
        })
      });
    }
  }
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
    first_name: input.first_name,
    surname: input.surname,
    username: input.username,
    mail: input.mail
  };

  var validationError = false;
  console.log(data_input)
  for (var key in data_input) {
    if (typeof data_input[key] === `undefined`) {
      delete data_input[key];
    }

    if (input.username !== undefined){
    if (input.username.length < 3 || input.username.length > 12) {
      res.status(409).json({
        message:
          "Invalid data. Check input data and have in mind that username must be between 3 and 12"
      });
    }
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

        } else if (data < 1) {
          res.status(404).json({
            message: "Wrong username or password."
          });
        } else if (data[0].is_admin) {
          console.log(data_input);
          var user_id = req.query.user_id;
          var qstr = "SELECT * FROM users WHERE user_id = ?";
          var query = connection.query(qstr, user_id, function(err, updUsr) {
            if (err) {
              res.status(400).json({
                message: "Bad request. Endpoint must contain parameter for user_id"
              });
            } else {
            var oldUsername = updUsr[0].username;
            var qstr = "UPDATE users SET ? WHERE user_id = ?;";
              var query = connection.query(qstr, [data_input, user_id], function(err, rows) {
                if (err) {
                  console.log("NAAAAAAAAAAAAAAAAAAAAAAAAA!!!!! ERROR!!!!!!");
                  console.log(err.code + "\n" + err.sqlMessage);
                  res.status(400).json({
                    message: err.sqlMessage
                  });
                } else {
                  //console.log(rows.insertId);
                  var qstr = "SELECT * FROM users WHERE user_id = ?;";
                  var query = connection.query(qstr, user_id, function(err, result) {
                    if (err) {
                      res.status(400).json({
                        message: "Bad request."
                      });
                    } else {
                      res.status(200).json({
                        message:"Account with ID: " + user_id + " and username: " + oldUsername +" is updated sucessfully."
                      });
                    }
                  });
                }
              }
            );
          }
          });
        } else if (!data[0].is_admin) {
          var user_id = req.query.user_id;
          if (user_id == undefined) {
            user_id = data[0].user_id;
            var qstr = "UPDATE users SET ? WHERE username = ?;";
            var query = connection.query(qstr,[data_input, user], function(err, rows) {
                if (err) {
                  console.log("NAAAAAAAAAAAAAAAAAAAAAAAAA!!!!! ERROR!!!!!!");
                  console.log(err.code + "\n" + err.sqlMessage);
                  res.status(400).json({
                    message: err.sqlMessage
                  });
                } else {
                  //console.log(rows.insertId);
                  var qstr = "SELECT * FROM users WHERE user_id = ?;";
                  var query = connection.query(qstr, rows.insertId, function(
                    err,
                    result
                  ) {
                    if (err) {
                      res.status(400).json({
                        message: "Bad request."
                      });
                    } else {
                      console.log("ALL DONE!!!! ^_^   ^_^   ^_^");
                      res.status(200).json({
                        message:"Account with ID: " + data[0].user_id + " and username: " + user + " is updated sucessfully."
                      });
                    }
                  });
                }
              }
            );
          } else {
            console.log("No permissions to updata other users.");
            res.status(402).json({
              message:
                "User can update only his own user information via localhost:[port]/users endpoint"
            });
          }
        }
      });
    });
  } else {
    console.log("Unauthorized users can't update user information");
    res.status(401).json({
      message: "Unauthorized users can't update user information"
    });
  }
};
