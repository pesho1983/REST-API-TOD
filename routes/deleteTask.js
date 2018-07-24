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
  if (typeof req.query.task_id === `undefined` || req.query.task_id.length == 0) {
    validationError = true;
  } else {
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
            var selectQuery = ''
            if (data[0].is_admin) {
              selectQuery =
                `SELECT t.task_id, t.task_title, l.list_id, l.list_title ` +
                `FROM tasks t INNER JOIN lists l ON t.task_in_list = l.list_id ` +
                `WHERE t.task_id = ${target_task_id};`
            }
            if (!data[0].is_admin) {
              selectQuery =
                `SELECT t.task_id, t.task_title, l.list_id, l.list_title ` +
                `FROM tasks t ` +
                `INNER JOIN lists l ON t.task_in_list = l.list_id ` +
                `INNER JOIN lists_assignments_to_users latu ON latu.list_id = l.list_id ` +
                `WHERE latu.user_id IS NULL ` +
                `AND l.list_owner_user_id = ${data[0].user_id} ` +
                `AND t.task_id = ${target_task_id};`
            }
            console.log(`selectQuery: ${selectQuery}`)
            var query = connection.query(selectQuery, function(err, selectData) {
              if (err) {
                res.status(400).json({
                  message: err
                });
              } else if (selectData.length === 0) {
                res.status(404).json({
                  message: `Task ${target_task_id} does not exist!`
                });
              } else {
                var updateQuery = `UPDATE tasks SET task_is_active = 0 WHERE task_id = ?;`
                var query = connection.query(updateQuery, target_task_id, function(err, updateData) {
                  if (err) {
                    res.status(400).json({
                      message: err
                    });
                  } else {
                    var msg = `Task ${selectData[0].task_id} \'${selectData[0].task_title}\' in list ${selectData[0].list_id} \'${selectData[0].list_title}\' is successfully deleted.`;
                    if (updateData.changedRows === 0) {
                      msg = `Task ${target_task_id} was already deleted!`;
                    }
                    res.status(200).json({
                      message: msg
                    });
                  }
                })
              }
            })
          }
        })
      });
    } else {
      res.status(401).json({
        message: "Authorization required."
      });
    }
  }
};
