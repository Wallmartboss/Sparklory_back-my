<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

1. **Commit messages should be concise and descriptive**:

   - Start with a verb in the present tense (e.g., "add," "update," "fix", "remove").
   - Use the imperative mood for consistency (e.g., "add feature" instead of "added feature").
   - Use clear and meaningful names that explain the purpose of the commit.

   Example: add user authentication feature

2. **Commit messages should be self-contained**:

   - Each commit should represent a logical change or fix.
   - Avoid bundling unrelated changes in a single commit.

3. **Use commit message prefixes**:

   - Use prefixes to indicate the type of commit:
     - feature: for new features or functionality
     - fix: for bug fixes
     - refactor: for code refactoring or restructuring
     - docs: for documentation updates
     - test: for adding or modifying tests
     - chore: for general maintenance or miscellaneous tasks

   Example: feature: add user authentication feature

4. **Be consistent**:

   - Follow the same naming convention throughout the project.
   - If working on a specific task or issue, include the task or issue number in the commit message for easier tracking.

   Example: fix: Issue #123 - Fix user authentication bug

## Branch Naming Convention

1. **Branch names should be meaningful and descriptive**:

   - Use lowercase letters and hyphens to separate words.
   - Include the related task or issue number, if applicable.

   Example: feature/user-authentication, fix/issue-123

2. **Use short-lived feature branches**:

   - Create a new branch for each new feature or bug fix.
   - Merge the branch back into the main branch (e.g., main or master) after completing the work.

3. **Prefixes for branch names**:

   - Use prefixes to indicate the purpose of the branch:
     - feature/ for new features or functionality +
     - fix/ for bug fixes
     - hotfix/ for urgent fixes on the main branch
     - release/ for preparing a new release

   Example: feature/user-authentication, fix/issue-123

4. **Be consistent**:
   - Follow the same naming convention throughout the project.
