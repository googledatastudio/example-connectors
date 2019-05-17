const DEFAULT_PACKAGE = "@google/dscc-gen";

// https://devsite.googleplex.com/datastudio/connector/reference#getauthtype
function getAuthType(): GetAuthTypeResponse {
  var AuthTypes = cc.AuthType;
  return cc
    .newAuthTypeResponse()
    .setAuthType(AuthTypes.NONE)
    .build();
}

var cc = DataStudioApp.createCommunityConnector();

// https://devsite.googleplex.com/datastudio/connector/reference#isadminuser
function isAdminUser(): boolean {
  return false;
}

// https://devsite.googleplex.com/datastudio/connector/reference#getconfig
function getConfig(request: GetConfigRequest): GetConfigResponse {
  var config = cc.getConfig();

  config
    .newInfo()
    .setId("instructions")
    .setText(
      "Enter one or more npm package names to fetch their download count."
    );

  config
    .newTextInput()
    .setId("package")
    .setName("Enter one or more package names separated by commas.")
    .setHelpText('e.g. "googleapis" or "@google/dscc-gen,@google/dscc-scripts"')
    .setPlaceholder(DEFAULT_PACKAGE)
    .setAllowOverride(true);

  config.setDateRangeRequired(true);

  return config.build();
}

type Fields = GoogleAppsScript.Data_Studio.Fields;
function getFields(): Fields {
  var fields = cc.getFields();
  var types = cc.FieldType;
  var aggregations = cc.AggregationType;

  fields
    .newDimension()
    .setId("packageName")
    .setName("Package")
    .setType(types.TEXT);

  fields
    .newDimension()
    .setId("day")
    .setName("Date")
    .setType(types.YEAR_MONTH_DAY);

  fields
    .newMetric()
    .setId("downloads")
    .setName("Downloads")
    .setType(types.NUMBER)
    .setAggregation(aggregations.SUM);

  return fields;
}

// https://devsite.googleplex.com/datastudio/connector/reference#getschema
function getSchema(request: GetSchemaRequest): GetSchemaResponse {
  return { schema: getFields().build() };
}

type DashedDate = string; // "2014-01-01"
interface PackageData {
  downloads: Array<{
    day: DashedDate;
    downloads: number;
  }>;
  start: DashedDate;
  end: DashedDate;
  package: string;
}

// https://devsite.googleplex.com/datastudio/connector/reference#getdata
function getData(request: GetDataRequest): GetDataResponse {
  request.configParams = validateConfig(request.configParams);
  const requestedFields = getFields().forIds(
    request.fields.map(({ name }) => name)
  );

  try {
    var npmResponseJSON = fetchDataFromApi(request).getContentText();

    const {
      configParams: { package }
    } = request;
    const packages = package.split(",");
    var packagesData: PackageData[];
    if (packages.length > 1) {
      packagesData = JSON.parse(npmResponseJSON);
    } else {
      var packageData: PackageData = JSON.parse(npmResponseJSON);
      packagesData = [packageData];
    }
    var data = toGetDataRows(packagesData, requestedFields);
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

function validateConfig(configParams: ConfigParams): ConfigParams {
  configParams = configParams || {};
  configParams.package = configParams.package || DEFAULT_PACKAGE;

  configParams.package = configParams.package
    .split(",")
    .map(function(x) {
      return x.trim();
    })
    .join(",");

  return configParams;
}

function fetchDataFromApi(request: GetDataRequest) {
  // TODO - scoped packages are supported in bulk queries, so we need to make
  // multiple fetches if there is more than one package & they use scoped packages.
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

function toGetDataRows(
  response: PackageData[],
  requestedFields: Fields
): GetDataRows {
  var data: GetDataRows = [];
  response.forEach(function(packageData: PackageData) {
    packageData.downloads.forEach(function(downloads) {
      var row: GetDataRowValue[] = requestedFields
        .asArray()
        .map(function(requestedField) {
          switch (requestedField.getId()) {
            case "day":
              return downloads.day.replace(/-/g, "");
            case "downloads":
              return downloads.downloads;
            case "packageName":
              return packageData.package;
            default:
              return "";
          }
        });
      data.push({ values: row });
    });
  });
  return data;
}
