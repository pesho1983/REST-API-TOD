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
  var validationError = false;
  var target_task_id;
  if (typeof req.query.task_id === `undefined` || req.query.task_id.length == 0 ){
    validationError = true;
    } else{
      target_task_id = parseInt(req.query.task_id, 10);
    }

  validationError = isNaN(target_task_id);

  if (validationError) {
    res.status(409).json({
      message: `Invalid task_id value!`
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
            // TO DO
            console.log('WIP')
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
