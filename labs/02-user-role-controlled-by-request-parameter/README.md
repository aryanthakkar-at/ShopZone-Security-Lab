# Lab 02 — User Role Controlled by Request Parameter

## Vulnerability

Broken Access Control / Vertical Privilege Escalation

## Difficulty

Apprentice

## Objective

Demonstrate how a normal authenticated user can gain administrator access when the application trusts a user-controlled cookie to determine their role.

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

After login, the application created an `Admin` cookie:

```text
Admin=true
```

for administrators and:

```text
Admin=false
```

for normal users.

The `/admin` route then trusted this cookie to decide whether the user could access the administrator panel.

The vulnerable code was:

```js
if (req.cookies.Admin !== "true") {
    return res.status(403).send("Access denied");
}
```

The problem is that the cookie is controlled by the browser and can therefore be modified by the user.

## Exploitation Using Burp Suite

1. Log in as `daniel`.
2. Intercept the login traffic using Burp Suite.
3. Find the response containing:

```http
Set-Cookie: Admin=false
```

4. Change it to:

```http
Set-Cookie: Admin=true
```

5. Forward the modified response.
6. Visit:

```text
/admin
```

7. The normal user is granted access to the administrator panel.

## Root Cause

The application trusted a client-controlled cookie for authorization.

The server effectively trusted the browser to tell it whether the user was an administrator.

This allowed the user to modify:

```text
Admin=false
```

to:

```text
Admin=true
```

and gain administrator access.

## Remediation

The application was changed so that the administrator role is checked using the server-side session:

```js
if (req.session.user.role !== "admin") {
    return res.status(403).send("Access denied");
}
```

The vulnerable `Admin` cookie was removed.

`cookie-parser` was also removed because it was no longer required.

## Expected Secure Behavior

After the fix:

| Account | `/admin`          |
| ------- | ----------------- |
| admin   | Allowed           |
| daniel  | 403 Access Denied |
| pauline | 403 Access Denied |

Changing or creating an `Admin=true` cookie should no longer provide administrator access.

## What I Learned

This lab demonstrated why authorization decisions should not rely on values controlled by the client.

A user can modify cookies, parameters, and other client-side data.

The server should determine the user's privileges using trusted server-side information.

## Lab Status

* [x] Build vulnerable functionality
* [x] Test login
* [x] Intercept traffic with Burp Suite
* [x] Modify `Admin=false` to `Admin=true`
* [x] Gain unauthorized admin access
* [x] Identify root cause
* [x] Remove vulnerable cookie-based authorization
* [x] Implement server-side role authorization
* [x] Retest after fix
