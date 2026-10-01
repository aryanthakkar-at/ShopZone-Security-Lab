# Lab 05 — URL-Based Access Control

## Vulnerability

Broken Access Control / URL-Based Access Control Bypass

## Difficulty

Apprentice

## Objective

Demonstrate how authorization can be bypassed when an application uses a client-controlled HTTP header to modify the URL being processed by the backend.

The lab demonstrates a mismatch between the URL checked by an access-control layer and the URL ultimately processed by the application.

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

ShopZone contains a protected administrative page:

```http
GET /lab5-admin
```

The application contains a simulated front-end access-control layer that blocks requests when the original URL begins with:

```text
/lab5-admin
```

However, the backend also trusts the client-controlled `X-Original-URL` HTTP header and changes `req.url` based on its value.

This creates a mismatch between the URL checked by the access-control layer and the URL processed by the backend.

## Vulnerable Code

The vulnerable middleware was:

```js
// LAB 05 - VULNERABLE URL-BASED ACCESS CONTROL

// Save the actual requested URL
app.use((req, res, next) => {
    req.originalRequestUrl = req.url;
    next();
});

// Simulated front-end access control
// Checks the original URL only.
app.use((req, res, next) => {

    if (req.originalRequestUrl.startsWith("/lab5-admin")) {
        return res.status(403).send("Access to admin area blocked");
    }

    next();
});

// Vulnerable backend behavior
// Backend trusts X-Original-URL.
app.use((req, res, next) => {

    const originalUrl = req.headers["x-original-url"];

    if (originalUrl) {
        req.url = originalUrl;
    }

    next();
});
```

The vulnerable administrative route did not perform an additional role check:

```js
app.get("/lab5-admin", requireLogin, (req, res) => {

    // LAB 05 - VULNERABLE
    // No additional authorization check here.

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
```

## Exploitation Using Burp Suite

1. Log in as the normal user `daniel`.

2. Confirm that Daniel has the `user` role.

3. Normally, requesting:

```http
GET /lab5-admin
```

is blocked by the access-control middleware.

4. Intercept a request using Burp Suite.

5. Change the request so that the requested URL is `/`, while adding:

```http
X-Original-URL: /lab5-admin
```

6. Keep Daniel's authenticated session cookie.

7. Forward the modified request.

8. The access-control middleware checks the original URL `/` and therefore does not block the request.

9. The backend reads the `X-Original-URL` header and changes:

```js
req.url = "/lab5-admin";
```

10. Express then processes the `/lab5-admin` route.

11. Because the vulnerable route only requires the user to be logged in and does not check the user's role, Daniel can access the administrative page.

The important part of the attack is that the access-control layer checks one URL while the backend processes another URL.

## Example Exploit Request

```http
GET / HTTP/1.1

Host: 192.168.29.49:3000

X-Original-URL: /lab5-admin

Cookie: connect.sid=YOUR_DANIEL_SESSION
```

The session belongs to Daniel, a normal user.

However, the backend processes the request as:

```text
/lab5-admin
```

and displays the administrative page.

## How the Vulnerability Works

The request initially contains:

```http
GET /
```

Therefore:

```js
req.url === "/"
```

The application saves this value:

```js
req.originalRequestUrl = req.url;
```

So:

```text
req.originalRequestUrl = "/"
```

The access-control check then evaluates:

```js
req.originalRequestUrl.startsWith("/lab5-admin")
```

The result is:

```text
false
```

Therefore, the request is allowed to continue.

The application then reads:

```http
X-Original-URL: /lab5-admin
```

and executes:

```js
req.url = originalUrl;
```

This changes the URL being processed by Express:

```text
Before:

req.url = "/"

After:

req.url = "/lab5-admin"
```

Express then matches:

```js
app.get("/lab5-admin", ...)
```

and serves the administrative page.

## Root Cause

The root cause is that the application trusted a client-controlled `X-Original-URL` header to determine which URL the backend should process.

The access-control layer checked:

```js
req.originalRequestUrl
```

while the backend later changed:

```js
req.url
```

using:

```js
req.headers["x-original-url"]
```

This created a mismatch:

```text
Access-control layer:
"/"

Backend:
"/lab5-admin"
```

The application also failed to perform an authorization check inside the protected `/lab5-admin` route.

Authentication and authorization are different:

```text
Authentication:
"Is the user logged in?"

Authorization:
"Is this logged-in user allowed to access this resource?"
```

The vulnerable implementation only verified that the user was logged in.

## Remediation

The vulnerable behavior was removed.

The application no longer trusts `X-Original-URL` from the client to modify `req.url`.

The `/lab5-admin` route now performs a server-side administrator authorization check.

The fixed route is:

```js
// --------------------------------------------------
// LAB 05 - FIXED URL-BASED ACCESS CONTROL
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

            <p><strong>LAB 05:</strong> URL-Based Access Control - FIXED</p>

            <hr>

            <h2>Administrator Area</h2>

            <p>
                This page is accessible only to administrators.
            </p>

            <p>
                Server-side authorization is enforced.
            </p>

        </body>

        </html>
    `);
});
```

The important security check is:

```js
if (req.session.user.role !== "admin") {
    return res.status(403).send("Access denied");
}
```

This means that even if a normal user knows the URL, the server checks their role before providing access.

## Expected Secure Behavior

| Request                                 | Admin     | Daniel    |
| --------------------------------------- | --------- | --------- |
| `GET /lab5-admin`                       | Allowed   | 403       |
| `GET /`                                 | Home page | Home page |
| `GET /` + `X-Original-URL: /lab5-admin` | Home page | Home page |

A client-controlled `X-Original-URL` header must not allow a user to access an administrative resource.

## What I Learned

This lab demonstrated how URL-based access control can fail when different parts of an application disagree about which URL is being requested.

The application should:

1. Never trust client-controlled headers to redefine the requested resource.

2. Perform authorization checks on the server.

3. Protect sensitive routes directly rather than relying on a separate front-end access-control layer.

4. Check the user's role before providing access to administrative functionality.

5. Ensure that authentication and authorization are treated as separate security controls.

6. Make sure that alternative request paths cannot bypass authorization.

## Reference

This lab is based on PortSwigger's URL-based access control scenario, where access controls can be bypassed when different components of an application process the requested URL differently.

## Lab Status

* [x] Create `/lab5-admin` administrative functionality

* [x] Create vulnerable URL-based access-control logic

* [x] Create simulated front-end URL check

* [x] Implement `X-Original-URL` handling

* [x] Test direct access as administrator

* [x] Test direct access as normal user

* [x] Intercept request with Burp Suite

* [x] Change request to `GET /`

* [x] Add `X-Original-URL: /lab5-admin`

* [x] Keep normal user's authenticated session

* [x] Bypass URL-based access control

* [x] Access `/lab5-admin` as a normal user

* [x] Identify the URL-processing mismatch

* [x] Identify the missing server-side authorization check

* [x] Remove trust in `X-Original-URL`

* [x] Add server-side role authorization

* [x] Retest after fix

* [x] Confirm normal user receives 403

* [x] Confirm administrator can still access the page
