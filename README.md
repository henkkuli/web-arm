# ts-template
My Typescript web app template

## Usage
- Install [node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/)
- Install [gulp-cli](https://www.npmjs.com/package/gulp-cli) using `npm install --global gulp-cli`
- Clone this repository ether using git or [downloading the zip](https://github.com/henkkuli/ts-template/archive/master.zip) and unzipping it
- Write your code under `src/`
  - `src/client/index.ts` is the main file loaded by `src/static/index.html`
  - `src/server/index.ts` contains a small server for serving static content
  - `src/static/index.html` is the default web page served
- Run the development environment using `gulp develop`
- Profit.

### Hints
- Compile all files without running the server using `gulp`
- Run the server as a stand-alone application using 'node dist`
