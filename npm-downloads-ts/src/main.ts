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

function logObject(s: any) {
  cc.newDebugError()
    .setText(JSON.stringify(s))
    .throwException();
}

// https://devsite.googleplex.com/datastudio/connector/reference#getdata
function getData(request: GetDataRequest): GetDataResponse {
  const configParams = validateConfig(request.configParams);
  const requestedFields = getFields().forIds(
    request.fields.map(({ name }) => name)
  );

  try {
    const { package } = configParams;
    const packages = package.split(",");
    const scopedPackages = packages.filter(p => p[0] === "@");
    const nonScopedPackages = packages.filter(p => p[0] !== "@");

    const scopedResponses = scopedPackages.reduce(
      (responses: PackageData[], scopedPackage: string) =>
        responses.concat(fetchPackagesData(request.dateRange, scopedPackage)),
      []
    );
    const nonScopedResponse =
      nonScopedPackages.length > 0
        ? fetchPackagesData(request.dateRange, nonScopedPackages.join(","))
        : [];

    var packagesData = scopedResponses.concat(nonScopedResponse);
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

function normalizeAPIResponse(jsonString: string): PackageData[] {
  const parsed = JSON.parse(jsonString);
  if (parsed instanceof Array) {
    return parsed;
  } else {
    return [parsed];
  }
}

function fetchPackagesData(
  dateRange: GetDataRequest["dateRange"],
  packagesString: string
): PackageData[] {
  // TODO - change to template string.
  var url = [
    "https://api.npmjs.org/downloads/range/",
    dateRange.startDate,
    ":",
    dateRange.endDate,
    "/",
    packagesString
  ].join("");
  var response = UrlFetchApp.fetch(url);
  var jsonString = response.getContentText();
  return normalizeAPIResponse(jsonString);
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
