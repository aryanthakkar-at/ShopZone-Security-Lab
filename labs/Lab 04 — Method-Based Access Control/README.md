# Lab 04 — Method-Based Access Control

## Vulnerability

Broken Access Control / Method-Based Access Control Bypass

## Difficulty

Apprentice

## Objective

Demonstrate how authorization can be bypassed when an application performs an authorization check only for a specific HTTP method.

## Application

ShopZone is a deliberately vulnerable local e-commerce application built using:

* Node.js
* Express
* HTML
* CSS
* JavaScript

The application is intended for local cybersecurity practice only.

## Test Accounts

These are dummy accounts created specifically for this local lab.

| Username | Password   | Role  |
| -------- | ---------- | ----- |
| admin    | admin123   | Admin |
| daniel   | daniel123  | User  |
| pauline  | pauline123 | User  |

## Vulnerable Functionality

ShopZone contains an administrative function for promoting a user.

The intended request is:

```http
POST /admin/promote
```

The vulnerable implementation accepted multiple HTTP methods using `app.all()`.

The authorization check was only performed when the request method was `POST`.

## Vulnerable Code

The vulnerable route was:

```js
app.all("/admin/promote", requireLogin, (req, res) => {

    // LAB 04 - VULNERABLE
    // Only POST requests are checked for admin privileges.
    if (req.method === "POST") {
        if (req.session.user.role !== "admin") {
            return res.status(403).send("Access denied");
        }
    }

    const username = req.query.username || req.body.username;

    const user = users.find(
        (account) => account.username === username
    );

    if (!user) {
        return res.status(404).send("User not found");
    }

    user.promoted = true;

    res.send(`User ${user.username} has been promoted.`);
});
```

## Exploitation Using Burp Suite

1. Log in as the normal user `daniel`.
2. Create or intercept a promotion request.
3. A normal POST request is blocked because the POST request performs the administrator check.
4. Change the HTTP method from:

```http
POST /admin/promote
```

to:

```http
GET /admin/promote?username=pauline
```

5. Keep Daniel's authenticated session cookie.
6. Forward the modified request.
7. The request is processed without performing the administrator check.
8. Pauline's `promoted` value is changed to `true`.

The important part of the attack is that the authorization decision changes depending on the HTTP method.

## Example Exploit Request

```http
GET /admin/promote?username=pauline HTTP/1.1
Host: 192.168.29.49:3000
Cookie: connect.sid=YOUR_DANIEL_SESSION
```

The session belongs to Daniel, but the vulnerable endpoint processes the GET request without checking whether Daniel is an administrator.

## Root Cause

The application incorrectly tied authorization to the HTTP method:

```js
if (req.method === "POST") {
    // authorization check
}
```

This meant that changing the request method could bypass the authorization logic.

Authorization should not depend on an attacker-controlled change to the HTTP method.

## Remediation

The endpoint was changed back to the intended HTTP method:

```js
app.post("/admin/promote", requireLogin, (req, res) => {
```

The administrator check is performed for every request reaching the endpoint:

```js
if (req.session.user.role !== "admin") {
    return res.status(403).send("Access denied");
}
```

The final fixed route is:

```js
app.post("/admin/promote", requireLogin, (req, res) => {

    // LAB 04 - FIXED
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
```

## Expected Secure Behavior

| Request               | Admin               | Daniel              |
| --------------------- | ------------------- | ------------------- |
| `POST /admin/promote` | Allowed             | 403                 |
| `GET /admin/promote`  | Route not available | Route not available |

Changing the HTTP method must not provide a way to bypass authorization.

## What I Learned

This lab demonstrated that authorization must be enforced independently of the HTTP method used to reach an administrative function.

The application should:

1. Restrict the endpoint to the intended HTTP method.
2. Perform authorization checks on the server.
3. Never assume that changing the request method is safe or trustworthy.
4. Ensure that every path to a sensitive action is protected.

## Reference

This lab is based on PortSwigger's method-based access control scenario, where flawed authorization logic can be circumvented by changing the HTTP method from POST to GET.

## Lab Status

* [x] Create promotion functionality
* [x] Create vulnerable method-based authorization logic
* [x] Test as administrator
* [x] Test as normal user
* [x] Intercept request with Burp Suite
* [x] Change POST request to GET
* [x] Bypass authorization
* [x] Promote another user as a normal user
* [x] Identify root cause
* [x] Change `app.all()` to `app.post()`
* [x] Move authorization check outside method-specific logic
* [x] Retest after fix
* [x] Confirm normal user receives 403
