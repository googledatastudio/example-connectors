# How to use

First, you should read [Develop Apps Script using TypeScript]. That guide
explains how [`clasp`] can be used to develop an Apps Script project using
TypeScript.

## Workflow

1.  Clone this project:

    ```sh
    git clone https://github.com/googledatastudio/example-connectors.git
    ```

1.  Change to the `npm-downloads-ts` directory:

    ```sh
    cd npm-downloads-ts
    ```

1.  Update the `scriptId` property in `.clasp.json` to an Apps Script project
    you own. **This project will be overwritten, so it's best to make a new
    project for this.**

    The script id will be a part of the Apps Script url. If your apps script url
    is

    ```
    https://script.google.com/d/1w9Nb7dbqj_QiSpFIpXRZ8KoXcg2wA9JoW6ZTkZxtiT1LaG2-29nrTUva/edit
    ```

    the script id will be

    ```
    1w9Nb7dbqj_QiSpFIpXRZ8KoXcg2wA9JoW6ZTkZxtiT1LaG2-29nrTUva
    ```

1.  Set up `dscc-scripts` to watch for (and push) local changes.

    ```sh
    npm run watch
    ```

1.  Open the latest deployment so you can refresh to check on changes as you go.

    ```sh
    npm run try_latest
    ```

1.  Make changes to `main.ts`, wait for the changes to be pushed, and then try
    them out in the tab you opened in the previous step.

[Develop Apps Script using TypeScript]: https://developers.google.com/apps-script/guides/typescript
[`clasp`]: https://github.com/google/clasp
