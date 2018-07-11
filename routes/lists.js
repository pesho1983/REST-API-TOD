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

  var data_input = {
    list_title: input.list_title,
    list_description: input.list_description,
    list_owner_user_id: 0
  };

  var validationError = false;
  if (input.list_title.length < 1) {
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
            data_input.list_owner_user_id = data[0].user_id;
            console.log(data_input);
            var qstr = "INSERT INTO lists set ?;"
            var query = connection.query(qstr, data_input, function(err, rows) {
              if (err) {
                console.log(err.code + '\n' + err.sqlMessage);
                res.status(400).json({
                  message: err.sqlMessage
                });
              } else {
                console.log(rows.insertId);
                var qstr = "SELECT * FROM lists WHERE list_id = ?;"
                var query = connection.query(qstr, rows.insertId, function(err, result) {
                  if (err) {
                    res.status(400).json({
                      message: "Bad request."
                    })
                  } else {
                    res.status(200).json(result);
                  }
                });
              };
            });
          }
        })
      });
    } else {
      res.status(401).json({
        message: "Authorization required."
      })
    }
  }
};

exports.list = function(req, res) {

  var userAuth = false;

  if (req.headers.authorization) {
    var auth = req.headers.authorization.split(" ")[1];
    var creds = Buffer.from(auth, 'base64').toString("utf-8");
    var user = creds.split(":")[0];
    var pass = creds.split(":")[1];
    userAuth = true;
    console.log(`\nAuth header data: ${user} ${pass}\n`);
  }
  var queryWhereParams = 0;
  if (userAuth) {
    req.getConnection(function(err, connection) {
      //We have a user and pass from authorization header
      var qstr = "SELECT * FROM users WHERE username = ? AND password = ?;"
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
          var querySelectParams = " list_id, list_title"
          queryWhereParams = data[0].user_id + ' AND list_is_active = 1'
          if (data[0].is_admin && typeof req.query.user_id !== 'undefined') {
            queryWhereParams = req.query.user_id;
            querySelectParams += ", list_is_active"
          }
          qstr = "SELECT" + querySelectParams + " FROM lists WHERE list_owner_user_id = " + queryWhereParams + ";"
          req.getConnection(function(err, connection) {
            var query = connection.query(qstr, function(err, rows) {
              console.log(`QUERY is: ${qstr}`);
              if (err){
                res.status(400).json({
                message: err.sqlMessage
                })
              }
              res.send(rows);
            });
          });
        };
      });
    });
  } else {
    res.status(401).json({
      message: "Authorization required."
    })
  }
};
