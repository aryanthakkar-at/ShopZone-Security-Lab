# Lab 01 — Unprotected Admin Functionality

## Vulnerability

Broken Access Control / Vertical Privilege Escalation

## Difficulty

Apprentice

## Objective

Demonstrate how a normal authenticated user can access administrator functionality when the application does not properly check the user's role.

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

## Vulnerable Behavior

The application had a login system that authenticated users, but the `/admin` route only checked whether the user was logged in.

The vulnerable route did not verify the user's role.

The vulnerable code was:

```js
app.get("/admin", requireLogin, (req, res) => {
    // Admin functionality
});
```

The important problem was the absence of an authorization check such as:

```js
if (req.session.user.role !== "admin") {
    return res.status(403).send("Access denied");
}
```

## Exploitation

1. Log in as the normal user `daniel`.
2. The login succeeds because Daniel has valid credentials.
3. Manually browse to:

```text
/admin
```

4. The application displays the administrator panel.
5. The normal user can therefore access functionality intended only for administrators.

This demonstrates vertical privilege escalation: a lower-privileged user gains access to functionality belonging to a higher-privileged role.

## Root Cause

The application implemented authentication but failed to enforce authorization on the `/admin` endpoint.

Authentication answers:

> Who is the user?

Authorization answers:

> Is this user allowed to perform this action?

The application only performed the first check.

## Remediation

The `/admin` route was changed to verify the user's role using the server-side session:

```js
app.get("/admin", requireLogin, (req, res) => {
    if (req.session.user.role !== "admin") {
        return res.status(403).send("Access denied");
    }

    // Admin functionality
});
```

## Expected Secure Behavior

| Account | `/admin`          |
| ------- | ----------------- |
| admin   | Allowed           |
| daniel  | 403 Access Denied |
| pauline | 403 Access Denied |

A normal authenticated user should not be able to access the administrator panel.

## What I Learned

This lab demonstrated the difference between authentication and authorization.

A successful login does not automatically mean that the user is authorized to access every part of an application.

Authorization checks must be applied to protected functionality on the server.

## Reference

This lab is based on the concept of unprotected administrative functionality described by PortSwigger's Web Security Academy.

## Lab Status

* [x] Build vulnerable functionality
* [x] Create test accounts
* [x] Log in as normal user
* [x] Access unprotected admin functionality
* [x] Identify missing authorization
* [x] Add server-side role check
* [x] Retest after fix
* [x] Confirm normal users receive 403
