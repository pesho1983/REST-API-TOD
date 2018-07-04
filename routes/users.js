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

  var input = JSON.parse(JSON.stringify(req.body));

  req.getConnection(function(err, connection) {
    var data = {
      first_name: input.first_name,
      surname: input.surname,
      username: input.username,
      mail: input.mail,
      password: input.password,
      is_active: input.is_active,
      is_admin: input.is_admin
    };
    console.log(data);
    var query = connection.query("INSERT INTO users set ? ", data, function(err, rows) {
      if (err) {
        console.log(err.code + '\n' + err.sqlMessage);
        res.status(400).json({
          message: err.sqlMessage
        });
      } else {
        var query = connection.query('SELECT user_id FROM users WHERE username = ?', input.username, function(err, user_id) {
          res.status(200).json(user_id[0]);
        });
      };
    });
  });
};

exports.newSave = function(req, res) {

  var user, pass = null;

  if (req.headers.authorization) {
    var auth = req.headers.authorization.split(" ")[1];
    var creds = Buffer.from(auth, 'base64').toString("utf-8");
    var user = creds.split(":")[0];
    var pass = creds.split(":")[1];
    console.log(`Auth header data: ${user} ${pass}`);
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

  req.getConnection(function(err, connection) {
    console.log(data_input)
    if (user !== null && pass !== null) {
      //We have a user and pass
      var query = connection.query("SELECT is_active, is_admin FROM users WHERE username = ? AND password = ?;", [user, pass], function(err, data) {
        if (err) {
          res.status(400).json({
            message: "Bad request"
          })
        }
        if (data < 1) {
          res.status(404).json({
            message: "Wrong username or password!"
          })
        }
        if (!data[0].is_admin || !data[0].is_active) {
          res.status(401).json({
            message: "No permissions!"
          })
        }
        if (data[0].is_admin && data[0].is_active) {
          data_input.is_admin = input.is_admin
        }
        var query = connection.query("INSERT INTO users set ?;", data_input, function(err, rows) {
          if (err) {
            console.log(err.code + '\n' + err.sqlMessage);
            res.status(400).json({
              message: err.sqlMessage
            });
          } else {
            console.log(query.sql);
            res.status(200).json({
              message: "OK"
            });
          }
        })
      });
    }
  });
};
