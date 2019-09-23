# Stepped Configuration

_This is not an official Google product._

This [Community Connector] shows how you can create a [stepped configuration] to
dynamically populate a city dropdown with options based on the selected state.

## Configuration

1.  First enter a state. The options are `California` & `Illinois`.
1.  Click next.
1.  Choose a city.
    +   If you selected `California` for the first question, your options will
        be `Montain View` or `San Fransisco`.
    +   If you selected `Illinois` for the first question, your options will be
        `Chicago` or `Springfield`.

## Set up this connector for personal use

To use this Community Connector in Data Studio there is a one-time setup to
deploy your own personal instance of the connector using Apps Script.

### Deploy the connector

Follow the [deployment guide] to deploy the Community Connector.

## Using the connector in Data Studio

Once you've set up and deployed the connector, follow the
[Use a Community Connector] guide to use the connector in Data Studio.

**Note**: After using the connector in Data Studio, as long as you do not
[revoke access], it will remain listed in the [connector list] for easy access
when [creating a new data source].

## Report An Issue

If you run into any issues with this connector, please [file an issue].

[Community Connector]: https://developers.google.com/datastudio/connector/
[stepped configuration]: https://developers.google.com/datastudio/connector/stepped-configuration
[Google Data Studio]: https://datastudio.google.com/
[file an issue]: https://github.com/googledatastudio/example-connectors/issues/new
[Latest Version (Head)]: https://datastudio.google.com/datasources/create?connectorId=AKfycbwYedXtOVx_Vt0yCILmv7srozK9lGiJBAJkHM7XRm8
[deployment guide]: ../DEPLOY.md
[Use a Community Connector]: https://developers.google.com/datastudio/connector/use
[revoke access]: https://support.google.com/datastudio/answer/9053467
[connector list]: https://datastudio.google.com/c/datasources/create
[creating a new data source]: https://support.google.com/datastudio/answer/6300774
