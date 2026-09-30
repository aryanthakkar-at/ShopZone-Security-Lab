const express = require("express");
const path = require("path");
const session = require("express-session");
//LAB 2const cookieParser = require("cookie-parser");

const app = express();
const PORT = 3000;

// --------------------------------------------------
// LAB 01 - BROKEN ACCESS CONTROL
// --------------------------------------------------

// Fake accounts for this local security lab only.
// These are NOT real passwords.
const users = [
    {
        username: "admin",
        password: "admin123",
        role: "admin"
    },
    {
        username: "daniel",
        password: "daniel123",
        role: "user"
    },
    {
        username: "pauline",
        password: "pauline123",
        role: "user"
    }
];

// Serve files from the public folder
app.use(express.static(path.join(__dirname, "public")));

// Read form data
app.use(express.urlencoded({ extended: true }));
// LAB2 - app.use(cookieParser());

// Login session
app.use(
    session({
        secret: "shopzone-local-lab-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax"
        }
    })
);


// --------------------------------------------------
// LOGIN
// --------------------------------------------------

// Show login page
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});


// Process login
app.post("/login", (req, res) => {

    const { username, password } = req.body;

    const user = users.find(
        (account) =>
            account.username === username &&
            account.password === password
    );

    if (!user) {
        return res.status(401).send(`
            <html>
            <head>
                <title>Login Failed</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background: #f7f7f7;
                        text-align: center;
                        padding: 80px;
                    }

                    .box {
                        background: white;
                        max-width: 500px;
                        margin: auto;
                        padding: 40px;
                        border: 1px solid #ddd;
                    }

                    a {
                        color: #222;
                    }
                </style>
            </head>

            <body>
                <div class="box">
                    <h1>Login Failed</h1>
                    <p>Invalid username or password.</p>
                    <br>
                    <a href="/login">Try Again</a>
                </div>
            </body>
            </html>
        `);
    }

    // Store logged-in user in the session
    req.session.user = {
    username: user.username,
    role: user.role
};

// LAB 02 - VULNERABLE
// The server tells the browser whether the user is an admin.
// This value can be modified by the user.
// res.cookie("Admin", user.role === "admin" ? "true" : "false");

res.redirect("/dashboard");

});

// --------------------------------------------------
// LOGIN PROTECTION
// --------------------------------------------------

function requireLogin(req, res, next) {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    next();
}


// --------------------------------------------------
// DASHBOARD
// --------------------------------------------------

app.get("/dashboard", requireLogin, (req, res) => {

    const user = req.session.user;

    res.send(`
        <html>

        <head>
            <title>ShopZone Dashboard</title>

            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: #f7f7f7;
                    margin: 0;
                    padding: 0;
                }

                .navbar {
                    background: white;
                    padding: 20px 8%;
                    border-bottom: 1px solid #ddd;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .logo {
                    font-size: 24px;
                    font-weight: bold;
                }

                .navbar a {
                    text-decoration: none;
                    color: #222;
                    margin-left: 20px;
                }

                .container {
                    max-width: 800px;
                    margin: 60px auto;
                    background: white;
                    padding: 40px;
                    border: 1px solid #ddd;
                }

                .role {
                    display: inline-block;
                    padding: 8px 14px;
                    background: #eee;
                    border-radius: 5px;
                    margin-top: 10px;
                }

                .admin-link {
                    margin-top: 30px;
                    padding: 20px;
                    background: #fff3cd;
                    border: 1px solid #ffeeba;
                }

                .admin-link a {
                    color: #222;
                    font-weight: bold;
                }
            </style>
        </head>

        <body>

            <header class="navbar">
                <div class="logo">ShopZone</div>

                <nav>
                    <a href="/">Home</a>
                    <a href="/logout">Logout</a>
                </nav>
            </header>

            <div class="container">

                <h1>Welcome, ${user.username}!</h1>

                <p>You are successfully logged in.</p>

                <div class="role">
                    Role: ${user.role}
                </div>

                ${
                    user.role === "admin"
                    ? `
                        <div class="admin-link">
                            <p>You have administrator privileges.</p>
                            <a href="/admin">Open Admin Panel</a>
                        </div>
                    `
                    : `
                        <div class="admin-link">
                            <p>You are logged in as a normal user.</p>
                            <p>
                                The admin link is not displayed to normal users.
                            </p>
                        </div>
                    `
                }

            </div>

        </body>

        </html>
    `);
});


// --------------------------------------------------
// LAB 01 VULNERABLE ADMIN PANEL
// --------------------------------------------------

// IMPORTANT:
// There is intentionally NO role check here.
//
// A logged-in user only needs to be authenticated.
// The application does NOT check whether the user is an admin.
//
// This is the vulnerability we will exploit in Lab 01.
// Vulnerable admin panel code as it doesn't check for the role

app.get("/admin", requireLogin, (req, res) => {

    // LAB 02 - VULNERABLE
    //if (req.cookies.Admin !== "true") {
    //        return res.status(403).send("Access denied");
    //    }

    if (req.session.user.role !== "admin") {
        return res.status(403).send("Access denied");
    }

    // Admin page continues here

    res.send(`
        <html>

        <head>
            <title>ShopZone Admin Panel</title>

            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: #f7f7f7;
                    margin: 0;
                    padding: 0;
                }

                .navbar {
                    background: white;
                    padding: 20px 8%;
                    border-bottom: 1px solid #ddd;
                }

                .navbar a {
                    text-decoration: none;
                    color: #222;
                    margin-right: 20px;
                }

                .admin-panel {
                    max-width: 900px;
                    margin: 50px auto;
                    background: white;
                    padding: 40px;
                    border: 1px solid #ddd;
                }

                .warning {
                    padding: 15px;
                    background: #fff3cd;
                    border: 1px solid #ffeeba;
                    margin-bottom: 30px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }

                th,
                td {
                    padding: 15px;
                    border: 1px solid #ddd;
                    text-align: left;
                }

                th {
                    background: #f2f2f2;
                }

                .danger {
                    margin-top: 30px;
                    padding: 20px;
                    background: #f8d7da;
                    border: 1px solid #f5c2c7;
                }
            </style>
        </head>

        <body>

            <div class="navbar">
                <a href="/dashboard">Dashboard</a>
                <a href="/logout">Logout</a>
            </div>

            <div class="admin-panel">

                <h1>ShopZone Admin Panel</h1>

                <div class="warning">
                    <strong>LAB 01:</strong>
                    This page is intentionally vulnerable to broken access control.
                </div>

                <h2>User Accounts</h2>

                <p>
                    Sensitive account information is displayed below.
                </p>

                <table>

                    <tr>
                        <th>Username</th>
                        <th>Password</th>
                        <th>Role</th>
                    </tr>

                    <tr>
                        <td>admin</td>
                        <td>admin123</td>
                        <td>Admin</td>
                    </tr>

                    <tr>
                        <td>daniel</td>
                        <td>daniel123</td>
                        <td>User</td>
                    </tr>

                    <tr>
                        <td>pauline</td>
                        <td>pauline123</td>
                        <td>User</td>
                    </tr>

                </table>

                <div class="danger">
                    <strong>Security issue:</strong>

                    <p>
                        Any authenticated user can access this administrator
                        functionality because the server does not verify the
                        user's role.
                    </p>

                </div>

            </div>

        </body>

        </html>
    `);
});


// --------------------------------------------------
// LOGOUT
// --------------------------------------------------

app.get("/logout", (req, res) => {

    req.session.destroy(() => {
        res.redirect("/login");
    });

});


// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Website running on http://localhost:${PORT}`);
});