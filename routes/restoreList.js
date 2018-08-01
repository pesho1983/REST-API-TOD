exports.restore = function(req, res) {
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
  var target_list_id;
  if (typeof req.query.list_id === `undefined` || req.query.list_id.length == 0) {
    validationError = true;
  } else {
    target_list_id = parseInt(req.query.list_id, 10);
  }

  validationError = isNaN(target_list_id);

  if (validationError) {
    res.status(409).json({
      message: `Invalid list_id value!`
    })
  } else {
    if (userAuth) {
      // console.log(`target_list_id = ${target_list_id}`)
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
            var qstr2 = `SELECT * FROM lists WHERE list_id = ${target_list_id}`
            var query = connection.query(qstr2, function(err, listData) {
              if (err) {
                res.status(400).json({
                  message: "Bad request."
                });
              } else if (listData[0].list_is_active) {
                var errMsg = "The list is active. Action denied!"
                res.status(409).json({
                  message: errMsg
                });
              } else if (listData[0].list_owner_user_id !== data[0].user_id && !data[0].is_admin){
                var errMsg = "You don't own this list. Action denied!"
                res.status(403).json({
                  message: errMsg
                });
              } else {
                var qstr3 = `UPDATE lists SET list_is_active = 1 WHERE list_id = ${target_list_id}`
                var query = connection.query(qstr3, function(err, result) {
                  if (err) {
                    res.status(400).json({
                      message: "Bad request."
                    });
                  } else {
                    var qstr4 = `UPDATE tasks SET task_is_active = 1 WHERE task_in_list = ${target_list_id}`;
                    var query = connection.query(qstr4, function(err, result) {
                      if (err) {
                        res.status(400).json({
                          message: "Bad request."
                        });
                      } else {
                        var msg = "List " + listData[0].list_id + " \'" + listData[0].list_title + "\' and tasks are successfully restored."
                        res.status(200).json({
                          message: msg
                        });
                      }
                    });
                  }
                });
              }
            })
          }
        })
      })
    } else {
      res.status(401).json({
        message: "Authorization required."
      });
    }
  }
};
