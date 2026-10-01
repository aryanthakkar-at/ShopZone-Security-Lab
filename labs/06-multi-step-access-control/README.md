# Lab 06 — Multi-Step Process with No Access Control on One Step

## Vulnerability

**Broken Access Control — Multi-Step Process with Missing Authorization**

The application contains a multi-step administrative process for deleting users.

The first steps verify that the logged-in user has an administrator role. However, the final step that actually performs the deletion does not perform an authorization check.

Because of this, a normal authenticated user can skip the protected steps and directly send a request to the final deletion endpoint.

---

## Difficulty

**Practitioner**

---

## Objective

Demonstrate how a sensitive multi-step process can be bypassed when authorization is applied to some steps but missing from the step that performs the actual sensitive action.

The goal is to:

1. Identify the multi-step deletion process.
2. Observe that earlier steps require administrator privileges.
3. Use Burp Suite to skip directly to the final step.
4. Exploit the missing authorization check.
5. Fix the vulnerability by enforcing authorization on the final step.

---

## Application

This lab is part of the intentionally vulnerable **ShopZone** web application.

**Technologies:**

* Node.js
* Express
* Express Session
* HTML
* CSS
* JavaScript

The application is running locally for cybersecurity learning and testing.

---

## Test Accounts

| Username | Password   | Role  |
| -------- | ---------- | ----- |
| admin    | admin123   | Admin |
| daniel   | daniel123  | User  |
| pauline  | pauline123 | User  |

---

## Vulnerable Functionality

The application provides an administrator page:

```text
/lab6-admin
```

The page displays the available users and provides a **Delete** button.

Deleting a user involves multiple steps:

```text
Step 1
/lab6-admin
        ↓
Select user

Step 2
/lab6-admin/delete
        ↓
Confirm user

Step 3
/lab6-admin/delete/confirm
        ↓
Final deletion request

Step 4
/lab6-admin/delete/execute
        ↓
User deleted
```

The first steps check whether the logged-in user is an administrator.

The final endpoint originally did not perform this role check.

---

## Vulnerable Code

The vulnerable endpoint was:

```js
app.post("/lab6-admin/delete/execute", requireLogin, (req, res) => {

    // No admin role check

    const username = req.body.username;

    const userIndex = users.findIndex(
        (account) => account.username === username
    );

    if (userIndex === -1) {
        return res.status(404).send("User not found");
    }

    users.splice(userIndex, 1);

    res.send(`
        <h1>User Deleted</h1>

        <p>
            User <strong>${username}</strong>
            has been deleted.
        </p>
    `);
});
```

The endpoint uses:

```js
requireLogin
```

but does not check:

```js
req.session.user.role
```

Therefore, any authenticated user can reach the endpoint if they know the URL and request format.

---

## Exploitation Using Burp Suite

### Step 1 — Login as a normal user

Login as:

```text
Username: daniel
Password: daniel123
```

Daniel is a normal user and should not have administrator privileges.

---

### Step 2 — Capture a request

Using Burp Suite, capture a request from Daniel's authenticated session.

Send the request to **Repeater**.

---

### Step 3 — Skip the previous steps

Instead of following the normal deletion process, directly send a request to:

```text
/lab6-admin/delete/execute
```

with the username of the target account.

---

## Example Exploit Request

```http
POST /lab6-admin/delete/execute HTTP/1.1
Host: localhost:3000
Content-Type: application/x-www-form-urlencoded
Cookie: connect.sid=YOUR_DANIEL_SESSION

username=pauline
```

The important part is that the request is sent directly to the final execution endpoint.

Daniel does not need to complete the previous administrator-only steps.

---

## Exploitation Result

The server processes the request and deletes Pauline's account.

The response is:

```text
User Deleted

User pauline has been deleted.
```

This happens even though Daniel has the role:

```text
user
```

and not:

```text
admin
```

---

## How the Vulnerability Works

The intended process is:

```text
Admin
  ↓
Select user
  ↓
Confirm deletion
  ↓
Execute deletion
  ↓
User deleted
```

The application checks the administrator role during the earlier steps.

However, the final step only checks whether the user is logged in:

```js
requireLogin
```

It does not check whether the user is an administrator.

Therefore:

```text
Daniel
  ↓
Logged in? YES
  ↓
Admin? NO
  ↓
Final endpoint checks admin role?
NO
  ↓
Deletion performed
```

The important lesson is that **authorization must be checked at every sensitive operation**, not only at the beginning of a multi-step process.

---

## Root Cause

The root cause is **missing server-side authorization on the final step of a multi-step sensitive operation**.

The application assumed that a user would reach the final step only after successfully completing the previous administrator-only steps.

However, an attacker can directly send a request to the final endpoint without following the intended UI flow.

The server must never rely on the user following the expected sequence.

---

## Remediation

The final deletion endpoint must also verify that the logged-in user has administrator privileges.

### Fixed Code

```js
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
        <h1>User Deleted</h1>

        <p>
            User <strong>${username}</strong>
            has been deleted.
        </p>
    `);
});
```

The important addition is:

```js
if (req.session.user.role !== "admin") {
    return res.status(403).send("Access denied");
}
```

Now the sensitive operation itself is protected.

---

## Expected Secure Behavior

| User                 | Direct request to `/lab6-admin/delete/execute` | Result                 |
| -------------------- | ---------------------------------------------- | ---------------------- |
| Admin                | Allowed                                        | User can be deleted    |
| Daniel               | Blocked                                        | `403 Access denied`    |
| Pauline              | Blocked                                        | `403 Access denied`    |
| Unauthenticated user | Blocked                                        | Redirected to `/login` |

The normal administrator workflow continues to work:

```text
Admin
  ↓
Lab 6 Admin Panel
  ↓
Delete
  ↓
Confirm
  ↓
Execute
  ↓
User deleted
```

But a normal user can no longer bypass the earlier steps by directly calling the final endpoint.

---

## What I Learned

* Multi-step processes must enforce authorization at every sensitive step.
* An attacker does not have to follow the intended UI workflow.
* Hidden buttons and protected previous pages do not protect the final endpoint.
* `requireLogin` only verifies that a user is authenticated.
* Authentication and authorization are different.
* Sensitive operations must perform server-side authorization checks.
* Burp Suite Repeater can be used to directly test individual application endpoints.
* Access control should be enforced based on the user's privileges, not on the assumption that previous steps were completed correctly.

---

## Reference

PortSwigger Web Security Academy — **Multi-step process with no access control on one step**

---

## Lab Status

* [x] Vulnerable multi-step deletion process created
* [x] Admin workflow tested
* [x] Normal user login tested
* [x] Final endpoint identified
* [x] Exploitation performed using Burp Suite
* [x] Missing authorization identified
* [x] Server-side authorization added
* [x] Secure behavior tested
* [x] Lab completed
