# Lab 03 — User ID Controlled by Request Parameter

## Vulnerability

Insecure Direct Object Reference (IDOR) / Broken Access Control

## Difficulty

Apprentice

## Objective

Demonstrate how a normal authenticated user can access another user's account information when the application trusts a user-controlled username parameter.

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

The account page used a username supplied in the URL:

```text
/account?username=daniel
```

The vulnerable code was:

```js
const requestedUsername = req.query.username;

const user = users.find(
    (account) => account.username === requestedUsername
);
```

The application therefore trusted the username supplied by the browser to determine which account should be displayed.

## Exploitation Using Burp Suite

1. Log in as `daniel`.
2. Open **My Account**.
3. Intercept the request using Burp Suite.
4. Find:

```http
GET /account?username=daniel
```

5. Change the request to:

```http
GET /account?username=pauline
```

6. Forward the request.
7. The application displays Pauline's account information.

The vulnerable application does not verify that Daniel is authorized to access Pauline's account.

## Root Cause

The application used:

```js
req.query.username
```

to select the account.

Query parameters are controlled by the client.

The server therefore allowed the user to choose which account object was returned.

This is an IDOR-style access control vulnerability because a user-controlled reference is used to access another user's object.

## Remediation

The application was changed to use the username stored in the authenticated server-side session:

```js
const username = req.session.user.username;

const user = users.find(
    (account) => account.username === username
);
```

The `username` query parameter is no longer used to determine which account is displayed.

## Expected Secure Behavior

If Daniel is logged in:

```text
/account?username=daniel
```

displays Daniel's account.

If the request is changed to:

```text
/account?username=pauline
```

the server still identifies the logged-in user as Daniel and displays Daniel's account.

The value in the URL can no longer select another user's account.

## What I Learned

This lab demonstrated horizontal access control and IDOR.

A user may be authenticated but still only be authorized to access their own resources.

User-controlled identifiers should not be trusted as proof that the user is authorized to access the referenced object.

The server should derive the current user's identity from trusted session information and enforce authorization on the requested resource.

## Reference

PortSwigger describes IDOR as an access control vulnerability that occurs when an application uses user-supplied input to access objects directly. Their Burp testing guidance demonstrates testing account identifiers in request parameters for this type of issue.

## Lab Status

* [x] Build vulnerable account functionality
* [x] Test account page
* [x] Intercept request with Burp Suite
* [x] Change `username=daniel` to `username=pauline`
* [x] Access another user's account
* [x] Identify root cause
* [x] Replace query parameter with server-side session identity
* [x] Retest after fix
* [x] Confirm IDOR exploitation no longer works
