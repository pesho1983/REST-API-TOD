exports.list = function(req, res) {

  req.getConnection(function(err, connection) {
    var query = connection.query('SELECT * FROM tasks', function(err, rows) {
      if (err)
        console.log("Error Selecting : %s ", err);

      res.send(rows);
    });
  });
};

// exports.save = function(req, res) {
//
//   var input = JSON.parse(JSON.stringify(req.body));
//
//   req.getConnection(function(err, connection) {
//     var data = {
//       title: input.title,
//       text: input.description,
//       owner_user_id: input.owner_user_id
//     };
//
//     var query = connection.query("INSERT INTO tasks set ? ", data, function(err, rows) {
//       if (err) {
//         console.log(err.code + '\n' + err.sqlMessage);
//         res.status(400).json({
//           message: err.sqlMessage
//         });
//       } else {
//         var query = connection.query('SELECT task_id FROM tasks WHERE title = ?', input.title, function(err, title_id) {
//           res.status(200).json(list_id[0]);
//         });
//       };
//     });
//   });
// };
