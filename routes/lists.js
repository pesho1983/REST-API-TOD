exports.list = function(req, res) {

  req.getConnection(function(err, connection) {
    var query = connection.query('SELECT * FROM lists', function(err, rows) {
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
      title: input.title,
      description: input.description,
      owner_user_id: input.owner_user_id
    };

    var query = connection.query("INSERT INTO lists set ? ", data, function(err, rows) {
      if (err) {
        console.log(err.code + '\n' + err.sqlMessage);
        res.status(400).json({
          message: err.sqlMessage
        });
      } else {
        var query = connection.query('SELECT list_id FROM lists WHERE title = ?', input.title, function(err, list_id) {
          res.status(200).json(list_id[0]);
        });
      };
    });
  });
};
