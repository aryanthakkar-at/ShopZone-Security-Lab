# Lab 03 — User ID Controlled by Request Parameter

## Vulnerability

Insecure Direct Object Reference (IDOR) / Broken Access Control

## Difficulty

Apprentice

## Objective

Demonstrate how a normal authenticated user can access another user's account information when the application trusts a user-controlled username parameter.

## Application

ShopZone is a deliberately vulnerable local e-commerce application built using:

- Node.js
- Express
- HTML
- CSS
- JavaScript

The application is intended for local cybersecurity practice only.

## Test Accounts

These are dummy accounts created specifically for this local lab.

| Username | Password | Role |
|---|---|---|
| admin | admin123 | Admin |
| daniel | daniel123 | User |
| pauline | pauline123 | User |

## The vulnerable code used:

const requestedUsername = req.query.username;

const user = users.find(
    (account) => account.username === requestedUsername
);

The server therefore trusted the username supplied by the browser.

## Vulnerable Behavior

The account page originally accepted the username from the URL:

```text
/account?username=daniel