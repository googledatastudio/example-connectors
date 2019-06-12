# Example Connectors for Google Data Studio

This repository contains open source example connectors for
[Google Data Studio]. It is a showcase for full working examples that utilize
best practices.

If you'd like to release a community connector as open source, please see
[community-connectors].

## Examples

### [NPM Downloads]

The NPM (Node Package Manager) Downloads connector uses the
[package downloads count] api to fetch download information for a package or
group of packages.

Highlighted Best Practices:

+   Uses the [DataStudio Service] for error handling, authentication, and fields
    configuration.

Good example of:

+   No authentication required
+   Requesting data using [`UrlFetchApp.fetch()`]
+   Using a date range

### [TypeScript NPM Downloads]

This is the same code as the [NPM Downloads] connector, but implemented using
TypeScript.

Good example of:

+   Using TypeScript to help write less-buggy code.

[Google Data Studio]: https://datastudio.google.com/
[community-connectors]: https://developers.google.com/datastudio/connector/
[`UrlFetchApp.fetch()`]: https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app
[DataStudio Service]: https://developers.google.com/apps-script/reference/data-studio/
[NPM Downloads]: https://github.com/googledatastudio/example-connectors/tree/master/npm-downloads
[TypeScript NPM Downloads]: https://github.com/googledatastudio/example-connectors/tree/master/npm-downloads-ts
[package downloads count]: https://github.com/npm/registry/blob/master/docs/download-counts.md
