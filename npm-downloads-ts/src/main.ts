const DEFAULT_PACKAGE = "@google/dscc-gen";

// https://devsite.googleplex.com/datastudio/connector/reference#getauthtype
function getAuthType(): GetAuthTypeResponse {
  const AuthTypes = cc.AuthType;
  return cc
    .newAuthTypeResponse()
    .setAuthType(AuthTypes.NONE)
    .build();
}

const cc = DataStudioApp.createCommunityConnector();

// https://devsite.googleplex.com/datastudio/connector/reference#isadminuser
function isAdminUser(): boolean {
  return false;
}

// https://devsite.googleplex.com/datastudio/connector/reference#getconfig
function getConfig(request: GetConfigRequest): GetConfigResponse {
  const config = cc.getConfig();

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
  const fields = cc.getFields();
  const types = cc.FieldType;
  const aggregations = cc.AggregationType;

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
  const configParams = cleanUpConfig(request.configParams);
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
        responses.concat(
          fetchPackagesData(request.dateRange, scopedPackage, false)
        ),
      []
    );
    const nonScopedResponse =
      nonScopedPackages.length > 0
        ? fetchPackagesData(
            request.dateRange,
            nonScopedPackages.join(","),
            nonScopedPackages.length > 1
          )
        : [];

    const packagesData = scopedResponses.concat(nonScopedResponse);
    const data = toGetDataRows(packagesData, requestedFields);
    return {
      schema: requestedFields.build(),
      rows: data
    };
  } catch (e) {
    cc.newUserError()
      .setDebugText("Error fetching data from API. Exception details: " + e)
      .setText(
        "The connector has encountered an unrecoverable error. Please try again later, or file an issue if this error persists."
      )
      .throwException();
  }
}

function cleanUpConfig(configParams: ConfigParams): ConfigParams {
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

function normalizeAPIResponse(
  jsonString: string,
  bulkRequest: boolean = false
): PackageData[] {
  const parsed = JSON.parse(jsonString);
  if (bulkRequest) {
    // The bulk requests are keyed by package name, but since PackageData also
    // has the name, we can just flatten this down.
    return Object.keys(parsed).map(parsedKey => parsed[parsedKey]);
  }
  return [parsed];
}

function fetchPackagesData(
  dateRange: GetDataRequest["dateRange"],
  packagesString: string,
  bulkRequest: boolean
): PackageData[] {
  // TODO - change to template string.
  const url = [
    "https://api.npmjs.org/downloads/range/",
    dateRange.startDate,
    ":",
    dateRange.endDate,
    "/",
    packagesString
  ].join("");

  const response = UrlFetchApp.fetch(url);
  const jsonString = response.getContentText();
  return normalizeAPIResponse(jsonString, bulkRequest);
}

function toGetDataRows(
  response: PackageData[],
  requestedFields: Fields
): GetDataRows {
  const data: GetDataRows = [];
  response.forEach(function(packageData: PackageData) {
    packageData.downloads.forEach(function(downloads) {
      const row: GetDataRowValue[] = requestedFields
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
