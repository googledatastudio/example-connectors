// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Community Connector for npm package download count data. This
 * can retrieve download count for one or multiple packages from npm by date.
 *
 */

var cc = DataStudioApp.createCommunityConnector();
var DEFAULT_PACKAGE = "googleapis";

// https://devsite.googleplex.com/datastudio/connector/reference#getauthtype
function getAuthType() {
  var AuthTypes = cc.AuthType;
  return cc
    .newAuthTypeResponse()
    .setAuthType(AuthTypes.NONE)
    .build();
}

// https://devsite.googleplex.com/datastudio/connector/reference#getconfig
function getConfig() {
  var config = cc.getConfig();

  config
    .newInfo()
    .setId("instructions")
    .setText(
      "Enter npm package names to fetch their download count. An invalid or blank entry will revert to the default value."
    );

  config
    .newTextInput()
    .setId("package")
    .setName(
      "Enter a single package name or multiple names separated by commas (no spaces!)"
    )
    .setHelpText('e.g. "googleapis" or "package,somepackage,anotherpackage"')
    .setPlaceholder(DEFAULT_PACKAGE)
    .setAllowOverride(true);

  config.setDateRangeRequired(true);

  return config.build();
}

function getFields() {
  var fields = cc.getFields();
  var types = cc.FieldType;
  var aggregations = cc.AggregationType;

  fields
      .newDimension()
      .setId("id")
      .setName("Id")
      .setType(types.TEXT);

  fields
      .newMetric()
      .setId("distance")
      .setName("Distance")
      .setType(types.NUMBER)
      .setAggregation(aggregations.SUM);

  return fields;
}

// https://devsite.googleplex.com/datastudio/connector/reference#getschema
function getSchema(request) {
  return { schema: getFields().build() };
}

// https://devsite.googleplex.com/datastudio/connector/reference#getdata
function getData(request) {
  request.configParams = validateConfig(request.configParams);

  var requestedFields = getFields().forIds(
    request.fields.map(function(field) {
      return field.name;
    })
  );

  try {
    var apiResponse = fetchDataFromApi(request);
    var normalizedResponse = normalizeResponse(request, apiResponse);
    var data = getFormattedData(normalizedResponse, requestedFields);
  } catch (e) {
    cc.newUserError()
      .setDebugText("Error fetching data from API. Exception details: " + e)
      .setText(
        "The connector has encountered an unrecoverable error. Please try again later, or file an issue if this error persists."
      )
      .throwException();
  }

  return {
    schema: requestedFields.build(),
    rows: data
  };
}

// https://devsite.googleplex.com/datastudio/connector/reference#isadminuser
function isAdminUser() {
  return false;
}

/**
 * Formats the parsed response from external data source into correct tabular
 * format and returns only the requestedFields
 *
 * @param {Object} parsedResponse The response string from external data source
 *     parsed into an object in a standard format.
 * @param {Array} requestedFields The fields requested in the getData request.
 * @returns {Array} Array containing rows of data in key-value pairs for each
 *     field.
 */
function getFormattedData(response, requestedFields) {
  var data = [];
  Object.keys(response).map(function(packageName) {
    var package = response[packageName];
    var downloadData = package.downloads;
    var formattedData = downloadData.map(function(dailyDownload) {
      return formatData(requestedFields, packageName, dailyDownload);
    });
    data = data.concat(formattedData);
  });
  return data;
}

/**
 * Validates config parameters and provides missing values.
 aram {Object} request Data request parameters.
 * @returns {string} Response text for UrlFetchApp.
 */
function fetchDataFromApi(request) {
  var url = [
    "https://api.npmjs.org/downloads/range/",
    request.dateRange.startDate,
    ":",
    request.dateRange.endDate,
    "/",
    request.configParams.package
  ].join("");
  var response = UrlFetchApp.fetch(url);
  return response;
}

/**
 * Parses response string into an object. Also standardizes the object structure
 * for single vs multiple packages.
 *
 * @param {Object} request Data request parameters.
 * @param {string} responseString Response from the API.
 * @return {Object} Contains package names as keys and associated download count
 *     information(object) as values.
 */
function normalizeResponse(request, responseString) {
  var response = JSON.parse(responseString);
  var package_list = request.configParams.package.split(",");
  var mapped_response = {};

  if (package_list.length == 1) {
    mapped_response[package_list[0]] = response;
  } else {
    mapped_response = response;
  }

  return mapped_response;
}

/**
 * Formats a single row of data into the required format.
 *
 * @param {Object} requestedFields Fields requested in the getData request.
 * @param {string} packageName Name of the package who's download data is being
 *    processed.
 * @param {Object} dailyDownload Contains the download data for a certain day.
 * @returns {Object} Contains values for requested fields in predefined format.
 */
function formatData(requestedFields, packageName, dailyDownload) {
  var row = requestedFields.asArray().map(function(requestedField) {
    switch (requestedField.getId()) {
      case "day":
        return dailyDownload.day.replace(/-/g, "");
      case "downloads":
        return dailyDownload.downloads;
      case "packageName":
        return packageName;
      default:
        return "";
    }
  });
  return { values: row };
}
