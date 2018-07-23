exports.listTask = function(req, res) {
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
  if (typeof req.query.task_in_list === `undefined` || req.query.task_in_list.length == 0 ){
    validationError = true;
    } else{
      target_list_id = parseInt(req.query.task_in_list, 10);
    }

  validationError = isNaN(target_list_id);

  if (validationError) {
    res.status(409).json({
      message: `Invalid task_in_list value!`
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
            console.log(`AUTH SUCCESS!: user: ${data[0].username} | admin: ${data[0].is_admin}\n`);
            if(data[0].is_admin){
              selectQuery =
                `SELECT * FROM lists WHERE list_id = ${target_list_id};`
            }
            if(!data[0].is_admin){
              selectQuery =
                `SELECT * FROM lists WHERE list_id = ${target_list_id} AND list_owner_user_id = ${data[0].user_id};`
            }
            console.log(`selectQuery: ${selectQuery}`)
            var query = connection.query(selectQuery, function(err, selectData) {
              console.log(selectData)
              if(selectData.length === 0){
                res.status(404).json({
                    message: `List ${target_list_id} does not exist!`
                });
              }
              else if(selectData[0].list_is_active === 0 && !data[0].is_admin){
                res.status(404).json({
                    message: `List ${selectData[0].list_id} \'${selectData[0].list_title}\' does not exist any more!`
                });
              }
              else{
                var selectTasksQuery = `SELECT * FROM tasks WHERE task_in_list = ${selectData[0].list_id}`
                if (!data[0].is_admin){
                  selectTasksQuery += ` AND task_is_active = 0;`
                }
                console.log(`selectTasksQuery: ${selectTasksQuery}`)
                var query = connection.query(selectTasksQuery, function(err, selectedTasks){
                  if (err) {
                    res.status(400).json({
                      message: err.sqlMessage
                    });
                  }
                  else{
                    console.log(selectedTasks)
                    var msg = "The tasks in " + target_list_id + " \'" + selectData[0].list_title +"\' are: "
                    res.status(200).json({
                      message: msg,
                      data : selectedTasks
                    })
                  }
                })
              }
            });
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
