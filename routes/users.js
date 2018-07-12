exports.list = function(req, res) {

  req.getConnection(function(err, connection) {
    var query = connection.query('SELECT * FROM users', function(err, rows) {
      if (err)
        console.log("Error Selecting : %s ", err);
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

  var input = JSON.parse(JSON.stringify(req.body));

  var data_input = {
    first_name: input.first_name,
    surname: input.surname,
    username: input.username,
    mail: input.mail,
    password: input.password,
    is_admin: 0
  };

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
