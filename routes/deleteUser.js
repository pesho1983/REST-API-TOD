exports.softDelete = function(req, res) {
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
  switch (t_column){
    case 'user_id':
      validationError = isNaN(t_value);
      errMsg = `User_id has to be a number.`;
      break;
    case 'username':
      if(t_value.length < 3 || t_value.length > 12){
        validationError = true;
        errMsg = `Username's length is out of range [3:12].`
      }
      break;
    case 'mail':
      if(!validateEmail(t_value)){
        validationError = true
        errMsg = `Wrong mail format`
      }
      break;
    default:
      validationError = true
      errMsg = `User_id, username or mail needed.`
  }

  if (validationError) {
    res.status(409).json({
      message : errMsg
    })

  } else {
    if (userAuth) {
      req.getConnection(function(err, connection) {
        var qstr = "SELECT * FROM users WHERE username = ? AND password = ?;";
        var query = connection.query(qstr, [user, pass], function(err, data) {
          // console.log(`qstr = ${qstr}`)
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
          } else if (!data[0].is_admin){
            res.status(403).json({
              message: "You don't have permissions to delete users."
            });
          } else if (data[0][t_column] == t_value){
            res.status(409).json({
              message: "Action denied! Self-destruct is against the basic humanity! Go reproduce you self"
            });
          } else{
            var qstr2 = "UPDATE users SET is_active = 0 WHERE " + t_column + " = \'" + t_value + "\';";
            var query = connection.query(qstr2, function(err,rows){
              // console.log(`qstr2 = ${qstr2}`)
              if (err) {
                res.status(400).json({
                  message: err.sqlMessage
                });
              }
              else if (rows.changedRows === 0) {
                res.status(200).json({
                  message: 'No records changed.'
                });
              } else {
                var qstr3 = "SELECT * FROM users WHERE " + t_column + " = \'" + t_value + "\';";
                var query = connection.query(qstr3, function(err,result){
                // console.log(`qstr3 = ${qstr3}`)
                  if (err) {
                    res.status(400).json({
                      message: err
                    });
                  } else {
                    msg = "User " + result[0].user_id + " with username \'" + result[0].username + "\' is successfully deleted."
                    res.status(200).json({
                      message: msg
                    });
                  }
                })
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

function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}
