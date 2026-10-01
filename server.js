const express = require("express");
const path = require("path");
const session = require("express-session");

const app = express();
const PORT = 3000;


// Fake accounts for this local security lab only.
// These are NOT real passwords.
const users = [
    { username: "admin", password: "admin123", role: "admin", promoted: true },
    { username: "daniel", password: "daniel123", role: "user", promoted: false },
    { username: "pauline", password: "pauline123", role: "user", promoted: false }
];

// Serve files from the public folder
app.use(express.static(path.join(__dirname, "public")));

// Read form data
app.use(express.urlencoded({ extended: true }));

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
                    <a href="/account?username=${user.username}">My Account</a>
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


app.get("/account", requireLogin, (req, res) => {


    const username = req.session.user.username;

    const user = users.find(
        (account) => account.username === username
    );

    if (!user) {
        return res.status(404).send("User not found");
    }

    res.send(`
        <html>

        <head>
            <title>ShopZone Account</title>

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

                .account {
                    max-width: 700px;
                    margin: 50px auto;
                    background: white;
                    padding: 40px;
                    border: 1px solid #ddd;
                }

                .info {
                    margin-top: 25px;
                }

                .info p {
                    padding: 12px;
                    background: #f5f5f5;
                    border-bottom: 1px solid #ddd;
                }

                .warning {
                    margin-top: 30px;
                    padding: 15px;
                    background: #fff3cd;
                    border: 1px solid #ffeeba;
                }
            </style>
        </head>

        <body>

            <div class="navbar">
                <a href="/dashboard">Dashboard</a>
                <a href="/logout">Logout</a>
            </div>

            <div class="account">

                <h1>My Account</h1>

                <div class="info">

                    <p>
                        <strong>Username:</strong>
                        ${user.username}
                    </p>

                    <p>
                        <strong>Role:</strong>
                        ${user.role}
                    </p>

                    <p>
                        <strong>Email:</strong>
                        ${user.username}@shopzone.local
                    </p>

                    <p>
                        <strong>Orders:</strong>
                        5
                    </p>

                </div>

                <div class="warning">
                    <strong>LAB 03:</strong>
                    This page is intentionally vulnerable to IDOR.
                </div>

            </div>

        </body>

        </html>
    `);
});

app.get("/admin", requireLogin, (req, res) => {

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

                <hr>

                <h2>Promote User</h2>

                <form method="POST" action="/admin/promote">
                    <input type="text" name="username" placeholder="Username" required>
                    <button type="submit">Promote User</button>
                </form>

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
// LAB 05 ADMIN PAGE
// --------------------------------------------------

app.get("/lab5-admin", requireLogin, (req, res) => {

// Server-side authorization check
    if (req.session.user.role !== "admin") {
        return res.status(403).send("Access denied");
    }

    res.send(`
        <html>

        <head>
            <title>ShopZone Lab 5 Admin Panel</title>
        </head>

        <body>

            <h1>ShopZone Admin Panel</h1>

            <p><strong>LAB 05:</strong> URL-Based Access Control</p>

            <hr>

            <h2>Administrator Area</h2>

            <p>
                This page should only be accessible to administrators.
            </p>

            <p>
                Sensitive administrative functionality is available here.
            </p>

        </body>

        </html>
    `);
});

app.post("/admin/promote", requireLogin, (req, res) => {

        if (req.session.user.role !== "admin") {
            return res.status(403).send("Access denied");
        }

    const username = req.body.username;

    const user = users.find(
        (account) => account.username === username
    );

    if (!user) {
        return res.status(404).send("User not found");
    }

    user.promoted = true;

    res.send(`User ${user.username} has been promoted.`);
});

// --------------------------------------------------
// LAB 06 — MULTI-STEP ACCESS CONTROL
// --------------------------------------------------

// Step 1 — Lab 6 Admin Page
app.get("/lab6-admin", requireLogin, (req, res) => {

    if (req.session.user.role !== "admin") {
        return res.status(403).send("Access denied");
    }

    res.send(`
        <html>

        <head>
            <title>ShopZone Lab 6 Admin Panel</title>

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

                .delete-button {
                    background: #dc3545;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    cursor: pointer;
                    border-radius: 4px;
                }

                .delete-button:hover {
                    background: #b02a37;
                }
            </style>

        </head>

        <body>

            <div class="navbar">
                <a href="/dashboard">Dashboard</a>
                <a href="/logout">Logout</a>
            </div>

            <div class="admin-panel">

                <h1>ShopZone Lab 6 Admin Panel</h1>

                <div class="warning">
                    <strong>LAB 06:</strong>
                    Multi-Step Process with Missing Access Control
                </div>

                <p>
                    Select a user below to begin the deletion process.
                </p>

                <table>

                    <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Action</th>
                    </tr>

                    ${users.map(user => `
                        <tr>

                            <td>${user.username}</td>

                            <td>${user.role}</td>

                            <td>
                                <form
                                    method="GET"
                                    action="/lab6-admin/delete"
                                >

                                    <input
                                        type="hidden"
                                        name="username"
                                        value="${user.username}"
                                    >

                                    <button
                                        type="submit"
                                        class="delete-button"
                                    >
                                        Delete
                                    </button>

                                </form>
                            </td>

                        </tr>
                    `).join("")}

                </table>

            </div>

        </body>

        </html>
    `);
});


// Step 2 — Select user
app.get("/lab6-admin/delete", requireLogin, (req, res) => {

    if (req.session.user.role !== "admin") {
        return res.status(403).send("Access denied");
    }

    const username = req.query.username;

    const user = users.find(
        (account) => account.username === username
    );

    if (!user) {
        return res.status(404).send("User not found");
    }

    res.send(`
        <html>

        <head>
            <title>Delete User</title>

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

                button {
                    padding: 10px 20px;
                    cursor: pointer;
                }
            </style>
        </head>

        <body>

            <div class="box">

                <h1>Delete User</h1>

                <p>
                    You selected user:
                    <strong>${user.username}</strong>
                </p>

                <p>
                    Click below to continue.
                </p>

                <form
                    method="POST"
                    action="/lab6-admin/delete/confirm"
                >

                    <input
                        type="hidden"
                        name="username"
                        value="${user.username}"
                    >

                    <button type="submit">
                        Continue
                    </button>

                </form>

            </div>

        </body>

        </html>
    `);
});


// Step 3 — Confirm deletion
app.post("/lab6-admin/delete/confirm", requireLogin, (req, res) => {

    if (req.session.user.role !== "admin") {
        return res.status(403).send("Access denied");
    }

    const username = req.body.username;

    const user = users.find(
        (account) => account.username === username
    );

    if (!user) {
        return res.status(404).send("User not found");
    }

    res.send(`
        <html>

        <head>
            <title>Confirm Delete</title>

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

                .delete-button {
                    background: #dc3545;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    cursor: pointer;
                }
            </style>
        </head>

        <body>

            <div class="box">

                <h1>Confirm Deletion</h1>

                <p>
                    Are you sure you want to delete
                    <strong>${user.username}</strong>?
                </p>

                <form
                    method="POST"
                    action="/lab6-admin/delete/execute"
                >

                    <input
                        type="hidden"
                        name="username"
                        value="${user.username}"
                    >

                    <button
                        type="submit"
                        class="delete-button"
                    >
                        Confirm Delete
                    </button>

                </form>

            </div>

        </body>

        </html>
    `);
});


// Step 4 — Execute deletion
app.post("/lab6-admin/delete/execute", requireLogin, (req, res) => {

    // Server-side authorization check
    if (req.session.user.role !== "admin") {
        return res.status(403).send("Access denied");
    }

    const username = req.body.username;

    const userIndex = users.findIndex(
        (account) => account.username === username
    );

    if (userIndex === -1) {
        return res.status(404).send("User not found");
    }

    users.splice(userIndex, 1);

    res.send(`
        <html>

        <head>
            <title>User Deleted</title>

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

                <h1>User Deleted</h1>

                <p>
                    User <strong>${username}</strong>
                    has been deleted.
                </p>

                <br>

                <a href="/lab6-admin">
                    Back to Admin Panel
                </a>

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