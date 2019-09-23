# NPM Downloads

_This is not an official Google product._

This [Community Connector] lets you bring download information for npm packages
into [Google Data Studio]. It uses the [package download counts] api.

## Configuration

This connector requires you to enter one or more npm package names.

+   Single Package: `@google/dscc-gen`

+   Multiple Packages: `@google/dscc-gen,@google/ds-component`

## Set up this connector for personal use

To use this Community Connector in Data Studio there is a one-time setup to
deploy your own personal instance of the connector using Apps Script. See
[DEVELOP.md] for full instructions.

## Report An Issue

If you run into any issues with this connector, please [file an issue].

[Community Connector]: https://developers.google.com/datastudio/connector/
[Google Data Studio]: https://datastudio.google.com/
[file an issue]: https://github.com/googledatastudio/example-connectors/issues/new
[package download counts]: https://github.com/npm/registry/blob/master/docs/download-counts.md
[DEVELOP.md]: ./DEVELOP.md
