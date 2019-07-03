/*
 * This file is only to demonstrate how the `getData()` fucntion would look
 * like without the Firebase Realtime Database caching. It is not a part of
 * the connector code and should not be included in Apps Script / Clasp.
 */

function getData(request) {
  var requestedFields = getFields().forIds(
    request.fields.map(function(field) {
      return field.name;
    })
  );

  var fetchedData = fetchAndParseData(request);
  var data = getFormattedData(fetchedData, requestedFields);

  return {
    schema: requestedFields.build(),
    rows: data
  };
}
