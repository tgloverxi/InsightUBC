# CPSC 310 Project Repository

This repository contains starter code for the class project.
Please keep your repository private.

Piazza is your best resource for additional details about the [project](https://github.com/ubccpsc/310/blob/2019sept/project/README.md), [AutoTest](https://github.com/ubccpsc/310/blob/2019sept/project/AutoTest.md), and the specific requirements of each [project deliverable](https://github.com/ubccpsc/310/blob/2019sept/README.md#project-sprint-schedule).
These resources will be frequently updated as the term progresses.

## Configuring your environment

To start using this project, you need to get your computer configured so you can build and execute the code.
To do this, follow these steps; the specifics of each step (especially the first two) will vary based on which operating system your computer has:

1. [Install git](https://git-scm.com/downloads) (v2.9+). After installing you should be able to execute `git --version` on the command line.

1. [Install Node LTS](https://nodejs.org/en/download/) (v10.14.X), which will also install NPM (you should be able to execute `node --version` and `npm --version` on the command line).

1. [Install Yarn](https://yarnpkg.com/en/docs/install) (v1.12+). You should be able to execute `yarn --version` afterwards.

1. Clone your repository by running `git clone REPO_URL` from the command line. You can get the REPO_URL by clicking on the green button on your project repository page on GitHub.

## Project commands

Once your environment is configured you need to further prepare the project's tooling and dependencies.
In the project folder:

1. `yarn install` to download the packages specified in your project's *package.json* to the *node_modules* directory.

1. `yarn build` to compile your project. You must run this command after making changes to your TypeScript files.

1. `yarn test` to run the test suite.

## Running and testing from an IDE

WebStorm should be automatically configured the first time you open the project (WebStorm is a free download through their students program). For other IDEs and editors, you'll want to set up test and debug tasks and specify that the schema of all files in `test/queries` should follow `test/query.schema.json`.
