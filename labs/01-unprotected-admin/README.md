# Lab 01 — Unprotected Admin Functionality

## Vulnerability

Broken Access Control / Vertical Privilege Escalation

## Difficulty

Apprentice

## Objective

Demonstrate how a normal authenticated user can access functionality intended only for an administrator when the server does not perform an authorization check.

## Application

ShopZone is a deliberately vulnerable local e-commerce application built using:

- Node.js
- Express
- HTML
- CSS
- JavaScript

The application is intended for local cybersecurity practice only.

## Test Accounts

These credentials are dummy credentials created specifically for this local lab.

| Username | Password | Role |
|---|---|---|
| admin | admin123 | Admin |
| daniel | daniel123 | User |
| pauline | pauline123 | User |

## Intended Access

The application is designed so that:

- `admin` can access `/admin`
- `daniel` should not access `/admin`
- `pauline` should not access `/admin`

## Vulnerable Behavior

The application checks whether a user is logged in:

```js
app.get("/admin", requireLogin, (req, res) => {
    // Admin functionality
});