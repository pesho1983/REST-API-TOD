exports.listAll = function (req, res) {
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
                } else if (!data[0].is_admin) {
                    res.status(401).json({
                        message: "Insufficient rights for that action. Please contact administrator."
                    });
                } else if (data[0].is_admin) {
                    var querySelectParams = " list_id, list_title, list_description, list_owner_user_id, list_is_active";
                    if (typeof req.query.status === 'undefined') {
                        qstr =
                            "SELECT " +
                            querySelectParams +
                            " FROM lists;";
                    } else if (req.query.status === 'active') {
                        qstr =
                            "SELECT " +
                            querySelectParams +
                            " FROM lists WHERE list_is_active = 1;";
                    } else if (req.query.status === 'inactive') {
                        qstr =
                            "SELECT " +
                            querySelectParams +
                            " FROM lists WHERE list_is_active = 0;";
                    }
                    req.getConnection(function (err, connection) {
                        var query = connection.query(qstr, function (err, rows) {
                            console.log(`QUERY is: ${qstr}`);
                            if (err) {
                                res.status(400).json({
                                    message: err.sqlMessage
                                });
                            }
                            res.send(rows);
                        });
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
