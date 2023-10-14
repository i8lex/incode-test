
## Description

backend_test_task

Create a tiny server app based on Node.js.
The app should implement simple organization user structure management operations.
The following user roles should be supported:
a. Administrator (top-most user)
b. Boss (any user with at least 1 subordinate)
c. Regular user (user without subordinates)
Each user except the Administrator must have a boss (strictly one).
The following REST API endpoints should be exposed:
1. Register user
2. Authenticate as a user
3. Return list of users, taking into account the following:
- administrator should see everyone
- boss should see herself and all subordinates (recursively)
- regular user can see only herself
4. Change user's boss (only boss can do that and only for her subordinates)


## Installation

```bash
$ npm install
```
#### Create `.env` file end fill them, like in `.env.example` example file

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```




## Stay in touch

- Author - Oleksii Medvediev
- Linkedin - https://www.linkedin.com/in/link-oleksii-medvediev/

#
