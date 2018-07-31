exports.search = function(req, res) {
  var userAuth = false;

  if (req.headers.authorization) {
    var auth = req.headers.authorization.split(" ")[1];
    var creds = Buffer.from(auth, "base64").toString("utf-8");
    var user = creds.split(":")[0];
    var pass = creds.split(":")[1];
    userAuth = true;
    console.log(`\nAuth header data: ${user} ${pass}\n`);
  }

  var urlData = req.originalUrl
  var target = urlData.split('=')
  t_column = target[0].split('?')[1]
  t_value = target[1]

  var validationError = false;
  var errMsg = ''
  switch (t_column) {
    case 'user_id':
      validationError = isNaN(t_value);
      errMsg = `User_id has to be a number.`;
      break;
    case 'username':
    case 'first_name':
    case 'username':
    case 'mail':
      if (t_value.length < 3) {
        validationError = true;
        errMsg = `Please provide atleast 3 characters otherwise you may get a lot of results.`
      }
      break;
    default:
      validationError = true
      errMsg = `User_id, username, first_name, surname or mail needed.`
  }

  if (validationError) {
    res.status(409).json({
      message: errMsg
    })

  } else {
    if (userAuth) {
      req.getConnection(function(err, connection) {
        var qstr = "SELECT * FROM users WHERE username = ? AND password = ?;";
        var query = connection.query(qstr, [user, pass], function(err, data) {
          if (err) {
            res.status(400).json({
              message: "Bad request."
            });
          } else if (data < 1) {
            res.status(404).json({
              message: "Wrong username or password."
            });
          } else if (!data[0].is_active) {
            res.status(401).json({
              message: "Account disabled."
            });
          } else {
            var qstr2 = `SELECT username, first_name, surname, mail FROM users WHERE ${t_column} LIKE \'%${t_value}%\';`;
            var query = connection.query(qstr2, function(err, result) {
              if (err) {
                res.status(400).json({
                  message: err
                });
              } else if (result.length == 0) {
                res.status(200).json({
                  message: `User with ${t_column} \'${t_value}\' is non-existing.`
                });
              } else {
                var msg = `Found ${result.length} record(s) matching your criteria: ${t_column} \'${t_value}\'`
                res.status(200).json({
                  message: msg,
                  data: result
                });
              }
            })
          }
        });
      });
    } else {
      res.status(401).json({
        message: "Authorization required."
      });
    }
  }
};
