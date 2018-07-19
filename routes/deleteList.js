exports.delete = function (req, res) {
    var userAuth = false;

    if (req.headers.authorization) {
        var auth = req.headers.authorization.split(" ")[1];
        var creds = Buffer.from(auth, "base64").toString("utf-8");
        var user = creds.split(":")[0];
        var pass = creds.split(":")[1];
        userAuth = true;
        console.log(`\nAuth header data: ${user} ${pass}\n`);
    }
    if (userAuth) {
        req.getConnection(function (err, connection) {
            var qstrList;
            var qstrTask;
            var qstr = "SELECT * FROM users WHERE username = ? AND password = ?;";
            var query = connection.query(qstr, [user, pass], function (err, data) {
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

                    var queryUpdateParams = 0;
                    var querySetParams = 0;
                    var queryWhereParams = 0;

                    if (data[0].is_admin && typeof req.query.list_id !== 'undefined') {
                        queryWhereParams = req.query.list_id;
                        var qstr = "SELECT 1 FROM lists WHERE list_id = " + req.query.list_id + ";";
                    }
                    if (!data[0].is_admin && typeof req.query.list_id !== 'undefined') {
                        queryWhereParams = req.query.list_id + " AND lists.list_owner_user_id = " + data[0].user_id;
                        var qstr = "SELECT 1 FROM lists WHERE list_owner_user_id = " + data[0].user_id + " AND list_id = " + req.query.list_id + ";";
                    }

                    queryUpdateParams = "lists";
                    querySetParams = "lists.list_is_active = 0";

                    qstrList =
                        "UPDATE " +
                        queryUpdateParams +
                        " SET " +
                        querySetParams +
                        " WHERE lists.list_id = " +
                        queryWhereParams +
                        ";";

                    queryUpdateParams = "tasks, lists";
                    querySetParams = "tasks.task_is_active = 0";

                    qstrTask =
                        "UPDATE " +
                        queryUpdateParams +
                        " SET " +
                        querySetParams +
                        " WHERE tasks.task_in_list = " +
                        queryWhereParams +
                        ";";

                    var query = connection.query(qstr, function (err, result) {
                        if (result.length === 1) {
                            req.getConnection(function (err, connection) {
                                var query = connection.query(qstrTask, function (err, rows2) {
                                    console.log(`QUERY is: ${qstrTask}`);
                                    if (err) {
                                        res.status(400).json({
                                            message: err.sqlMessage
                                        });
                                    } else {
                                        var query = connection.query(qstrList, function (err, rows) {
                                            console.log(`QUERY is: ${qstrList}`);
                                            if (err) {
                                                res.status(400).json({
                                                    message: err.sqlMessage
                                                });
                                            }
                                            var msg;
                                            if (rows.changedRows === 0) {
                                                msg = 'No records changed.'
                                                res.status(200).json({
                                                    message: msg
                                                });
                                            }
                                            else {
                                                msg = "List " + req.query.list_id + " is successfully deleted."
                                                res.status(200).json({
                                                    message: msg
                                                });
                                            }
                                        });
                                    }
                                });
                            });
                        }
                        else {
                            res.status(404).json({
                                message: `You do not own list with id ${req.query.list_id}`
                            });
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
    ;
}
