exports.list = function(req, res){

  req.getConnection(function(err,connection){
    var query = connection.query('SELECT * FROM users',function(err,rows)
    {
      if(err)
        console.log("Error Selecting : %s ",err );

      res.send(rows);
    });
  });
};

exports.save = function(req,res){

    var input = JSON.parse(JSON.stringify(req.body));

    req.getConnection(function (err, connection) {
        var data = {
            first_name  : input.first_name,
            surname     : input.surname,
            username    : input.username,
            mail        : input.mail,
            password    : input.password,
            is_active   : input.is_active,
            is_admin    : input.is_admin
        };

        var query = connection.query("INSERT INTO users set ? ",data, function(err, rows)
        {
          if (err){
            console.log(err.code + '\n' +  err.sqlMessage);
            res.status(400).json({
              message: err
            });}
          else{
            var query = connection.query('SELECT user_id FROM users WHERE username = ?',input.username,function(err,user_id)
            {
              res.status(200).json(user_id[0]);
            });
          };
        });
    });
};
