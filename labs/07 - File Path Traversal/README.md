# Lab 07 — File Path Traversal

## Vulnerability

File Path Traversal

The application allows users to specify a filename through the `file` query parameter. The server directly uses this value to construct the file path without validating whether the requested file remains inside the intended `public/files/` directory.

An attacker can use path traversal sequences such as `../` to move outside the intended directory and access other files.

---

## Difficulty

Apprentice

---

## Objective

Exploit a file viewer that is vulnerable to path traversal and access a file outside the intended directory.

Then fix the vulnerability by validating the resolved file path on the server.

---

## Application

ShopZone

The vulnerable functionality is available at:

```text
/lab7-file
```

The file viewer is intended to display product files stored inside:

```text
public/files/
```

---

## Test Accounts

No login is required for this lab.

---

## Vulnerable Functionality

The application provides a file viewer where users can select product files:

```text
product1.txt
product2.txt
product3.txt
```

A normal request looks like:

```text
GET /lab7-file?file=product1.txt
```

The application then constructs the requested file path using the value supplied by the user.

---

## Vulnerable Code

The original vulnerable code was:

```js
const filePath = path.join(
    __dirname,
    "public",
    "files",
    filename
);

res.sendFile(filePath);
```

The `filename` value comes directly from the user's request:

```js
const filename = req.query.file;
```

There is no validation to prevent the user from using path traversal sequences.

---

## Exploitation Using Burp Suite

First, access the normal file viewer:

```text
http://localhost:3000/lab7-file
```

Select one of the product files.

A normal request is:

```http
GET /lab7-file?file=product1.txt HTTP/1.1
Host: localhost:3000
```

Capture the request in Burp Suite and send it to Repeater.

Change the filename to:

```text
../index.html
```

The resulting request is:

```http
GET /lab7-file?file=../index.html HTTP/1.1
Host: localhost:3000
```

The application resolves the path as:

```text
public/files/../index.html
```

The `..` moves the path one directory upward:

```text
public/files/../index.html
        ↓
public/index.html
```

The application therefore returns the contents of `public/index.html`.

This confirms that the application is vulnerable to File Path Traversal.

---

## Example Exploit Request

```http
GET /lab7-file?file=../index.html HTTP/1.1
Host: localhost:3000
```

The exploit works because the application does not restrict the resolved path to the intended `public/files/` directory.

---

## Root Cause

The root cause is insufficient validation of user-controlled file paths.

The application accepts the `file` parameter directly and uses it to construct a filesystem path:

```js
const filename = req.query.file;
```

An attacker can therefore include:

```text
../
```

to navigate outside the intended directory.

---

## Remediation

The application was fixed by resolving both the allowed directory and requested file to absolute paths and verifying that the requested file remains inside the allowed directory.

```js
const baseDir = path.resolve(
    __dirname,
    "public",
    "files"
);

const filePath = path.resolve(
    baseDir,
    filename
);

if (!filePath.startsWith(baseDir + path.sep)) {
    return res.status(403).send("Access denied");
}

res.sendFile(filePath);
```

This prevents paths such as:

```text
../index.html
```

from escaping the intended directory.

---

## Expected Secure Behavior

A legitimate request should continue to work:

```text
/lab7-file?file=product1.txt
```

The server should return the contents of `product1.txt`.

A path traversal attempt such as:

```text
/lab7-file?file=../index.html
```

should be rejected with:

```text
403 Access denied
```

---

## What I Learned

* File Path Traversal occurs when user-controlled input is used to access files without proper path validation.
* `../` can be used to move to a parent directory.
* Path traversal is a server-side vulnerability.
* Burp Suite Repeater can be used to modify file parameters and test traversal payloads.
* Using `path.resolve()` and validating that the final path remains inside the intended directory helps prevent directory traversal.
* Security controls must be implemented on the server because client-side restrictions can be bypassed.

---

## Reference

PortSwigger Web Security Academy — File Path Traversal

---

## Lab Status

**Completed**

* Vulnerability created
* Exploitation confirmed using Burp Suite
* Remediation implemented
* Remediation tested successfully
